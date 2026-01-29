// Auth utility functions

export function getAuthHeader() {
  const token = localStorage.getItem('auth_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export function isLoggedIn() {
  return !!localStorage.getItem('auth_token')
}

export function getUser() {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export function isAdmin() {
  const user = getUser()
  return user && user.role === 'admin'
}

export function logout() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user')
  // Optional: Send logout request to backend to invalidate token
  // await fetch('http://localhost:3000/api/logout', {
  //   method: 'POST',
  //   headers: getAuthHeader()
  // })
  // Redirect to login page
  window.location.href = '/login'
}
