/**
 * Category-routing engine. See docs/PLAN.md routing table.
 *
 * Reads from the `category_route` table when Supabase is configured; falls
 * back to a hard-coded IN map that mirrors the seed rows in migration 004.
 * The fallback is what lets local dev / academic builds work with no DB.
 */

import { getServiceSupabase } from './supabase-admin';
import type { IncidentCategory, RouteTarget } from './types';

export interface RouteDecision {
  route_to: RouteTarget;
  sla_days: number;
}

// Deterministic fallback — matches the IN seed rows in migration 004.
const FALLBACK_IN: Record<IncidentCategory, RouteDecision> = {
  sexual_harassment: { route_to: 'posh_ic', sla_days: 90 },
  hate_speech_caste_religion: { route_to: 'legal', sla_days: 30 },
  hate_speech_gender_lgbtq: { route_to: 'hr', sla_days: 30 },
  hate_speech_disability: { route_to: 'hr', sla_days: 30 },
  hate_speech_race: { route_to: 'legal', sla_days: 30 },
  threats_intimidation: { route_to: 'security', sla_days: 7 },
  harassment_general: { route_to: 'hr', sla_days: 30 },
  bullying_persistent: { route_to: 'hr', sla_days: 30 },
  power_abuse: { route_to: 'hr', sla_days: 30 },
  self_harm: { route_to: 'eap', sla_days: 3 },
  psychological_safety_erosion: { route_to: 'hr', sla_days: 60 },
};

export async function routeCategory(
  category: IncidentCategory,
  jurisdiction: string = 'IN',
): Promise<RouteDecision> {
  const supabase = getServiceSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('category_route')
        .select('route_to, sla_days')
        .eq('category', category)
        .eq('jurisdiction', jurisdiction)
        .maybeSingle();
      if (!error && data) {
        return { route_to: data.route_to as RouteTarget, sla_days: data.sla_days as number };
      }
    } catch {
      // Fall through to fallback.
    }
  }
  return FALLBACK_IN[category];
}

export function routeCategorySync(category: IncidentCategory): RouteDecision {
  return FALLBACK_IN[category];
}
