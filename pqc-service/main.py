from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import polars as pl
import io, re

from cryptography import x509
from cryptography.hazmat.primitives.asymmetric import rsa, ec, dh, dsa, ed25519, ed448
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import UnsupportedAlgorithm

app = FastAPI(title="Zerohour PQC Scanner", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Classification logic ────────────────────────────────────────────────────

VULNERABLE_KEY_TYPES = (rsa.RSAPublicKey, ec.EllipticCurvePublicKey, dh.DHPublicKey, dsa.DSAPublicKey)
SAFE_KEY_TYPES       = (ed25519.Ed25519PublicKey, ed448.Ed448PublicKey)

CIPHER_SUITE_RULES = [
    # (regex pattern, classification, algorithm label, key_size_hint, recommendation)
    (r"TLS_RSA",           "QUANTUM_VULNERABLE",  "RSA key exchange",     2048, "ML-KEM-768 (FIPS 203)"),
    (r"TLS_DHE_RSA",       "QUANTUM_VULNERABLE",  "DHE-RSA key exchange", 2048, "ML-KEM-768 (FIPS 203)"),
    (r"TLS_ECDHE_RSA",     "QUANTUM_VULNERABLE",  "ECDHE-RSA",            256,  "ML-KEM-768 (FIPS 203) + ML-DSA-65 (FIPS 204)"),
    (r"TLS_ECDHE_ECDSA",   "QUANTUM_VULNERABLE",  "ECDHE-ECDSA",          256,  "ML-KEM-768 (FIPS 203) + ML-DSA-65 (FIPS 204)"),
    (r"AES_128",           "GROVER_WEAKENED",     "AES-128",              128,  "AES-256"),
    (r"SHA256|SHA_256",    "GROVER_WEAKENED",     "SHA-256",              256,  "SHA-384 or SHA-512"),
    (r"3DES",              "QUANTUM_VULNERABLE",  "3DES",                 112,  "AES-256-GCM + ML-KEM-768"),
    (r"ML_KEM|MLKEM|KYBER","QUANTUM_SAFE",        "ML-KEM",               768,  None),
    (r"ML_DSA|MLDSA|DILITHIUM","QUANTUM_SAFE",    "ML-DSA",               65,   None),
    (r"SLH_DSA|SLHDSA|SPHINCS","QUANTUM_SAFE",    "SLH-DSA",              128,  None),
]

def classify_public_key(pub_key, asset_name: str) -> dict:
    if isinstance(pub_key, rsa.RSAPublicKey):
        ks = pub_key.key_size
        return {
            "asset": asset_name,
            "algorithm": f"RSA-{ks}",
            "key_size": ks,
            "classification": "QUANTUM_VULNERABLE",
            "q_day_risk": "high" if ks < 3072 else "med",
            "hndl": True,
            "recommended_replacement": "ML-KEM-768 (FIPS 203) for key exchange; ML-DSA-65 (FIPS 204) for signatures",
        }
    elif isinstance(pub_key, ec.EllipticCurvePublicKey):
        ks = pub_key.key_size
        curve = pub_key.curve.name
        return {
            "asset": asset_name,
            "algorithm": f"ECDSA ({curve})",
            "key_size": ks,
            "classification": "QUANTUM_VULNERABLE",
            "q_day_risk": "high",
            "hndl": True,
            "recommended_replacement": "ML-DSA-65 (FIPS 204) for signatures; ML-KEM-768 (FIPS 203) for key exchange",
        }
    elif isinstance(pub_key, dsa.DSAPublicKey):
        ks = pub_key.key_size
        return {
            "asset": asset_name,
            "algorithm": f"DSA-{ks}",
            "key_size": ks,
            "classification": "QUANTUM_VULNERABLE",
            "q_day_risk": "high",
            "hndl": True,
            "recommended_replacement": "ML-DSA-65 (FIPS 204)",
        }
    elif isinstance(pub_key, (ed25519.Ed25519PublicKey, ed448.Ed448PublicKey)):
        name = "Ed25519" if isinstance(pub_key, ed25519.Ed25519PublicKey) else "Ed448"
        return {
            "asset": asset_name,
            "algorithm": name,
            "key_size": 256 if name == "Ed25519" else 448,
            "classification": "GROVER_WEAKENED",
            "q_day_risk": "low",
            "hndl": False,
            "recommended_replacement": "ML-DSA-65 (FIPS 204) for long-lived signing keys",
        }
    return {
        "asset": asset_name,
        "algorithm": "Unknown",
        "key_size": 0,
        "classification": "UNKNOWN",
        "q_day_risk": "unknown",
        "hndl": False,
        "recommended_replacement": "Manual review required",
    }


def scan_pem_cert(pem_bytes: bytes, filename: str) -> list[dict]:
    # Check for ML-DSA marker
    text = pem_bytes.decode("utf-8", errors="ignore")
    if "ML-DSA" in text or "id-ml-dsa" in text.lower():
        return [{
            "asset": filename,
            "algorithm": "ML-DSA-65 (FIPS 204)",
            "key_size": 1952,
            "classification": "QUANTUM_SAFE",
            "q_day_risk": "none",
            "hndl": False,
            "recommended_replacement": None,
        }]
    try:
        cert = x509.load_pem_x509_certificate(pem_bytes)
        pub = cert.public_key()
        result = classify_public_key(pub, filename)
        result["asset"] = f"{filename} (CN={cert.subject.get_attributes_for_oid(x509.oid.NameOID.COMMON_NAME)[0].value})"
        return [result]
    except Exception:
        pass
    # Try as SSH public key
    try:
        pub = serialization.load_ssh_public_key(pem_bytes.strip())
        return [classify_public_key(pub, filename)]
    except Exception:
        pass
    return []


def scan_cipher_suites(text: str, filename: str) -> list[dict]:
    findings = []
    seen = set()
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        for pattern, classification, alg, ks, replacement in CIPHER_SUITE_RULES:
            if re.search(pattern, line, re.IGNORECASE) and line not in seen:
                seen.add(line)
                findings.append({
                    "asset": f"{filename}: {line}",
                    "algorithm": alg,
                    "key_size": ks,
                    "classification": classification,
                    "q_day_risk": "high" if classification == "QUANTUM_VULNERABLE" else "low",
                    "hndl": classification == "QUANTUM_VULNERABLE",
                    "recommended_replacement": replacement,
                })
                break
    return findings


# ── Routes ──────────────────────────────────────────────────────────────────

class CbomEntry(BaseModel):
    asset: str
    algorithm: str
    key_size: int
    classification: str
    q_day_risk: str
    hndl: bool
    recommended_replacement: Optional[str]

class ScanResult(BaseModel):
    total_assets: int
    vulnerable_count: int
    vulnerable_pct: float
    hndl_assets: int
    findings: list[CbomEntry]
    cbom_version: str = "1.4"
    cbom_format: str = "CycloneDX"


@app.post("/scan", response_model=ScanResult)
async def scan(files: list[UploadFile] = File(...)):
    all_findings: list[dict] = []

    for upload in files:
        raw = await upload.read()
        name = upload.filename or "unknown"

        if name.endswith((".pem", ".crt", ".cer")):
            all_findings.extend(scan_pem_cert(raw, name))
        elif name.endswith((".pub",)):
            try:
                pub = serialization.load_ssh_public_key(raw.strip())
                all_findings.append(classify_public_key(pub, name))
            except Exception as e:
                raise HTTPException(400, f"Cannot parse SSH key {name}: {e}")
        elif name.endswith(".txt"):
            all_findings.extend(scan_cipher_suites(raw.decode("utf-8", errors="ignore"), name))
        else:
            raise HTTPException(400, f"Unsupported file type: {name}. Send .pem/.crt/.cer/.pub/.txt")

    if not all_findings:
        raise HTTPException(422, "No scannable crypto artifacts found in uploaded files")

    df = pl.DataFrame(all_findings)
    total = len(df)
    vulnerable = df.filter(pl.col("classification") == "QUANTUM_VULNERABLE").height
    hndl = df.filter(pl.col("hndl") == True).height

    return ScanResult(
        total_assets=total,
        vulnerable_count=vulnerable,
        vulnerable_pct=round(vulnerable / total * 100, 1) if total else 0.0,
        hndl_assets=hndl,
        findings=[CbomEntry(**row) for row in df.to_dicts()],
    )


@app.get("/health")
def health():
    return {"status": "ok", "service": "pqc-scanner"}


@app.get("/")
def root():
    return {
        "service": "Zerohour PQC Scanner",
        "version": "1.0.0",
        "endpoints": {"scan": "POST /scan (multipart files)", "health": "GET /health"},
    }
