const path = require('node:path')
const { DatabaseSync } = require('node:sqlite')
const express = require('express')

function initializeDatabase(db) {
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      medicine_name TEXT NOT NULL,
      prescriber TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending',
      date TEXT NOT NULL,
      course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      lastVisit TEXT NOT NULL DEFAULT '',
      course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL
    );
    INSERT OR IGNORE INTO customers (name)
    SELECT DISTINCT TRIM(customer_name)
    FROM prescriptions
    WHERE customer_name IS NOT NULL
      AND TRIM(customer_name) <> '';
  `)

  const customerColumns = db.prepare('PRAGMA table_info(customers)').all()
  if (!customerColumns.some((column) => column.name === 'lastVisit')) {
    db.exec("ALTER TABLE customers ADD COLUMN lastVisit TEXT NOT NULL DEFAULT ''")
  }
  if (!customerColumns.some((column) => column.name === 'course_id')) {
    db.exec('ALTER TABLE customers ADD COLUMN course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL')
  }
}

function createApp(db) {
  initializeDatabase(db)
  const app = express()
  app.use(express.json())

  const courseColumns = 'id, name, description, created_at AS createdAt'
  const prescriptionColumns = `
    p.id, p.number, p.customer_name AS customerName,
    p.medicine_name AS medicineName, p.prescriber, p.status, p.date,
    p.course_id AS courseId, c.name AS course
  `

  app.get('/api/customers', (_request, response) => {
    const customers = db.prepare(`
      SELECT customers.id, customers.name, customers.phone, customers.email,
        customers.lastVisit, customers.course_id AS courseId, courses.name AS course
      FROM customers
      LEFT JOIN courses ON courses.id = customers.course_id
      ORDER BY customers.name COLLATE NOCASE
    `).all()
    response.json(customers)
  })

  app.post('/api/customers', (request, response, next) => {
    const name = typeof request.body.name === 'string' ? request.body.name.trim() : ''
    const phone = typeof request.body.phone === 'string' ? request.body.phone.trim() : ''
    const email = typeof request.body.email === 'string' ? request.body.email.trim() : ''
    const courseId = Number(request.body.courseId)

    if (!name) return response.status(400).json({ error: 'Customer name is required.' })
    if (!Number.isSafeInteger(courseId) || courseId < 1) {
      return response.status(400).json({ error: 'Select a valid course.' })
    }

    try {
      const result = db.prepare(`
        INSERT INTO customers (name, phone, email, course_id)
        VALUES (?, ?, ?, ?)
      `).run(name, phone, email, courseId)

      const customer = db.prepare(`
        SELECT customers.id, customers.name, customers.phone, customers.email,
          customers.lastVisit, customers.course_id AS courseId, courses.name AS course
        FROM customers
        LEFT JOIN courses ON courses.id = customers.course_id
        WHERE customers.id = ?
      `).get(result.lastInsertRowid)

      return response.status(201).json(customer)
    } catch (error) {
      if (error.errcode === 2067) return response.status(409).json({ error: 'This customer already exists.' })
      if (error.errcode === 787) return response.status(400).json({ error: 'The selected course no longer exists.' })
      return next(error)
    }
  })

  app.get('/api/courses', (_request, response) => {
    response.json(db.prepare(`SELECT ${courseColumns} FROM courses ORDER BY name COLLATE NOCASE`).all())
  })

  app.post('/api/courses', (request, response, next) => {
    const name = typeof request.body.name === 'string' ? request.body.name.trim() : ''
    const description = typeof request.body.description === 'string' ? request.body.description.trim() : ''
    if (!name) return response.status(400).json({ error: 'Course name is required.' })

    try {
      const result = db.prepare('INSERT INTO courses (name, description) VALUES (?, ?)').run(name, description)
      const course = db.prepare(`SELECT ${courseColumns} FROM courses WHERE id = ?`).get(result.lastInsertRowid)
      return response.status(201).json(course)
    } catch (error) {
      if (error.errcode === 2067) return response.status(409).json({ error: 'A course with this name already exists.' })
      return next(error)
    }
  })

  app.put('/api/courses/:id', (request, response, next) => {
    const id = Number(request.params.id)
    const name = typeof request.body.name === 'string' ? request.body.name.trim() : ''
    const description = typeof request.body.description === 'string' ? request.body.description.trim() : ''
    if (!Number.isSafeInteger(id) || id < 1) return response.status(400).json({ error: 'Invalid course id.' })
    if (!name) return response.status(400).json({ error: 'Course name is required.' })

    try {
      const result = db.prepare('UPDATE courses SET name = ?, description = ? WHERE id = ?').run(name, description, id)
      if (!result.changes) return response.status(404).json({ error: 'Course not found.' })
      return response.json(db.prepare(`SELECT ${courseColumns} FROM courses WHERE id = ?`).get(id))
    } catch (error) {
      if (error.errcode === 2067) return response.status(409).json({ error: 'A course with this name already exists.' })
      return next(error)
    }
  })

  app.delete('/api/courses/:id', (request, response) => {
    const id = Number(request.params.id)
    if (!Number.isSafeInteger(id) || id < 1) return response.status(400).json({ error: 'Invalid course id.' })
    const result = db.prepare('DELETE FROM courses WHERE id = ?').run(id)
    if (!result.changes) return response.status(404).json({ error: 'Course not found.' })
    return response.status(204).end()
  })

  app.get('/api/prescriptions', (_request, response) => {
    response.json(db.prepare(`
      SELECT ${prescriptionColumns}
      FROM prescriptions p LEFT JOIN courses c ON c.id = p.course_id
      ORDER BY p.id DESC
    `).all())
  })

  app.post('/api/prescriptions', (request, response, next) => {
    const { number, customerName, medicineName, prescriber = '', status = 'Pending', date, courseId } = request.body
    const required = [number, customerName, medicineName, date]
    if (required.some((value) => typeof value !== 'string' || !value.trim())) {
      return response.status(400).json({ error: 'Prescription number, customer, medicine, and date are required.' })
    }
    const parsedCourseId = Number(courseId)
    if (!Number.isSafeInteger(parsedCourseId) || parsedCourseId < 1) {
      return response.status(400).json({ error: 'Select a valid course.' })
    }
    if (![prescriber, status].every((value) => typeof value === 'string')) {
      return response.status(400).json({ error: 'Prescriber and status must be text.' })
    }

    try {
      const result = db.prepare(`
        INSERT INTO prescriptions (number, customer_name, medicine_name, prescriber, status, date, course_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(number.trim(), customerName.trim(), medicineName.trim(), prescriber.trim(), status.trim(), date.trim(), parsedCourseId)
      const prescription = db.prepare(`
        SELECT ${prescriptionColumns}
        FROM prescriptions p LEFT JOIN courses c ON c.id = p.course_id
        WHERE p.id = ?
      `).get(result.lastInsertRowid)
      db.prepare('INSERT OR IGNORE INTO customers (name) VALUES (?)').run(customerName.trim())
      return response.status(201).json(prescription)
    } catch (error) {
      if (error.errcode === 2067) return response.status(409).json({ error: 'A prescription with this number already exists.' })
      if (error.errcode === 787) return response.status(400).json({ error: 'The selected course no longer exists.' })
      return next(error)
    }
  })

  app.use((error, _request, response, _next) => {
    console.error(error)
    response.status(500).json({ error: 'An unexpected server error occurred.' })
  })

  return app
}

if (require.main === module) {
  const db = new DatabaseSync(path.join(__dirname, 'pharmacy.sqlite3'))
  const app = createApp(db)
  const port = Number(process.env.PORT) || 3001
  app.listen(port, () => console.log(`Pharmacy API listening on http://localhost:${port}`))
}

module.exports = { createApp, initializeDatabase }
