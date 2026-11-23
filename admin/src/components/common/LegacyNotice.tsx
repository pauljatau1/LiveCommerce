// Pages kept from the old platform whose feature the current shop and
// studio don't use. They still open, so the team can look through old records.
export default function LegacyNotice({ feature }: { feature: string }) {
  return (
    <div role="note" className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <strong className="font-semibold">{feature} isn't used in the current app.</strong>{' '}
      This page shows records from the old platform, if there are any.
    </div>
  );
}
