import RecordsPage from './RecordsPage.jsx'

export default function Reports({ items = [] }) {
	return (
		<RecordsPage
			title="Reports"
			description="Recorded sales and transaction totals."
			items={items}
			columns={[
				{ key: 'date', label: 'DATE' },
				{ key: 'reference', label: 'REFERENCE' },
				{ key: 'prescriptions', label: 'PRESCRIPTIONS' },
				{ key: 'amount', label: 'AMOUNT' },
			]}
			emptyTitle="No sales records"
			emptyDescription="Reports will appear here after sales are recorded."
		/>
	)
}
