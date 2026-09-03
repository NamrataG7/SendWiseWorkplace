import type { Incident, SeverityLevel, IncidentCategory, Platform } from '@/lib/types';

const severityBadge: Record<SeverityLevel, string> = {
  high: 'bg-red-600 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-gray-400 text-white',
};

const categoryLabels: Record<IncidentCategory, string> = {
  sexual_harassment: 'Sexual harassment',
  hate_speech_caste_religion: 'Hate speech — caste / religion',
  hate_speech_gender_lgbtq: 'Hate speech — gender / LGBTQ',
  hate_speech_disability: 'Hate speech — disability',
  hate_speech_race: 'Hate speech — race',
  threats_intimidation: 'Threats / intimidation',
  harassment_general: 'General harassment',
  bullying_persistent: 'Persistent bullying (pattern)',
  power_abuse: 'Power abuse',
  self_harm: 'Self-harm signal',
  psychological_safety_erosion: 'Psychological safety erosion',
};

const platformLabels: Record<Platform, string> = {
  slack: 'Slack',
  teams: 'Teams',
  gmail: 'Gmail',
  outlook: 'Outlook',
  google_chat: 'Google Chat',
  other: 'Other',
};

export function categoryLabel(c: IncidentCategory): string {
  return categoryLabels[c] ?? c;
}
export function platformLabel(p: Platform): string {
  return platformLabels[p] ?? p;
}

export function daysUntil(iso: string): number {
  return Math.ceil((Date.parse(iso) - Date.now()) / 86400_000);
}

export default function IncidentCard({ incident }: { incident: Incident }) {
  const ts = new Date(incident.timestamp).toLocaleString();
  return (
    <div className="border rounded-lg p-4 mb-3 bg-white shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-semibold text-gray-900">
            {categoryLabels[incident.category]}
          </div>
          <div className="text-xs text-gray-500">
            {ts} · {platformLabels[incident.platform]} · employee{' '}
            <code className="text-[11px]">
              {incident.employee_id_hash.slice(0, 10)}…
            </code>
          </div>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${severityBadge[incident.severity]}`}
        >
          {incident.severity}
        </span>
      </div>
      <div className="text-xs text-gray-600 italic">
        Metadata only. Message content is analysed on-device and never leaves
        the employee&apos;s machine.
      </div>
    </div>
  );
}
