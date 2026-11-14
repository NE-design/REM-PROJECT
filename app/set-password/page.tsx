import { setPassword } from '@/lib/actions/auth';

const ERRORS: Record<string, string> = {
  short: 'Ο κωδικός πρέπει να έχει τουλάχιστον 10 χαρακτήρες.',
  mismatch: 'Οι δύο κωδικοί δεν ταιριάζουν.',
  failed: 'Δεν ήταν δυνατή η αλλαγή. Ζήτησε νέο σύνδεσμο.',
};

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Ορισμός κωδικού</h1>
        <p className="mb-8 mt-2 text-sm text-mut">Διάλεξε έναν ισχυρό κωδικό, τουλάχιστον 10 χαρακτήρες.</p>
        {error && ERRORS[error] && <p className="alert">{ERRORS[error]}</p>}
        <form action={setPassword} className="card space-y-4">
          <div><label className="label" htmlFor="password">Νέος κωδικός</label><input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" className="input" /></div>
          <div><label className="label" htmlFor="confirm">Επιβεβαίωση</label><input id="confirm" name="confirm" type="password" required minLength={10} autoComplete="new-password" className="input" /></div>
          <button className="btn btn-primary w-full">Αποθήκευση</button>
        </form>
      </div>
    </main>
  );
}
