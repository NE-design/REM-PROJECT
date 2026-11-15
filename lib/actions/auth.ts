'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  });
  if (error) redirect(`/login?error=invalid&detail=${encodeURIComponent(error.message)}`);
  redirect('/');
}

export async function requestReset(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(String(formData.get('email') ?? '').trim(), {
    redirectTo: `${site()}/auth/confirm?next=/set-password`,
  });
  // Ίδια απάντηση πάντα, ώστε να μη φαίνεται ποια email υπάρχουν.
  redirect('/forgot-password?sent=1');
}

export async function setPassword(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  if (password.length < 10) redirect('/set-password?error=short');
  if (password !== confirm) redirect('/set-password?error=mismatch');
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect('/set-password?error=failed');
  redirect('/');
}
