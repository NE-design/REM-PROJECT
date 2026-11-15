'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const back = (q: string) => redirect(`/admin/users?${q}`);

// Δημιουργία υπαλλήλου με προσωρινό κωδικό (χωρίς email). Ο Owner δίνει τα στοιχεία στον υπάλληλο.
export async function createEmployee(formData: FormData) {
  await requireOwner();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const full_name = String(formData.get('full_name') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email) back('error=' + encodeURIComponent('Συμπλήρωσε email.'));
  if (password.length < 10) back('error=' + encodeURIComponent('Ο κωδικός πρέπει να έχει τουλάχιστον 10 χαρακτήρες.'));
  const { error } = await createAdminClient().auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name },
  });
  if (error) back('error=' + encodeURIComponent(error.message));
  revalidatePath('/admin/users');
  back('ok=created');
}

export async function resetEmployeePassword(formData: FormData) {
  const { supabase } = await requireOwner();
  const userId = String(formData.get('user_id'));
  const password = String(formData.get('password') ?? '');
  if (password.length < 10) back('error=' + encodeURIComponent('Ο κωδικός πρέπει να έχει τουλάχιστον 10 χαρακτήρες.'));
  const { data: target } = await supabase.from('profiles').select('role').eq('id', userId).single();
  if (!target || target.role !== 'employee') back('error=' + encodeURIComponent('Μη έγκυρος χρήστης.'));
  const { error } = await createAdminClient().auth.admin.updateUserById(userId, { password });
  if (error) back('error=' + encodeURIComponent(error.message));
  back('ok=pwd');
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
