import RecordsPage from './RecordsPage.jsx'

export default function Prescriptions({ items = [] }) {
	return (
		<RecordsPage
			title="Prescriptions"
			description="Prescription records and their current status."
			items={items}
			columns={[
				{ key: 'number', label: 'PRESCRIPTION' },
				{ key: 'customerName', label: 'CUSTOMER' },
				{ key: 'medicineName', label: 'MEDICINE' },
				{ key: 'prescriber', label: 'PRESCRIBER' },
				{ key: 'status', label: 'STATUS' },
				{ key: 'date', label: 'DATE' },
			]}
			emptyTitle="No prescriptions recorded"
			emptyDescription="Prescription records will appear here."
		/>
	)
}
