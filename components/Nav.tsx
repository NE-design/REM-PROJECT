'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ICONS: Record<string, React.ReactNode> = {
  dash: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  cal: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  home: <><path d="M3 11l9-8 9 8v10H3z" /><path d="M10 21v-6h4v6" /></>,
  euro: <><circle cx="12" cy="12" r="9" /><path d="M15 9a4 4 0 100 6M7 11h6M7 13h6" /></>,
  check: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 12l3 3 5-6" /></>,
  plan: <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.5 3-6 6-6s6 2.5 6 6M17 5a3.5 3.5 0 010 7M21 20c0-2.5-1.5-4.5-4-5.5" /></>,
};

const ITEMS = [
  { href: '/', label: 'Αρχική', icon: 'dash' },
  { href: '/schedule', label: 'Ενοικιάσεις', icon: 'cal' },
  { href: '/properties', label: 'Ακίνητα', icon: 'home' },
  { href: '/finance', label: 'Εξοδολόγιο', icon: 'euro', owner: true },
  { href: '/logbook', label: 'Log Book', icon: 'check' },
  { href: '/plans', label: 'Σχέδια', icon: 'plan' },
  { href: '/admin/users', label: 'Χρήστες', icon: 'users', owner: true },
];

function Icon({ name }: { name: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICONS[name]}</svg>;
}

export default function Nav({ role, name }: { role: 'owner' | 'employee'; name: string }) {
  const path = usePathname();
  const items = ITEMS.filter((i) => !i.owner || role === 'owner');
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r border-line bg-surf px-3.5 py-6 md:flex">
        <div className="px-3 pb-6 text-base font-semibold tracking-tight">Property Mgmt</div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active(i.href) ? 'bg-accx font-semibold text-acc' : 'text-mut hover:bg-bg'}`}>
              <Icon name={i.icon} />{i.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line px-3 pt-4 text-sm">
          <div className="truncate font-medium">{name}</div>
          <div className="mb-2 text-xs text-mut">{role === 'owner' ? 'Owner' : 'Υπάλληλος'}</div>
          <form action="/auth/signout" method="post"><button className="text-acc">Αποσύνδεση</button></form>
        </div>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-line bg-surf px-1 pb-[calc(6px+env(safe-area-inset-bottom,0px))] pt-1.5 md:hidden">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className={`flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-[10px] ${active(i.href) ? 'text-acc' : 'text-mut'}`}>
            <Icon name={i.icon} />{i.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
