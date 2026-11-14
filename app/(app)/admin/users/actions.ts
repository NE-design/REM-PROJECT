'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function inviteEmployee(formData: FormData) {
  await requireOwner();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const full_name = String(formData.get('full_name') ?? '').trim();
  if (!email) redirect('/admin/users?error=email');
  const { error } = await createAdminClient().auth.admin.inviteUserByEmail(email, {
    data: { full_name },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/set-password`,
  });
  if (error) redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  revalidatePath('/admin/users');
  redirect('/admin/users?ok=invited');
}

export async function setActive(formData: FormData) {
  const { supabase, profile } = await requireOwner();
  const userId = String(formData.get('user_id'));
  const active = formData.get('active') === 'true';
  if (userId === profile.id) return; // ο Owner δεν απενεργοποιεί τον εαυτό του
  await supabase.from('profiles').update({ is_active: active }).eq('id', userId);
  // Αποκλεισμός και σε επίπεδο Auth, ώστε να μη μπορεί να ανανεώσει τη σύνδεσή του.
  await createAdminClient().auth.admin.updateUserById(userId, { ban_duration: active ? 'none' : '876000h' });
  revalidatePath('/admin/users');
}

export async function setAccess(formData: FormData) {
  const { supabase, profile } = await requireOwner();
  const userId = String(formData.get('user_id'));
  const wanted = new Set(formData.getAll('property').map(String));
  const { data: cur } = await supabase.from('property_members').select('property_id').eq('user_id', userId);
  const have = new Set<string>((cur ?? []).map((r: any) => r.property_id));
  const add = [...wanted].filter((id) => !have.has(id)).map((property_id) => ({ user_id: userId, property_id, granted_by: profile.id }));
  const remove = [...have].filter((id) => !wanted.has(id));
  if (remove.length) await supabase.from('property_members').delete().eq('user_id', userId).in('property_id', remove);
  if (add.length) await supabase.from('property_members').insert(add);
  revalidatePath('/admin/users');
}
