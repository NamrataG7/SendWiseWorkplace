/**
 * Pattern detector cron. Detects `bullying_persistent` — 5+ hostile
 * incidents from the same employee_id_hash within 7 days.
 *
 * Auth: `x-cron-secret` header must match process.env.CRON_SECRET.
 * Idempotent per (employee_id_hash, ISO week) — a second insert in the same
 * week is a no-op.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-admin';
import { routeCategorySync } from '@/lib/routing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOSTILE_CATEGORIES = ['harassment_general', 'threats_intimidation'] as const;
const THRESHOLD = 5;

function isoWeekKey(d: Date): string {
  // Year-week key, e.g. "2026-W12"
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('x-cron-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      note: 'Supabase not configured — pattern detector no-op.',
      inserted: 0,
    });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();

  const { data, error } = await supabase
    .from('incidents')
    .select('employee_id_hash, category, session_id')
    .in('category', HOSTILE_CATEGORIES as unknown as string[])
    .gte('timestamp', sevenDaysAgo);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.employee_id_hash, (counts.get(row.employee_id_hash) ?? 0) + 1);
  }

  const now = new Date();
  const weekKey = isoWeekKey(now);
  const decision = routeCategorySync('bullying_persistent');
  const slaDeadline = new Date(now.getTime() + decision.sla_days * 86400_000).toISOString();

  let inserted = 0;
  for (const [hash, count] of Array.from(counts.entries())) {
    if (count < THRESHOLD) continue;

    // Idempotency: skip if we already inserted a bullying_persistent
    // incident for this hash in the current ISO week.
    const weekStart = (() => {
      const tmp = new Date(now);
      const day = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() - day + 1);
      tmp.setUTCHours(0, 0, 0, 0);
      return tmp.toISOString();
    })();

    const { data: existing } = await supabase
      .from('incidents')
      .select('id')
      .eq('employee_id_hash', hash)
      .eq('category', 'bullying_persistent')
      .gte('timestamp', weekStart)
      .limit(1);
    if (existing && existing.length > 0) continue;

    const { error: insErr } = await supabase.from('incidents').insert({
      employee_id_hash: hash,
      timestamp: now.toISOString(),
      category: 'bullying_persistent',
      severity: 'medium',
      action: 'detected',
      platform: 'other',
      session_id: `pattern-${weekKey}`,
      assigned_to_role: decision.route_to,
      sla_deadline: slaDeadline,
      status: 'open',
    });
    if (!insErr) inserted += 1;
  }

  return NextResponse.json({ ok: true, week: weekKey, inserted });
}
