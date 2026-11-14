import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function handle(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const reason = new URL(request.url).searchParams.get('reason');
  return NextResponse.redirect(new URL(reason ? `/login?error=${reason}` : '/login', request.url), { status: 303 });
}
export const GET = handle;
export const POST = handle;
