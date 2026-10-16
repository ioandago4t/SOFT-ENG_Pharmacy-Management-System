import './Pages.css'

export default function RecordsPage({ title, description, items, columns, emptyTitle, emptyDescription }) {
  return (
    <div className="page-content records-page">
      <header className="records-heading">
        <div>
          <p className="eyebrow">PHARMACY WORKSPACE</p>
          <h1>{title}</h1>
          <p className="welcome-subtitle">{description}</p>
        </div>
        <span className="record-count">{items.length} {items.length === 1 ? 'record' : 'records'}</span>
      </header>

      <section className="panel records-panel" aria-label={`${title} records`}>
        {items.length ? (
          <div className="records-table-wrap">
            <table>
              <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id ?? item.number ?? `${title}-${index}`}>
                    {columns.map((column) => <td key={column.key}>{item[column.key] ?? '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="records-empty" aria-live="polite">
            <span className="records-empty-mark" aria-hidden="true" />
            <strong>{emptyTitle}</strong>
            <span>{emptyDescription}</span>
          </div>
        )}
      </section>
    </div>
  )
}