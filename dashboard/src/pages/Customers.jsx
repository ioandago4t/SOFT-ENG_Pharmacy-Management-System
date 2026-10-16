import RecordsPage from './RecordsPage.jsx'

export default function Customers({ items = [] }) {
	return (
		<RecordsPage
			title="Customers"
			description="Customer profiles and contact details."
			items={items}
			columns={[
				{ key: 'name', label: 'CUSTOMER' },
				{ key: 'phone', label: 'PHONE' },
				{ key: 'email', label: 'EMAIL' },
				{ key: 'lastVisit', label: 'LAST VISIT' },
			]}
			emptyTitle="No customers recorded"
			emptyDescription="Customer profiles will appear here."
		/>
	)
}
