export default function SetupRequiredPage() {
  return (
    <main className="setup-required-page">
      <section className="setup-required-card">
        <p className="setup-required-brand">Jobhunter · Private workspace</p>
        <h1>Connect your workspace</h1>
        <p>Jobhunter needs its Supabase project URL and publishable key before it can open your private career workspace. Add <code>SUPABASE_URL</code> and <code>SUPABASE_PUBLISHABLE_KEY</code> to the Vercel Production environment, then redeploy.</p>
      </section>
    </main>
  );
}

