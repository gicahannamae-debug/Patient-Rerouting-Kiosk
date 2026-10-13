import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 bg-cyan-950 px-6 text-center text-white">
      <div>
        <h1 className="text-5xl font-extrabold">BICA</h1>
        <p className="mt-2 text-cyan-200">Better Informed Care Access</p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/kiosk"
          className="rounded-xl bg-orange-300 px-8 py-4 text-xl font-bold text-cyan-950 hover:bg-orange-200"
        >
          Patient Kiosk
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-white/40 px-8 py-4 text-xl font-bold hover:bg-white/10"
        >
          Clinic Dashboard
        </Link>
      </div>
    </main>
  );
}
