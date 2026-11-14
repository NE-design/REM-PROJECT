export default function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mb-8 mt-1 text-mut">{text}</p>
      <div className="empty"><b className="text-ink">Υπό ανάπτυξη</b><br />Αυτή η ενότητα θα υλοποιηθεί σε επόμενο στάδιο.</div>
    </>
  );
}
