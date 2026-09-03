import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserRole } from '@/lib/auth';
import { listIncidentsByRoute } from '@/lib/incidents-server';
import IncidentCard from '@/components/IncidentCard';
import CategoryDistributionCard from '@/components/CategoryDistributionCard';
import SeverityDistributionCard from '@/components/SeverityDistributionCard';
import SignOutButton from '@/components/SignOutButton';

export const dynamic = 'force-dynamic';

export default async function HRDashboardPage() {
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
  if (!role || !['hr_partner', 'hr_head'].includes(role)) {
    return (
      <main className="max-w-2xl mx-auto p-8">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="text-sm text-gray-600 mt-2">
          This page is restricted to HR Partner / HR Head roles. Your current
          role: <code>{role ?? 'none'}</code>.
        </p>
      </main>
    );
  }

  const incidents = await listIncidentsByRoute('hr', 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              HR Grievance Console
            </h1>
            <p className="text-xs text-gray-500">
              {user.email} · role: {role}
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <div className="text-3xl font-bold">{incidents.length}</div>
          <div className="text-sm text-gray-500">
            HR-routed incidents (last 100)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <CategoryDistributionCard incidents={incidents} />
          <SeverityDistributionCard incidents={incidents} />
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Recent incidents
        </h2>
        {incidents.length === 0 ? (
          <div className="border rounded-lg p-8 text-center bg-white">
            <p className="text-sm text-gray-600">
              No HR-routed incidents. Either the extension hasn&apos;t reported
              yet, or Supabase isn&apos;t configured (academic dev mode).
            </p>
          </div>
        ) : (
          incidents.map((i) => <IncidentCard key={i.id} incident={i} />)
        )}
      </main>
    </div>
  );
}
