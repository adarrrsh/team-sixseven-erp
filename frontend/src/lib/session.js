const KEY = "origin.session"

export function saveSession(user) {
  try {
    localStorage.setItem(KEY, JSON.stringify(user))
  } catch {
  }
}

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null")
  } catch {
    return null
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY)
  } catch {
  }
}
