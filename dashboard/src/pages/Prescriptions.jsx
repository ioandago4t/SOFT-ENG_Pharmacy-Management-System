import { useState } from 'react'
import { createPrescription } from '../api.js'
import RecordsPage from './RecordsPage.jsx'
import './Prescriptions.css'

function emptyPrescription() {
	return {
		number: '',
		customerName: '',
		medicineName: '',
		prescriber: '',
		status: 'Pending',
		date: new Date().toISOString().slice(0, 10),
		courseId: '',
	}
}

export default function Prescriptions({ items = [], courses = [], onPrescriptionCreated, onGoToCourses }) {
	const [form, setForm] = useState(emptyPrescription)
	const [error, setError] = useState('')
	const [saving, setSaving] = useState(false)

	async function submit(event) {
		event.preventDefault()
		setSaving(true)
		setError('')
		try {
			const prescription = await createPrescription({ ...form, courseId: Number(form.courseId) })
			await onPrescriptionCreated(prescription)
			setForm(emptyPrescription())
		} catch (requestError) {
			setError(requestError.message)
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="prescriptions-page">
			<section className="panel prescription-entry-panel">
				<div className="prescription-entry-heading">
					<div>
						<h2>Record a prescription</h2>
						<p>Choose a course from the current course list.</p>
					</div>
				</div>
				<form className="prescription-entry-form" onSubmit={submit}>
					<label>Prescription number<input required maxLength="80" value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} /></label>
					<label>Customer<input required maxLength="120" value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} /></label>
					<label>Medicine<input required maxLength="120" value={form.medicineName} onChange={(event) => setForm({ ...form, medicineName: event.target.value })} /></label>
					<label>Prescriber<input maxLength="120" value={form.prescriber} onChange={(event) => setForm({ ...form, prescriber: event.target.value })} /></label>
					<label>Status
						<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
							<option>Pending</option><option>Ready</option><option>Collected</option>
						</select>
					</label>
					<label>Date<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
					<label className="prescription-course-field">Course
						<select required value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })} disabled={!courses.length}>
							<option value="">Select a course</option>
							{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
						</select>
					</label>
					<div className="prescription-submit">
						{!courses.length && <button className="text-link" type="button" onClick={onGoToCourses}>Add a course first</button>}
						<button className="primary-button" type="submit" disabled={saving || !courses.length}>{saving ? 'Saving...' : 'Save prescription'}</button>
					</div>
					{error && <p className="form-error prescription-form-error" role="alert">{error}</p>}
				</form>
			</section>
			<RecordsPage
				title="Prescriptions"
				description="Prescription records and their current status."
				items={items}
				columns={[
					{ key: 'number', label: 'PRESCRIPTION' },
					{ key: 'customerName', label: 'CUSTOMER' },
					{ key: 'medicineName', label: 'MEDICINE' },
					{ key: 'prescriber', label: 'PRESCRIBER' },
					{ key: 'course', label: 'COURSE' },
					{ key: 'status', label: 'STATUS' },
					{ key: 'date', label: 'DATE' },
				]}
				emptyTitle="No prescriptions recorded"
				emptyDescription="Prescription records will appear here."
			/>
		</div>
	)
}
