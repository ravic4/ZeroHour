import type { Alert, Verdict } from './schema';

import alert01 from '../data/alerts/alert-01-cred-theft.json';
import alert02 from '../data/alerts/alert-02-powershell-fp.json';
import alert03 from '../data/alerts/alert-03-impossible-travel.json';
import alert04 from '../data/alerts/alert-04-oauth-abuse.json';
import alert05 from '../data/alerts/alert-05-synthetic-identity.json';

const FIXTURES = [alert01, alert02, alert03, alert04, alert05] as Array<{
  alert: Alert;
  cachedVerdict: Verdict;
}>;

export function getDemoAlerts(): Alert[] {
  return FIXTURES.map((f) => f.alert);
}

export function getDemoVerdict(alertId: string): Verdict | null {
  const fixture = FIXTURES.find((f) => f.alert.id === alertId);
  return fixture?.cachedVerdict ?? null;
}

export const ALERT_LABELS: Record<string, { title: string; description: string }> = {
  'alert-01': {
    title: 'Credential Theft + Lateral Movement',
    description: 'Mimikatz LSASS dump + PsExec pivot to DC',
  },
  'alert-02': {
    title: 'Admin PowerShell Execution',
    description: 'Encoded PowerShell on domain controller',
  },
  'alert-03': {
    title: 'Impossible Travel Login',
    description: 'NY → Tokyo in 12 minutes, bulk data access',
  },
  'alert-04': {
    title: 'OAuth Token Abuse',
    description: 'Third-party app exfiltrating 6.4 GB via Graph API',
  },
  'alert-05': {
    title: 'AI Synthetic Identity Bypass',
    description: 'Deepfake voice + video defeated CFO MFA',
  },
};
