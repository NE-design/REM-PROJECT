import { requireProfile } from '@/lib/auth';
import { createProperty } from './actions';

export default async function PropertiesPage() {
  const { supabase, profile } = await requireProfile();
  const owner = profile.role === 'owner';
  const { data: props } = await supabase.from('properties').select('*').order('name');
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Ακίνητα</h1>
      <p className="mb-8 mt-1 text-mut">{owner ? 'Όλα τα ακίνητα.' : 'Βλέπεις μόνο τα ακίνητα που σου έχουν ανατεθεί. Δεν μπορείς να αλλάξεις τα στοιχεία τους.'}</p>

      {owner && (
        <form action={createProperty} className="card mb-6">
          <h2 className="mb-4 font-semibold">Νέο ακίνητο</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="name">Όνομα</label><input id="name" name="name" required className="input" /></div>
            <div><label className="label" htmlFor="address">Διεύθυνση</label><input id="address" name="address" className="input" /></div>
            <div className="grid grid-cols-3 gap-3 sm:col-span-2">
              <div><label className="label" htmlFor="area_sqm">Τ.μ.</label><input id="area_sqm" name="area_sqm" type="number" min="0" step="any" className="input" /></div>
              <div><label className="label" htmlFor="bedrooms">Υπνοδωμάτια</label><input id="bedrooms" name="bedrooms" type="number" min="0" className="input" /></div>
              <div><label className="label" htmlFor="bathrooms">Μπάνια</label><input id="bathrooms" name="bathrooms" type="number" min="0" className="input" /></div>
            </div>
            <div><label className="label" htmlFor="color">Χρώμα στο ημερολόγιο και στα γραφήματα</label><input id="color" name="color" type="color" defaultValue="#0b6e7a" className="h-10 w-20 rounded-lg border border-line bg-surf p-1" /></div>
          </div>
          <button className="btn btn-primary mt-4">Δημιουργία ακινήτου</button>
        </form>
      )}

      {props?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {props.map((p: any) => (
            <div key={p.id} className="card" style={{ borderTop: `3px solid ${p.color}` }}>
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm text-mut">{p.address || 'Χωρίς διεύθυνση'}</p>
              <p className="mt-3 text-sm">{[p.area_sqm && `${p.area_sqm} τ.μ.`, p.bedrooms != null && `${p.bedrooms} υπνοδωμάτια`, p.bathrooms != null && `${p.bathrooms} μπάνια`].filter(Boolean).join(' · ')}</p>
              <p className="mt-3 text-xs text-mut">Φάκελος: γενικά, σχέδια, manuals, marketing (σε επόμενο στάδιο)</p>
            </div>
          ))}
        </div>
      ) : <div className="empty">{owner ? 'Δεν υπάρχουν ακίνητα ακόμη. Δημιούργησε το πρώτο παραπάνω.' : 'Δεν έχεις πρόσβαση σε κανένα ακίνητο. Ζήτησε από τον διαχειριστή.'}</div>}
    </>
  );
}
