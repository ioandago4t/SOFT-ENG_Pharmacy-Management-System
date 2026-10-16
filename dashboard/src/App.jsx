import { useState } from 'react'
import './App.css'
import Customers from './pages/Customers.jsx'
import Inventory from './pages/Inventory.jsx'
import Prescriptions from './pages/Prescriptions.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'

const navigation = [
  { label: 'Overview', icon: 'grid' },
  { label: 'Inventory', icon: 'box' },
  { label: 'Prescriptions', icon: 'file' },
  { label: 'Customers', icon: 'users' },
  { label: 'Reports', icon: 'chart' },
]

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const shapes = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    box: <><path d="m3.5 7 8.5-4 8.5 4v10L12 21l-8.5-4V7Z" /><path d="m3.8 7.2 8.2 4 8.2-4M12 11.5V21" /></>,
    file: <><path d="M7 3.5h7l5 5v12H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" /><path d="M14 3.5v5h5M9 13h6M9 17h6" /></>,
    users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" /><circle cx="9.5" cy="7.5" r="3.5" /><path d="M17 11a3.5 3.5 0 1 0-1-6.8M17 14.5a4 4 0 0 1 4 4V20" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.2.9-1.2 2.1-1.4-.6a7.9 7.9 0 0 1-1.6.9l-.2 1.5h-2.5l-.3-1.5a7.9 7.9 0 0 1-1.6-.9l-1.4.6-1.2-2.1 1.2-.9a7.5 7.5 0 0 1 0-1.9l-1.2-.9 1.2-2.1 1.4.6a7.9 7.9 0 0 1 1.6-.9l.3-1.5h2.5l.2 1.5a7.9 7.9 0 0 1 1.6.9l1.4-.6 1.2 2.1-1.2.9a7.5 7.5 0 0 1 0 1.8Z" transform="translate(-1 -1) scale(1.08)" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4.2 4.2" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  }
  return <svg {...common}>{shapes[name] || null}</svg>
}

function App() {
  const [activePage, setActivePage] = useState('Overview')
  const [query, setQuery] = useState('')
  const [records] = useState({ inventory: [], prescriptions: [], customers: [], sales: [], activity: [] })
  const filteredInventory = records.inventory.filter((item) => `${item.name ?? ''} ${item.category ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  const today = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())
  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const salesTotal = records.sales.reduce((total, sale) => total + Number(sale.amount ?? sale.total ?? 0), 0)
  const lowStockCount = records.inventory.filter((item) => Number(item.quantity ?? 0) <= Number(item.minimumStock ?? 0)).length

  function renderPage() {
    if (activePage === 'Inventory') return <Inventory items={filteredInventory} />
    if (activePage === 'Prescriptions') return <Prescriptions items={records.prescriptions} />
    if (activePage === 'Customers') return <Customers items={records.customers} />
    if (activePage === 'Reports') return <Reports items={records.sales} />
    if (activePage === 'Settings') return <Settings />

    return (
      <div className="page-content">
        <section className="welcome-row">
          <div><p className="eyebrow">{dateLabel.toUpperCase()}</p><h1>{greeting}</h1><p className="welcome-subtitle">Your pharmacy overview.</p></div>
        </section>

        <section className="metrics-grid" aria-label="Pharmacy metrics">
          <article className="metric-card"><div className="metric-top"><span>Sales recorded</span><span className="metric-icon green-icon">$</span></div><div className="metric-value">${salesTotal.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div><div className="metric-foot">From recorded sales</div></article>
          <article className="metric-card"><div className="metric-top"><span>Prescriptions</span><span className="metric-icon blue-icon"><Icon name="file" size={17} /></span></div><div className="metric-value">{records.prescriptions.length}</div><div className="metric-foot">Recorded prescriptions</div></article>
          <article className="metric-card"><div className="metric-top"><span>Inventory items</span><span className="metric-icon orange-icon"><Icon name="box" size={17} /></span></div><div className="metric-value">{records.inventory.length}</div><div className="metric-foot">{lowStockCount} below minimum stock</div></article>
          <article className="metric-card"><div className="metric-top"><span>Customers</span><span className="metric-icon rose-icon"><Icon name="users" size={17} /></span></div><div className="metric-value">{records.customers.length}</div><div className="metric-foot">Recorded customer profiles</div></article>
        </section>

        <section className="content-grid overview-content">
          <article className="panel inventory-panel">
            <div className="panel-heading"><div><h2>Inventory</h2><p>Current medicine records</p></div><button className="text-link" onClick={() => setActivePage('Inventory')}>Open inventory <Icon name="arrow" size={15} /></button></div>
            {filteredInventory.length ? (
              <div className="inventory-table-wrap"><table><thead><tr><th>MEDICINE</th><th>QUANTITY</th><th>MINIMUM</th></tr></thead><tbody>
                {filteredInventory.slice(0, 5).map((item) => <tr key={item.id ?? item.name}><td>{item.name}</td><td>{item.quantity ?? 0} {item.unit ?? ''}</td><td>{item.minimumStock ?? 0} {item.unit ?? ''}</td></tr>)}
              </tbody></table></div>
            ) : <div className="empty-panel-state"><strong>No inventory records</strong><span>Added medicines will appear here.</span></div>}
          </article>
          <article className="panel activity-panel">
            <div className="panel-heading"><div><h2>Recent activity</h2><p>Recorded pharmacy updates</p></div></div>
            {records.activity.length ? <div className="activity-list">{records.activity.slice(0, 4).map((item) => <div className="activity-item" key={item.id}><div className="activity-copy"><strong>{item.title}</strong><span>{item.detail}</span><time>{item.time}</time></div></div>)}</div> : <div className="empty-panel-state"><strong>No recent activity</strong><span>Activity will appear as records are added.</span></div>}
          </article>
        </section>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Pharmacy management home">
          <span className="brand-mark"><span /></span>
          <span className="brand-name">Pharmacy<small>MANAGEMENT</small></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button className={`nav-link ${activePage === item.label ? 'selected' : ''}`} key={item.label} onClick={() => setActivePage(item.label)}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === 'Inventory' && lowStockCount > 0 && <span className="nav-badge">{lowStockCount}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className={`nav-link settings-link ${activePage === 'Settings' ? 'selected' : ''}`} onClick={() => setActivePage('Settings')}><Icon name="settings" /><span>Settings</span></button>
          <div className="profile-row"><div className="profile-avatar">P</div><div className="profile-copy"><strong>Pharmacy staff</strong><span>Workspace</span></div></div>
        </div>
      </aside>

      <main className="main-area" id="home">
        <header className="topbar">
            <div className="breadcrumbs"><span>Workspace</span><span className="crumb-divider">/</span><strong>{activePage}</strong></div>
          <div className="topbar-actions">
            {(activePage === 'Overview' || activePage === 'Inventory') && <label className="search-box"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search medicines..." aria-label="Search medicines" /></label>}
            <div className="top-date"><Icon name="clock" />{today}</div>
          </div>
        </header>
        {renderPage()}
      </main>
    </div>
  )
}

export default App
