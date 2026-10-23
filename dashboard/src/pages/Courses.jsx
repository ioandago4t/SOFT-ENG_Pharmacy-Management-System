import { useState } from 'react'
import { createCourse, deleteCourse, updateCourse } from '../api.js'
import './Courses.css'

const emptyForm = { name: '', description: '' }

export default function Courses({ courses, onCourseSaved, onCourseDeleted }) {
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function beginEdit(course) {
    setEditingId(course.id)
    setForm({ name: course.name, description: course.description })
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const course = editingId === null
        ? await createCourse(form)
        : await updateCourse(editingId, form)
      onCourseSaved(course)
      cancelEdit()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(course) {
    if (!window.confirm(`Permanently delete ${course.name}? Customers and prescriptions will be kept, but their course association will be cleared.`)) return
    setError('')
    try {
      await deleteCourse(course.id)
      onCourseDeleted(course.id)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="page-content courses-page">
      <header className="records-heading">
        <div>
          <p className="eyebrow">PHARMACY WORKSPACE</p>
          <h1>Courses</h1>
          <p className="welcome-subtitle">Manage course choices used on prescription records.</p>
        </div>
        <span className="record-count">{courses.length} {courses.length === 1 ? 'course' : 'courses'}</span>
      </header>

      <div className="course-layout">
        <section className="panel course-form-panel">
          <h2>{editingId === null ? 'Add a course' : 'Edit course'}</h2>
          <p className="course-panel-description">Course names are available immediately in the prescription form.</p>
          <form onSubmit={submit} className="course-form">
            <label>
              Course name
              <input required maxLength="120" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Medication review" />
            </label>
            <label>
              Description <span className="optional-label">Optional</span>
              <textarea maxLength="500" rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add a short description" />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId === null ? 'Add course' : 'Save changes'}</button>
              {editingId !== null && <button className="secondary-button" type="button" onClick={cancelEdit}>Cancel</button>}
            </div>
          </form>
        </section>

        <section className="panel records-panel course-list-panel" aria-label="Course records">
          {courses.length ? (
            <div className="records-table-wrap">
              <table>
                <thead><tr><th>COURSE</th><th>DESCRIPTION</th><th>ACTIONS</th></tr></thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>{course.name}</td>
                      <td>{course.description || '—'}</td>
                      <td>
                        <div className="course-row-actions">
                          <button className="secondary-button" type="button" onClick={() => beginEdit(course)}>Edit</button>
                          <button className="danger-button" type="button" onClick={() => remove(course)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="records-empty"><span className="records-empty-mark" aria-hidden="true" /><strong>No courses added</strong><span>Create a course to make it available on prescription records.</span></div>
          )}
          {error && courses.length > 0 && <p className="form-error course-list-error" role="alert">{error}</p>}
        </section>
      </div>
    </div>
  )
}
