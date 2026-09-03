import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-900">
          SendWiseWorkplace Console
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Privacy-preserving workplace harassment nudge system. Category-routed
          to the correct authority — PoSH IC, HR, EAP, or Legal.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/hr"
            className="rounded-lg border border-gray-200 p-4 hover:border-indigo-500 hover:bg-indigo-50 transition"
          >
            <div className="font-semibold text-gray-900">HR Console</div>
            <div className="text-xs text-gray-500 mt-1">
              Grievance intake, category distribution.
            </div>
          </Link>
          <Link
            href="/posh"
            className="rounded-lg border border-gray-200 p-4 hover:border-indigo-500 hover:bg-indigo-50 transition"
          >
            <div className="font-semibold text-gray-900">PoSH IC Queue</div>
            <div className="text-xs text-gray-500 mt-1">
              90-day statutory countdown per case.
            </div>
          </Link>
          <Link
            href="/eap"
            className="rounded-lg border border-gray-200 p-4 hover:border-indigo-500 hover:bg-indigo-50 transition"
          >
            <div className="font-semibold text-gray-900">EAP Queue</div>
            <div className="text-xs text-gray-500 mt-1">
              Self-harm + persistent bullying, consent-based contact.
            </div>
          </Link>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <Link href="/login" className="underline hover:text-indigo-700">
            Sign in
          </Link>{' '}
          ·{' '}
          <Link href="/privacy" className="underline hover:text-indigo-700">
            Privacy
          </Link>{' '}
          ·{' '}
          <Link href="/terms" className="underline hover:text-indigo-700">
            Terms
          </Link>
        </div>
      </div>
    </main>
  );
}
