export default function SetupRequiredPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: '#f9f9f8', color: '#111' }}>
      <section style={{ maxWidth: '520px' }}>
        <p style={{ color: '#777', fontSize: '13px', marginBottom: '8px' }}>Jobhunter setup</p>
        <h1 style={{ fontSize: '25px', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: '12px' }}>Finish private access setup</h1>
        <p style={{ color: '#6b6b6b', fontSize: '14px', lineHeight: 1.6 }}>Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to the Vercel project’s Production environment, then redeploy to enable secure account sign-in.</p>
      </section>
    </main>
  );
}
