/**
 * Auth + role gating for the workplace console.
 *
 * Roles live in a `user_roles(auth_user_id, role)` table (see migration 004).
 * In academic dev with no DB, we support an env-var-based bypass:
 *   DEV_ROLE=<role>   (e.g. hr_partner, posh_ic_chair) — grants that role
 *                     to any authenticated user. Never enable in prod.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import type { Role } from './types';

export async function getSessionUser(): Promise<{ id: string; email: string | null } | null> {
  try {
    const supabase = createServerSupabase(await cookies());
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { id: user.id, email: user.email ?? null };
  } catch {
    return null;
  }
}

export async function getUserRole(userId: string): Promise<Role | null> {
  // Dev bypass — see file header.
  const devRole = process.env.DEV_ROLE as Role | undefined;
  if (devRole) return devRole;

  // Real path: look up user_roles table via anon client (RLS-protected).
  try {
    const supabase = createServerSupabase(await cookies()) as unknown as SupabaseClient;
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('auth_user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return (data.role as Role) ?? null;
  } catch {
    return null;
  }
}

/**
 * Require the current user to have one of `allowed` roles. Redirects to
 * `/login` if unauthenticated, or renders a 403-style error if the role
 * doesn't match. Returns `{user, role}` when access is granted.
 */
export async function requireRole(
  allowed: Role[],
): Promise<{ user: { id: string; email: string | null }; role: Role }> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const role = await getUserRole(user.id);
  if (!role || !allowed.includes(role)) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw new Error(
      `Access denied. This page requires one of: ${allowed.join(', ')}.`,
    );
  }
  return { user, role };
}
