import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

/**
 * Protects console pages and read-only APIs with Supabase auth.
 *
 * Protected (require Supabase session):
 *   - /                (landing — technically public, but we require session
 *                       so the /hr, /posh, /eap links land in the right place)
 *   - /hr, /posh, /eap
 *   - /api/admin/*     (co-approval)
 *   - /api/eap/*       (consent-contact stub)
 *
 * Public:
 *   - /login, /signup, /auth/callback
 *   - /privacy, /terms
 *   - POST /api/violations                    (extension ingest, unauthenticated)
 *   - GET  /api/cron/pattern-detect           (header-authed via x-cron-secret)
 *   - Static assets (_next, favicon, images)
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/auth/callback') ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Extension ingest — always public POST.
  if (pathname === '/api/violations' && method === 'POST') {
    return NextResponse.next();
  }

  // Cron endpoint — header-authed in the route itself.
  if (pathname.startsWith('/api/cron/')) {
    return NextResponse.next();
  }

  const isProtectedPage =
    pathname.startsWith('/hr') ||
    pathname.startsWith('/posh') ||
    pathname.startsWith('/eap');

  const isProtectedApi =
    pathname.startsWith('/api/admin/') || pathname.startsWith('/api/eap/');

  const { response, user } = await updateSession(req);

  if (!isProtectedPage && !isProtectedApi) {
    return response;
  }
  if (user) return response;

  if (isProtectedApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)',
  ],
};
