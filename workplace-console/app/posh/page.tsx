import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserRole } from '@/lib/auth';
import { listIncidentsByRoute } from '@/lib/incidents-server';
import { categoryLabel, daysUntil } from '@/components/IncidentCard';
import SignOutButton from '@/components/SignOutButton';

export const dynamic = 'force-dynamic';

function slaColor(days: number): string {
  if (days <= 7) return 'text-red-700 font-semibold';
  if (days <= 30) return 'text-amber-700 font-semibold';
  return 'text-gray-700';
}

export default async function PoshQueuePage() {
  let user;
  try {
    const supabase = createClient(await cookies());
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }
  if (!user) redirect('/login');

  const role = await getUserRole(user.id);
  if (!role || !['posh_ic_member', 'posh_ic_chair'].includes(role)) {
    return (
      <main className="max-w-2xl mx-auto p-8">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="text-sm text-gray-600 mt-2">
          Restricted to PoSH IC members. Your role: <code>{role ?? 'none'}</code>.
        </p>
      </main>
    );
  }

  const incidents = await listIncidentsByRoute('posh_ic', 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              PoSH Internal Committee — Case Queue
            </h1>
            <p className="text-xs text-gray-500">
              {user.email} · role: {role} · PoSH Act 2013 statutory timeline
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {incidents.length === 0 ? (
          <div className="border rounded-lg p-8 text-center bg-white">
            <p className="text-sm text-gray-600">No PoSH-routed cases.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-2">Case ID</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Reported</th>
                  <th className="px-4 py-2">SLA</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((i) => {
                  const days = daysUntil(i.sla_deadline);
                  return (
                    <tr key={i.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs">
                        {i.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-2">{categoryLabel(i.category)}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">
                        {new Date(i.timestamp).toLocaleDateString()}
                      </td>
                      <td className={`px-4 py-2 ${slaColor(days)}`}>
                        {days} days
                      </td>
                      <td className="px-4 py-2 capitalize">{i.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500 italic">
          Evidence chain: each case row is hash-linked to the append-only
          audit_log (migration 001). Chain integrity is verifiable per row via
          the payload_hash column.
        </div>
      </main>
    </div>
  );
}
