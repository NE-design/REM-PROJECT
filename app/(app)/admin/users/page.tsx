import { requireOwner } from '@/lib/auth';
import { createEmployee, resetEmployeePassword, setActive, setAccess } from './actions';

const OK: Record<string, string> = {
  created: 'Ο λογαριασμός δημιουργήθηκε. Δώσε στον υπάλληλο το email και τον κωδικό.',
  pwd: 'Ο κωδικός άλλαξε.',
};

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
      {error && <p className="alert">Σφάλμα: {error}</p>}
      {ok && OK[ok] && <p className="mb-4 rounded-lg border border-ok px-3 py-2 text-sm text-ok">{OK[ok]}</p>}

      <form action={createEmployee} className="card mb-6">
        <h2 className="mb-4 font-semibold">Νέος υπάλληλος</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="label" htmlFor="full_name">Ονοματεπώνυμο</label><input id="full_name" name="full_name" className="input" /></div>
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" /></div>
          <div><label className="label" htmlFor="password">Προσωρινός κωδικός (10+ χαρακτήρες)</label><input id="password" name="password" type="text" required minLength={10} autoComplete="off" className="input" /></div>
        </div>
        <button className="btn btn-primary mt-4">Δημιουργία λογαριασμού</button>
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
          <form action={resetEmployeePassword} className="mt-4 flex items-end gap-2 border-t border-line pt-4">
            <input type="hidden" name="user_id" value={u.id} />
            <div className="flex-1"><label className="label" htmlFor={`pw-${u.id}`}>Νέος κωδικός (10+ χαρακτήρες)</label><input id={`pw-${u.id}`} name="password" type="text" minLength={10} autoComplete="off" className="input" /></div>
            <button className="btn">Αλλαγή κωδικού</button>
          </form>
        </div>
      )) : <div className="empty">Δεν υπάρχουν υπάλληλοι ακόμη. Δημιούργησε τον πρώτο παραπάνω.</div>}
    </>
  );
}
