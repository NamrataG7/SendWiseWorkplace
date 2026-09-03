/**
 * Server-side incident query helpers. Returns [] when Supabase is not
 * configured so pages still render in academic dev mode.
 */

import { getServiceSupabase } from './supabase-admin';
import type { Incident, RouteTarget } from './types';

export async function listIncidentsByRoute(
  route: RouteTarget,
  limit = 100,
): Promise<Incident[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('assigned_to_role', route)
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as Incident[];
}

export async function listIncidentsByRoutes(
  routes: RouteTarget[],
  limit = 100,
): Promise<Incident[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .in('assigned_to_role', routes)
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as Incident[];
}
