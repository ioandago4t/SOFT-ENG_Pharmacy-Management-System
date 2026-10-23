import { useState } from 'react'
import { createCustomer } from '../api.js'
import RecordsPage from './RecordsPage.jsx'
import './Customers.css'

const emptyCustomer = { name: '', phone: '', email: '', courseId: '' }

export default function Customers({ items = [], courses = [], onCustomerCreated, onGoToCourses }) {
	const [form, setForm] = useState(emptyCustomer)
	const [error, setError] = useState('')
	const [saving, setSaving] = useState(false)

	async function submit(event) {
		event.preventDefault()
		setSaving(true)
		setError('')
		try {
			const customer = await createCustomer(form)
			onCustomerCreated(customer)
			setForm(emptyCustomer)
		} catch (requestError) {
			setError(requestError.message)
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="customers-page">
			<section className="panel customer-entry-panel">
				<div className="customer-entry-heading">
					<div>
						<h2>Add a customer</h2>
						<p>Customer names are kept unique.</p>
					</div>
				</div>
				<form className="customer-entry-form" onSubmit={submit}>
					<label>Name<input required maxLength="120" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
					<label>Phone<input maxLength="60" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
					<label>Email<input type="email" maxLength="254" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
					<label>Course
						<select required value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })} disabled={!courses.length}>
							<option value="">Select a course</option>
							{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
						</select>
					</label>
					<div className="customer-submit">
						{!courses.length && <button className="text-link" type="button" onClick={onGoToCourses}>Add a course first</button>}
						<button className="primary-button" type="submit" disabled={saving || !courses.length}>{saving ? 'Saving...' : 'Add customer'}</button>
					</div>
					{error && <p className="form-error customer-form-error" role="alert">{error}</p>}
				</form>
			</section>
			<RecordsPage
				title="Customers"
				description="Customer profiles and contact details."
				items={items}
				columns={[
					{ key: 'name', label: 'CUSTOMER' },
					{ key: 'phone', label: 'PHONE' },
					{ key: 'email', label: 'EMAIL' },
					{ key: 'course', label: 'COURSE' },
					{ key: 'lastVisit', label: 'LAST VISIT' },
				]}
				emptyTitle="No customers recorded"
				emptyDescription="Customer profiles will appear here."
			/>
		</div>
	)
}
