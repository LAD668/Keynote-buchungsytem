import Link from "next/link";

export default function OfflinePage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">You are offline</h1>
      <p className="mt-2 text-sm text-slate-600">
        Cached content is still available. Reconnect to sync new workshop data.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-[#4A5ED6]"
      >
        Back to Login
      </Link>
    </section>
  );
}
