import 'server-only';
import { createClient } from '@supabase/supabase-js';

// ΜΟΝΟ για server actions του Owner (προσκλήσεις, αποκλεισμός χρηστών). Ποτέ στον browser.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
