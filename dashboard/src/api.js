async function request(path, options) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result.error || `Request failed with status ${response.status}.`)
  }
  return response.status === 204 ? null : response.json()
}

export const getCourses = () => request('/courses')
export const createCourse = (course) => request('/courses', { method: 'POST', body: JSON.stringify(course) })
export const updateCourse = (id, course) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(course) })
export const deleteCourse = (id) => request(`/courses/${id}`, { method: 'DELETE' })
export const getPrescriptions = () => request('/prescriptions')
export const createPrescription = (prescription) => request('/prescriptions', { method: 'POST', body: JSON.stringify(prescription) })
export const getCustomers = () => request('/customers')
export const createCustomer = (customer) => request('/customers', { method: 'POST', body: JSON.stringify(customer) })
