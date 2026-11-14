import Link from 'next/link';
import { requestReset } from '@/lib/actions/auth';

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Επαναφορά κωδικού</h1>
        <p className="mb-8 mt-2 text-sm text-mut">Θα σου στείλουμε σύνδεσμο για να ορίσεις νέο κωδικό.</p>
        {sent ? (
          <p className="card text-sm">Αν το email υπάρχει στο σύστημα, θα λάβεις σύντομα σύνδεσμο επαναφοράς.</p>
        ) : (
          <form action={requestReset} className="card space-y-4">
            <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" /></div>
            <button className="btn btn-primary w-full">Αποστολή συνδέσμου</button>
          </form>
        )}
        <p className="mt-4 text-center text-sm"><Link href="/login" className="text-acc">Πίσω στη σύνδεση</Link></p>
      </div>
    </main>
  );
}
