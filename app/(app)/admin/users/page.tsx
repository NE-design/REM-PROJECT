import { requireOwner } from '@/lib/auth';
import { inviteEmployee, setActive, setAccess } from './actions';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { supabase } = await requireOwner();
  const { error, ok } = await searchParams;
  const [{ data: employees }, { data: props }, { data: members }] = await Promise.all([
    supabase.from('profiles').select('id,email,full_name,is_active').eq('role', 'employee').order('created_at'),
    supabase.from('properties').select('id,name,color').order('name'),
    supabase.from('property_members').select('user_id,property_id'),
  ]);
  const has = (u: string, p: string) => (members ?? []).some((m: any) => m.user_id === u && m.property_id === p);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Χρήστες και πρόσβαση</h1>
      <p className="mb-8 mt-1 text-mut">Δημιούργησε λογαριασμούς υπαλλήλων και όρισε σε ποια ακίνητα έχουν πρόσβαση. Η αλλαγή ισχύει αμέσως.</p>
      {error && <p className="alert">Σφάλμα: {error === 'email' ? 'Συμπλήρωσε email.' : error}</p>}
      {ok && <p className="mb-4 rounded-lg border border-ok px-3 py-2 text-sm text-ok">Η πρόσκληση στάλθηκε.</p>}

      <form action={inviteEmployee} className="card mb-6">
        <h2 className="mb-4 font-semibold">Πρόσκληση νέου υπαλλήλου</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div><label className="label" htmlFor="full_name">Ονοματεπώνυμο</label><input id="full_name" name="full_name" className="input" /></div>
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" /></div>
          <button className="btn btn-primary">Αποστολή πρόσκλησης</button>
        </div>
      </form>

      {employees?.length ? employees.map((u: any) => (
        <div key={u.id} className="card mb-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><div className="font-semibold">{u.full_name || u.email}</div><div className="text-xs text-mut">{u.email} · {u.is_active ? 'Ενεργός' : 'Απενεργοποιημένος'}</div></div>
            <form action={setActive}>
              <input type="hidden" name="user_id" value={u.id} /><input type="hidden" name="active" value={String(!u.is_active)} />
              <button className="btn">{u.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}</button>
            </form>
          </div>
          <form action={setAccess}>
            <input type="hidden" name="user_id" value={u.id} />
            {props?.length ? props.map((p: any) => (
              <label key={p.id} className="flex items-center gap-3 border-t border-line py-2.5 text-sm">
                <input type="checkbox" name="property" value={p.id} defaultChecked={has(u.id, p.id)} className="h-4 w-4 accent-[var(--acc)]" />
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />{p.name}
              </label>
            )) : <p className="text-sm text-mut">Δημιούργησε πρώτα ακίνητα.</p>}
            {!!props?.length && <button className="btn btn-primary mt-3">Αποθήκευση πρόσβασης</button>}
          </form>
        </div>
      )) : <div className="empty">Δεν υπάρχουν υπάλληλοι ακόμη. Στείλε την πρώτη πρόσκληση παραπάνω.</div>}
    </>
  );
}
