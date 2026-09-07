const SESSION_KEY = "velorah-session-v1"

export function readSessionAccount() {
  return localStorage.getItem(SESSION_KEY) || ""
}
