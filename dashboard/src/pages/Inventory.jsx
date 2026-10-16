import RecordsPage from './RecordsPage.jsx'

export default function Inventory({ items = [] }) {
	return (
		<RecordsPage
			title="Inventory"
			description="Medicine quantities and minimum stock levels."
			items={items}
			columns={[
				{ key: 'name', label: 'MEDICINE' },
				{ key: 'category', label: 'CATEGORY' },
				{ key: 'quantity', label: 'IN STOCK' },
				{ key: 'minimumStock', label: 'MINIMUM STOCK' },
			]}
			emptyTitle="No medicines recorded"
			emptyDescription="Medicines added to inventory will appear here."
		/>
	)
}
