import Placeholder from '@/components/Placeholder';
import { requireOwner } from '@/lib/auth';

export default async function Page() {
  await requireOwner(); // Οι υπάλληλοι ανακατευθύνονται. Η βάση τούς αρνείται και ούτως ή άλλως.
  return <Placeholder title="Εξοδολόγιο" text="Έσοδα, έξοδα, στατιστικά και AI ανάλυση." />;
}
