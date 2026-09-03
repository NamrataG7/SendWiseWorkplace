/**
 * Dual-control co-approval endpoint. See migration 006_dual_control.sql.
 *
 * POST body: { incident_id: string, action: 'deanonymize' }
 * Requires an authenticated user with role hr_head OR posh_ic_chair.
 * Returns { status: 'pending' | 'approved' }.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getUserRole } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APPROVER_ROLES = ['hr_head', 'posh_ic_chair'] as const;
type ApproverRole = (typeof APPROVER_ROLES)[number];

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserRole(user.id);
  if (!role || !APPROVER_ROLES.includes(role as ApproverRole)) {
    return NextResponse.json(
      { error: 'Only hr_head or posh_ic_chair can co-approve.' },
      { status: 403 },
    );
  }

  let body: { incident_id?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.incident_id || body.action !== 'deanonymize') {
    return NextResponse.json(
      { error: 'Body must be { incident_id, action: "deanonymize" }' },
      { status: 400 },
    );
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({
      status: 'pending',
      note: 'Supabase not configured — dry-run.',
    });
  }

  // Find or create the request row.
  let requestId: string;
  const { data: existing } = await supabase
    .from('dual_control_requests')
    .select('id, status')
    .eq('incident_id', body.incident_id)
    .eq('action', 'deanonymize')
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (existing) {
    requestId = existing.id as string;
    if (existing.status === 'approved') {
      return NextResponse.json({ status: 'approved' });
    }
  } else {
    const { data: created, error: createErr } = await supabase
      .from('dual_control_requests')
      .insert({
        incident_id: body.incident_id,
        action: 'deanonymize',
        requested_by: user.id,
      })
      .select('id')
      .single();
    if (createErr || !created) {
      return NextResponse.json(
        { error: createErr?.message ?? 'Failed to create request' },
        { status: 500 },
      );
    }
    requestId = created.id as string;
  }

  // Insert this approval (unique on (request_id, approver_role) enforces distinct-role rule).
  const { error: apprErr } = await supabase
    .from('dual_control_approvals')
    .insert({
      request_id: requestId,
      incident_id: body.incident_id,
      approver_id: user.id,
      approver_role: role,
    });
  if (apprErr) {
    // Duplicate approval from same role / user — treat as no-op.
    if (!/duplicate|unique/i.test(apprErr.message)) {
      return NextResponse.json({ error: apprErr.message }, { status: 500 });
    }
  }

  // Re-check status (trigger flips to 'approved' once two distinct roles have signed).
  const { data: fresh } = await supabase
    .from('dual_control_requests')
    .select('status')
    .eq('id', requestId)
    .single();

  return NextResponse.json({
    status: (fresh?.status as 'pending' | 'approved') ?? 'pending',
  });
}
