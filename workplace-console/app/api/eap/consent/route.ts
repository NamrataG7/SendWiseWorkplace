/**
 * Stub EAP consent endpoint. Records a metadata-only audit entry that
 * EAP contacted the employee (with consent) for a given incident. Does NOT
 * store any employee-identifying content beyond the incident_id.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getUserRole } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserRole(user.id);
  if (role !== 'eap') {
    return NextResponse.json({ error: 'Only EAP role may call this endpoint.' }, { status: 403 });
  }

  let body: { incident_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.incident_id) {
    return NextResponse.json({ error: 'incident_id required' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: true, note: 'Supabase not configured — dry-run.' });
  }

  const { error } = await supabase.rpc('p_append_audit', {
    p_actor_id: user.id,
    p_actor_role: role,
    p_action: 'eap.contact_employee_with_consent',
    p_target_type: 'incident',
    p_target_id: body.incident_id,
    p_payload_hash: null,
    p_context: { source: 'eap_console' },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
