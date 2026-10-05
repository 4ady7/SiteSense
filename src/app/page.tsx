export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-stone-500">Prototype</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">SiteSense</h1>
      <p className="mt-4 text-base leading-relaxed text-stone-700">
        AI-assisted site safety assessment. This is a student prototype. It is not certified
        safety software, and it is not a substitute for professional judgement.
      </p>
      <p className="mt-4 text-base leading-relaxed text-stone-700">
        Human review remains necessary. A finding is only as trustworthy as the evidence and
        guidance linked to it. Insufficient evidence is a valid result.
      </p>
      <p className="mt-8 text-sm text-stone-600">
        Service status is available at{" "}
        <a className="underline decoration-stone-400 underline-offset-4" href="/api/health">
          /api/health
        </a>
        .
      </p>
    </main>
  );
}
