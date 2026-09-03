import type { Incident, SeverityLevel } from '@/lib/types';

const order: SeverityLevel[] = ['high', 'medium', 'low'];
const colors: Record<SeverityLevel, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-gray-400',
};

export default function SeverityDistributionCard({ incidents }: { incidents: Incident[] }) {
  const counts: Record<SeverityLevel, number> = { high: 0, medium: 0, low: 0 };
  for (const i of incidents) counts[i.severity] += 1;
  const total = incidents.length || 1;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">
        Severity distribution
      </h3>
      <div className="space-y-2">
        {order.map((s) => (
          <div key={s}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="capitalize">{s}</span>
              <span className="font-mono">{counts[s]}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded">
              <div
                className={`h-2 ${colors[s]} rounded`}
                style={{ width: `${(counts[s] / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
