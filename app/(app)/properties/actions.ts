'use server';
import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/auth';

const num = (v: FormDataEntryValue | null) => (v && String(v).trim() !== '' ? Number(v) : null);

export async function createProperty(formData: FormData) {
  const { supabase, profile } = await requireOwner();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  await supabase.from('properties').insert({
    name,
    address: String(formData.get('address') ?? '').trim() || null,
    area_sqm: num(formData.get('area_sqm')),
    bedrooms: num(formData.get('bedrooms')),
    bathrooms: num(formData.get('bathrooms')),
    color: String(formData.get('color') ?? '#0b6e7a'),
    created_by: profile.id,
  });
  revalidatePath('/properties');
  revalidatePath('/');
}
