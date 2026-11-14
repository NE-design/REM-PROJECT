# Property Management Platform: Στάδιο 1

Next.js 15 + TypeScript + Tailwind + Supabase (Postgres, Auth, Storage, RLS). PWA, ελληνικά.

**Περιλαμβάνει:** σύνδεση/αποσύνδεση, επαναφορά κωδικού, πρόσκληση υπαλλήλων με email, ενεργοποίηση/απενεργοποίηση λογαριασμών, ανάθεση ακινήτων ανά υπάλληλο, δικαιώματα σε επίπεδο βάσης (RLS), audit log, ιδιωτικό Storage με policies ανά ακίνητο, dashboard, μενού με 5 ενότητες, δημιουργία ακινήτων.
**Δεν περιλαμβάνει ακόμη:** MFA (θα προστεθεί στο επόμενο βήμα), οι λειτουργίες των 5 ενοτήτων (εμφανίζονται ως «Υπό ανάπτυξη»), ανέβασμα αρχείων από το UI.

> ⚠️ Ο κώδικας γράφτηκε χωρίς δυνατότητα εκτέλεσης και **δεν έχει δοκιμαστεί**. Αν εμφανιστεί σφάλμα, στείλε το μήνυμα και θα διορθωθεί.

## 1. GitHub
Φτιάξε **ιδιωτικό** repository και ανέβασε όλα τα αρχεία αυτού του φακέλου (το `.env.local` ΔΕΝ ανεβαίνει ποτέ).

## 2. Supabase
1. Φτιάξε project στο supabase.com, περιοχή **EU (Frankfurt)**.
2. **SQL Editor** → επικόλλησε ολόκληρο το `supabase/migrations/0001_init.sql` → Run.
3. **Authentication → Sign In / Providers → Email:** απενεργοποίησε το **Allow new users to sign up** (μόνο με πρόσκληση).
4. **Authentication → URL Configuration:** *Site URL* = το URL της εφαρμογής (τοπικά `http://localhost:3000`).
5. **Authentication → Email Templates**, άλλαξε τον σύνδεσμο στα δύο πρότυπα:
   - **Invite user:** `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/set-password">Αποδοχή πρόσκλησης</a>`
   - **Reset password:** `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/set-password">Νέος κωδικός</a>`
6. **Ο λογαριασμός Owner:** Authentication → Users → *Add user* (email + κωδικός, με «Auto confirm»). Μετά, στο SQL Editor:
   ```sql
   update public.profiles set role = 'owner', full_name = 'Το όνομά σου' where email = 'το-email-σου';
   ```
7. **Settings → API:** αντίγραψε το Project URL, το anon/publishable key και το service_role/secret key.

## 3. Τοπική εκτέλεση
```bash
cp .env.example .env.local     # συμπλήρωσε τις τιμές
npm install
npm run dev                    # http://localhost:3000
```

## 4. Deployment (Netlify ή Vercel)
Σύνδεσε το GitHub repository και πρόσθεσε στις ρυθμίσεις (Environment variables) τις 4 μεταβλητές του `.env.example`, με `NEXT_PUBLIC_SITE_URL` το τελικό URL. Μετά ενημέρωσε το *Site URL* στο Supabase.

## 5. Έλεγχος ασφαλείας πριν βάλεις πραγματικά δεδομένα
Δες το `supabase/tests_access.sql`. Δημιούργησε έναν δοκιμαστικό υπάλληλο με ένα ακίνητο και επιβεβαίωσε ότι: δεν βλέπει οικονομικά, δεν βλέπει άλλα ακίνητα, δεν βλέπει audit log, και δεν μπορεί να αλλάξει στοιχεία ακινήτου.

## Σημειώσεις
- Το `SUPABASE_SERVICE_ROLE_KEY` είναι μυστικό και χρησιμοποιείται μόνο σε server actions του Owner.
- Backups: το Supabase Pro κρατά backups βάσης, αλλά **όχι τα αρχεία του Storage**. Θα φτιάξουμε ξεχωριστό backup πριν την παραγωγική χρήση.
- Για MFA: μετά την ενεργοποίησή του, άλλαξε τη συνάρτηση `mfa_ok()` όπως λέει το σχόλιο στο SQL.
