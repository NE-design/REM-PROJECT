import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Profile = { id: string; email: string | null; full_name: string | null; role: 'owner' | 'employee'; is_active: boolean };

export async function requireProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const profile = data as Profile | null;
  if (!profile || !profile.is_active) redirect('/auth/signout?reason=inactive');
  return { supabase, profile };
}

export async function requireOwner() {
  const ctx = await requireProfile();
  if (ctx.profile.role !== 'owner') redirect('/');
  return ctx;
}
