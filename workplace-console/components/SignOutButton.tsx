'use client';

import { createClient } from '@/utils/supabase/client';

export default function SignOutButton() {
  const onClick = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // env missing — ignore
    }
    window.location.assign('/login');
  };
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-sm rounded-md bg-gray-200 hover:bg-gray-300"
    >
      Sign out
    </button>
  );
}
