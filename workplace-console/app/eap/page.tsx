import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserRole } from '@/lib/auth';
import { listIncidentsByRoute } from '@/lib/incidents-server';
import SignOutButton from '@/components/SignOutButton';
import EAPQueueClient from './eap-client';

export const dynamic = 'force-dynamic';

export default async function EAPQueuePage() {
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
  if (role !== 'eap') {
    return (
      <main className="max-w-2xl mx-auto p-8">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="text-sm text-gray-600 mt-2">
          Restricted to the EAP role. Your role: <code>{role ?? 'none'}</code>.
        </p>
      </main>
    );
  }

  const incidents = await listIncidentsByRoute('eap', 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Employee Assistance Programme — Queue
            </h1>
            <p className="text-xs text-gray-500">
              {user.email} · role: {role} · Duty-of-care escalation flow
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6">
        <EAPQueueClient incidents={incidents} />
      </main>
    </div>
  );
}
