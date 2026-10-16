import './Pages.css'

export default function Settings() {
  return (
    <div className="page-content records-page">
      <header className="records-heading">
        <div>
          <p className="eyebrow">WORKSPACE</p>
          <h1>Settings</h1>
          <p className="welcome-subtitle">Pharmacy workspace preferences.</p>
        </div>
      </header>
      <section className="panel records-empty" aria-live="polite">
        <strong>No settings configured</strong>
        <span>Workspace settings will appear here when configuration is available.</span>
      </section>
    </div>
  )
}