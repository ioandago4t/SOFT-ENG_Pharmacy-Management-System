const { after, before, test } = require('node:test')
const assert = require('node:assert/strict')
const { DatabaseSync } = require('node:sqlite')
const { createApp, initializeDatabase } = require('../index.js')

const db = new DatabaseSync(':memory:')
const server = createApp(db).listen(0)
let baseUrl

before(async () => {
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  db.close()
})

async function jsonRequest(route, options) {
  const response = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  return { response, body: response.status === 204 ? null : await response.json() }
}

test('course CRUD validates and persists course records', async () => {
  const invalid = await jsonRequest('/api/courses', { method: 'POST', body: JSON.stringify({ name: ' ' }) })
  assert.equal(invalid.response.status, 400)

  const created = await jsonRequest('/api/courses', { method: 'POST', body: JSON.stringify({ name: 'Medication review', description: 'Annual check-in' }) })
  assert.equal(created.response.status, 201)
  assert.equal(created.body.name, 'Medication review')
  assert.equal(created.body.description, 'Annual check-in')

  const duplicate = await jsonRequest('/api/courses', { method: 'POST', body: JSON.stringify({ name: 'medication REVIEW' }) })
  assert.equal(duplicate.response.status, 409)

  const updated = await jsonRequest(`/api/courses/${created.body.id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Medication follow-up', description: 'Updated details' }),
  })
  assert.equal(updated.response.status, 200)
  assert.equal(updated.body.name, 'Medication follow-up')

  const listed = await jsonRequest('/api/courses')
  assert.deepEqual(listed.body.map((course) => course.name), ['Medication follow-up'])

  const removed = await jsonRequest(`/api/courses/${created.body.id}`, { method: 'DELETE' })
  assert.equal(removed.response.status, 204)
  assert.deepEqual((await jsonRequest('/api/courses')).body, [])
})

test('prescriptions require a valid course and return saved course information', async () => {
  const course = await jsonRequest('/api/courses', { method: 'POST', body: JSON.stringify({ name: 'Chronic care' }) })
  const invalid = await jsonRequest('/api/prescriptions', {
    method: 'POST',
    body: JSON.stringify({ number: 'RX-1', customerName: 'Pat', medicineName: 'Medicine', date: '2026-10-23', courseId: 999 }),
  })
  assert.equal(invalid.response.status, 400)

  const created = await jsonRequest('/api/prescriptions', {
    method: 'POST',
    body: JSON.stringify({ number: 'RX-1', customerName: 'Pat', medicineName: 'Medicine', prescriber: 'Dr Lee', date: '2026-10-23', courseId: course.body.id }),
  })
  assert.equal(created.response.status, 201)
  assert.equal(created.body.courseId, course.body.id)
  assert.equal(created.body.course, 'Chronic care')

  const listed = await jsonRequest('/api/prescriptions')
  assert.equal(listed.body[0].course, 'Chronic care')
  const customers = await jsonRequest('/api/customers')
  assert.equal(customers.body[0].name, 'Pat')
  assert.equal(customers.body[0].lastVisit, '')

  await jsonRequest(`/api/courses/${course.body.id}`, { method: 'DELETE' })
  const afterCourseDeletion = await jsonRequest('/api/prescriptions')
  assert.equal(afterCourseDeletion.body[0].course, null)
  assert.equal(afterCourseDeletion.body[0].number, 'RX-1')
})

test('customer API validates, creates, and lists unique customer records', async () => {
  const course = await jsonRequest('/api/courses', { method: 'POST', body: JSON.stringify({ name: 'Customer course' }) })
  const invalid = await jsonRequest('/api/customers', { method: 'POST', body: JSON.stringify({ name: '  ' }) })
  assert.equal(invalid.response.status, 400)

  const created = await jsonRequest('/api/customers', {
    method: 'POST',
    body: JSON.stringify({ name: '  Alex Morgan  ', phone: ' 555-0100 ', email: ' alex@example.com ', courseId: course.body.id }),
  })
  assert.equal(created.response.status, 201)
  assert.deepEqual(
    { name: created.body.name, phone: created.body.phone, email: created.body.email, lastVisit: created.body.lastVisit, courseId: created.body.courseId, course: created.body.course },
    { name: 'Alex Morgan', phone: '555-0100', email: 'alex@example.com', lastVisit: '', courseId: course.body.id, course: 'Customer course' },
  )

  const duplicate = await jsonRequest('/api/customers', { method: 'POST', body: JSON.stringify({ name: 'alex morgan', courseId: course.body.id }) })
  assert.equal(duplicate.response.status, 409)

  const invalidCourse = await jsonRequest('/api/customers', {
    method: 'POST',
    body: JSON.stringify({ name: 'Invalid course customer', courseId: 999 }),
  })
  assert.equal(invalidCourse.response.status, 400)

  const listed = await jsonRequest('/api/customers')
  assert.deepEqual(listed.body.map((customer) => customer.name), ['Alex Morgan', 'Pat'])
  assert.equal(listed.body.find((customer) => customer.name === 'Alex Morgan').course, 'Customer course')

  await jsonRequest(`/api/courses/${course.body.id}`, { method: 'DELETE' })
  const afterCourseDeletion = await jsonRequest('/api/customers')
  const customerAfterCourseDeletion = afterCourseDeletion.body.find((customer) => customer.name === 'Alex Morgan')
  assert.equal(customerAfterCourseDeletion.courseId, null)
  assert.equal(customerAfterCourseDeletion.course, null)
})

test('database initialization migrates the prior customer schema and imports prescription names', () => {
  const legacyDb = new DatabaseSync(':memory:')
  legacyDb.exec(`
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      medicine_name TEXT NOT NULL,
      prescriber TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending',
      date TEXT NOT NULL,
      course_id INTEGER
    );
    INSERT INTO prescriptions (number, customer_name, medicine_name, date)
    VALUES ('RX-OLD', '  Imported Customer  ', 'Medicine', '2026-10-23');
  `)

  initializeDatabase(legacyDb)
  const columns = legacyDb.prepare('PRAGMA table_info(customers)').all()
  assert.ok(columns.some((column) => column.name === 'lastVisit'))
  assert.ok(columns.some((column) => column.name === 'course_id'))
  assert.equal(legacyDb.prepare('SELECT name FROM customers').get().name, 'Imported Customer')
  legacyDb.close()
})
