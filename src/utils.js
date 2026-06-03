/**
 * Poll until `predicate()` returns truthy, or reject after `timeoutMs`.
 * Used to wait for externally-loaded scripts (gapi, GIS) to become available.
 */
export function waitFor(predicate, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    if (predicate()) { resolve(); return }
    const interval = setInterval(() => {
      if (predicate()) { clearInterval(interval); resolve() }
    }, 60)
    setTimeout(() => { clearInterval(interval); reject(new Error('Script load timeout')) }, timeoutMs)
  })
}

/**
 * Decode a JWT payload (base64url → JSON).
 * NOTE: This does NOT verify the signature — suitable only for display data
 * on client-side apps where a backend cannot perform server-side verification.
 */
export function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}
