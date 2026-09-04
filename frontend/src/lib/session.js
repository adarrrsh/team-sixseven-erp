/**
 * Who is signed in, remembered across reloads.
 *
 * The backend issues no token yet, so this is a convenience record of the last
 * successful sign-in — not a security boundary. Anything sensitive must stay
 * behind a server-side check.
 */
const KEY = "origin.session"

export function saveSession(user) {
  try {
    localStorage.setItem(KEY, JSON.stringify(user))
  } catch {
    // Private browsing or blocked storage — the session just won't persist.
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
    // Nothing to clear.
  }
}
