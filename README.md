This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# ZeroHour

 returns a structured verdict:
- **Verdict** — true positive / false positive / needs review, with confidence
- **MITRE ATT&CK mapping** — the techniques the activity corresponds to
- **Evidence** — the specific signals supporting the call
- **Exposure profile** — what's at risk if it's real
- **Containment steps** and **next steps** — concrete recommended actions
- **CISO summary** — a plain-language write-up for leadership
- **Time saved** — estimated analyst minutes saved vs. manual triage

Built on an LLM with a strict output schema (`lib/schema.ts`, `lib/prompt.ts`) so every response is structured and auditable rather than free text.

**2. Post-quantum cryptography scanner** (`pqc-service/`)
A Python service that inspects certificates, SSH keys, and TLS cipher suites and flags quantum-vulnerable algorithms (e.g. RSA-2048, ECDSA P-256) versus post-quantum-ready ones (e.g. ML-DSA). Helps answer "where is my crypto exposed once quantum matters?"

## Sample scenarios included
Credential theft · PowerShell false positive · impossible travel · OAuth abuse · synthetic identity (`data/alerts/`).

## Stack
- **Front end / API:** Next.js + TypeScript (`app/api/triage/route.ts`, dashboard components in `components/`)
- **Crypto scanner:** Python (`pqc-service/main.py`)

## Running locally
```bash
# 1. Front end
cp .env.local.example .env.local   # add your LLM API key
npm install
npm run dev                        # http://localhost:3000

# 2. PQC scanner
cd pqc-service
pip install -r requirements.txt
python main.py
```
