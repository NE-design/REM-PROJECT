import Nav from '@/components/Nav';
import { requireProfile } from '@/lib/auth';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  return (
    <div className="min-h-screen">
      <Nav role={profile.role} name={profile.full_name || profile.email || 'Χρήστης'} />
      <main className="mx-auto max-w-5xl px-5 pb-28 pt-8 md:ml-60 md:px-12 md:pb-12 md:pt-12">{children}</main>
    </div>
  );
}
