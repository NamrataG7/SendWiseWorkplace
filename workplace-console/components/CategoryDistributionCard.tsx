import type { Incident, IncidentCategory } from '@/lib/types';
import { categoryLabel } from './IncidentCard';

export default function CategoryDistributionCard({ incidents }: { incidents: Incident[] }) {
  const counts = new Map<IncidentCategory, number>();
  for (const i of incidents) {
    counts.set(i.category, (counts.get(i.category) ?? 0) + 1);
  }
  const rows = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const max = rows[0]?.[1] ?? 0;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">
        Category distribution
      </h3>
      {rows.length === 0 ? (
        <div className="text-sm text-gray-500">No incidents yet.</div>
      ) : (
        <ul className="space-y-2">
          {rows.map(([cat, n]) => (
            <li key={cat}>
              <div className="flex justify-between text-xs mb-0.5">
                <span>{categoryLabel(cat)}</span>
                <span className="font-mono">{n}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded">
                <div
                  className="h-2 bg-indigo-500 rounded"
                  style={{ width: `${max ? (n / max) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
