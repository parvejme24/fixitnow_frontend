const TOKEN_KEY = "fixitnow_token"
const PERSIST_KEY = "fixitnow_token_persist"

function canUseDom() {
  return typeof window !== "undefined"
}

export function getTokenPersist(): boolean {
  if (!canUseDom()) return true
  return window.localStorage.getItem(PERSIST_KEY) !== "0"
}

export function getStoredToken(): string | null {
  if (!canUseDom()) return null
  return (
    window.localStorage.getItem(TOKEN_KEY) ??
    window.sessionStorage.getItem(TOKEN_KEY)
  )
}

export function setStoredToken(token: string, persist: boolean) {
  if (!canUseDom()) return
  window.localStorage.setItem(PERSIST_KEY, persist ? "1" : "0")
  if (persist) {
    window.localStorage.setItem(TOKEN_KEY, token)
    window.sessionStorage.removeItem(TOKEN_KEY)
  } else {
    window.sessionStorage.setItem(TOKEN_KEY, token)
    window.localStorage.removeItem(TOKEN_KEY)
  }
}

export function clearStoredToken() {
  if (!canUseDom()) return
  window.localStorage.removeItem(TOKEN_KEY)
  window.sessionStorage.removeItem(TOKEN_KEY)
}
