import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import {
  ViolationIngestSchema,
  FORBIDDEN_CONTENT_FIELDS,
} from '@/lib/schema';
import { routeCategory, routeCategorySync } from '@/lib/routing';
import { getServiceSupabase } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_LIMIT_PER_HOUR = 100;
const LIST_CAP = 1000;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Privacy guard: reject any content-bearing fields outright.
  if (body && typeof body === 'object') {
    for (const forbidden of FORBIDDEN_CONTENT_FIELDS) {
      if (forbidden in (body as Record<string, unknown>)) {
        return NextResponse.json(
          {
            error: `Field "${forbidden}" is not permitted. This endpoint accepts metadata only.`,
          },
          { status: 400 },
        );
      }
    }
  }

  const parsed = ViolationIngestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const v = parsed.data;

  // Rate limit: 100 req/hour per user_id_hash
  const rlKey = `ratelimit:violations:${v.user_id_hash}`;
  const count = await redis.incr(rlKey);
  if (count === 1) {
    await redis.expire(rlKey, 3600);
  }
  if (count > RATE_LIMIT_PER_HOUR) {
    const ttl = await redis.ttl(rlKey);
    return NextResponse.json(
      { error: 'Rate limit exceeded', retry_after_seconds: ttl },
      { status: 429 },
    );
  }

  // Cache a copy in Redis (best-effort — used by dev/inspection tooling).
  const listKey = `violations:${v.user_id_hash}`;
  await redis.lpush(listKey, JSON.stringify(v));
  await redis.ltrim(listKey, 0, LIST_CAP - 1);

  // Route to the correct authority + insert into incidents.
  const supabase = getServiceSupabase();
  let decision;
  try {
    decision = await routeCategory(v.category, 'IN');
  } catch {
    decision = routeCategorySync(v.category);
  }
  const slaDeadline = new Date(
    Date.parse(v.timestamp) + decision.sla_days * 86400_000,
  ).toISOString();

  if (supabase) {
    const { error } = await supabase.from('incidents').insert({
      employee_id_hash: v.user_id_hash,
      timestamp: v.timestamp,
      category: v.category,
      severity: v.severity,
      action: v.action,
      platform: v.platform,
      session_id: v.session_id,
      assigned_to_role: decision.route_to,
      sla_deadline: slaDeadline,
      status: 'open',
    });
    if (error) {
      // Log server-side; return ok anyway so the extension keeps firing.
      // eslint-disable-next-line no-console
      console.warn('[violations] insert failed:', error.message);
    }
  } else {
    // eslint-disable-next-line no-console
    console.info(
      '[violations] Supabase not configured — skipping incident insert. Category=%s Route=%s SLA=%d',
      v.category,
      decision.route_to,
      decision.sla_days,
    );
  }

  return NextResponse.json({
    ok: true,
    routed_to: decision.route_to,
    sla_deadline: slaDeadline,
  });
}
