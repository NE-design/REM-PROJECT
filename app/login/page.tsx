import Link from 'next/link';
import { login } from '@/lib/actions/auth';

const ERRORS: Record<string, string> = {
  invalid: 'Λάθος email ή κωδικός.',
  inactive: 'Ο λογαριασμός είναι απενεργοποιημένος. Επικοινώνησε με τον διαχειριστή.',
  link: 'Ο σύνδεσμος δεν ισχύει πια. Ζήτησε νέο.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Property Management</h1>
        <p className="mb-8 mt-2 text-sm text-mut">Συνδέσου με τον προσωπικό σου λογαριασμό.</p>
        {error && ERRORS[error] && <p className="alert">{ERRORS[error]}</p>}
        <form action={login} className="card space-y-4">
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
          <div><label className="label" htmlFor="password">Κωδικός</label><input id="password" name="password" type="password" required autoComplete="current-password" className="input" /></div>
          <button className="btn btn-primary w-full">Σύνδεση</button>
        </form>
        <p className="mt-4 text-center text-sm"><Link href="/forgot-password" className="text-acc">Ξέχασα τον κωδικό μου</Link></p>
      </div>
    </main>
  );
}
