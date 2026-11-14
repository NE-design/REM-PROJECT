import { requireProfile } from '@/lib/auth';
import Link from 'next/link';

const STATUS: Record<string, string> = { pending: 'Εκκρεμεί', scheduled: 'Προγραμματισμένη', in_progress: 'Σε εξέλιξη', done: 'Ολοκληρώθηκε' };
const eur = (n: number) => n.toLocaleString('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const day = (d?: string | null) => (d ? new Date(d).toLocaleDateString('el-GR') : '');

export default async function Dashboard() {
  const { supabase, profile } = await requireProfile();
  const owner = profile.role === 'owner';
  const year = new Date().getFullYear();
  const [props, open, urgent, done, fin] = await Promise.all([
    supabase.from('properties').select('id,name,color,area_sqm,bedrooms,bathrooms', { count: 'exact' }).order('name'),
    supabase.from('tasks').select('id,title,status,is_urgent,scheduled_for,category,assignee_id,properties(name,color)', { count: 'exact' }).neq('status', 'done').order('scheduled_for', { ascending: true, nullsFirst: false }).limit(8),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('is_urgent', true).neq('status', 'done'),
    supabase.from('tasks').select('id,title,completed_at,properties(name,color)').eq('status', 'done').order('completed_at', { ascending: false }).limit(5),
    owner ? supabase.from('financial_entries').select('type,amount').gte('entry_date', `${year}-01-01`) : Promise.resolve({ data: [] as any[] }),
  ]);
  const income = (fin.data ?? []).filter((f: any) => f.type === 'income').reduce((a: number, f: any) => a + Number(f.amount), 0);
  const expense = (fin.data ?? []).filter((f: any) => f.type === 'expense').reduce((a: number, f: any) => a + Number(f.amount), 0);

  const Stat = ({ n, l }: { n: string | number; l: string }) => (
    <div className="card"><div className="text-3xl font-semibold tracking-tight">{n}</div><div className="mt-1 text-sm text-mut">{l}</div></div>
  );
  const Dot = ({ c }: { c?: string }) => <span className="inline-block h-2.5 w-2.5 flex-none rounded-full" style={{ background: c || 'var(--acc)' }} />;

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Αρχική</h1>
      <p className="mb-8 mt-1 text-mut">{owner ? 'Συνολική εικόνα όλων των ακινήτων.' : 'Τα ακίνητα και οι εργασίες που σου έχουν ανατεθεί.'}</p>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat n={props.count ?? 0} l="Ακίνητα" />
        <Stat n={open.count ?? 0} l="Ανοιχτές εργασίες" />
        <Stat n={urgent.count ?? 0} l="Επείγουσες" />
        {owner ? <Stat n={eur(income - expense)} l={`Καθαρό αποτέλεσμα ${year}`} /> : <Stat n={done.data?.length ?? 0} l="Πρόσφατα ολοκληρωμένες" />}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 font-semibold">Επερχόμενες εργασίες</h2>
          {open.data?.length ? open.data.map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 border-t border-line py-3 first:border-0">
              <Dot c={t.properties?.color} />
              <div className="min-w-0 flex-1"><div className="truncate font-medium">{t.title}</div><div className="truncate text-xs text-mut">{t.properties?.name}{t.scheduled_for ? ` · ${day(t.scheduled_for)}` : ''}</div></div>
              {t.is_urgent && <span className="tag" style={{ color: 'var(--warn)' }}>Επείγον</span>}
              {t.assignee_id === profile.id && <span className="tag">Δική σου</span>}
              <span className="tag">{STATUS[t.status]}</span>
            </div>
          )) : <p className="text-sm text-mut">Δεν υπάρχουν ανοιχτές εργασίες.</p>}
        </section>

        <section className="card">
          <h2 className="mb-3 font-semibold">{owner ? 'Ακίνητα' : 'Τα ακίνητά μου'}</h2>
          {props.data?.length ? props.data.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 border-t border-line py-3 first:border-0">
              <Dot c={p.color} />
              <div><div className="font-medium">{p.name}</div><div className="text-xs text-mut">{[p.area_sqm && `${p.area_sqm} τ.μ.`, p.bedrooms && `${p.bedrooms} υπνοδ.`, p.bathrooms && `${p.bathrooms} μπάνια`].filter(Boolean).join(' · ')}</div></div>
            </div>
          )) : owner
            ? <p className="text-sm text-mut">Δεν υπάρχουν ακίνητα ακόμη. <Link href="/properties" className="text-acc">Πρόσθεσε το πρώτο</Link>.</p>
            : <p className="text-sm text-mut">Δεν σου έχει ανατεθεί κανένα ακίνητο. Ζήτησε πρόσβαση από τον διαχειριστή.</p>}
        </section>

        {done.data && done.data.length > 0 && (
          <section className="card lg:col-span-2">
            <h2 className="mb-3 font-semibold">Πρόσφατες ενημερώσεις</h2>
            {done.data.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 border-t border-line py-3 first:border-0">
                <Dot c={t.properties?.color} /><div className="flex-1 truncate">{t.title} <span className="text-mut">· {t.properties?.name}</span></div>
                <span className="text-xs text-mut">{day(t.completed_at)}</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </>
  );
}
