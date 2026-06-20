import { useEffect, useRef, useState } from 'react'
import { getJson } from '../utils/api.js'

// Load Google Identity Services once and reuse the promise across mounts.
let gisPromise = null
function loadGis() {
  if (gisPromise) return gisPromise
  gisPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
  return gisPromise
}

/**
 * "Continue with Google" button. Fetches the client ID from /auth/config, so
 * it self-hides when Google login isn't configured on the server. On success it
 * calls onCredential(idToken); failures go to onError(message).
 */
export default function GoogleButton({ onCredential, onError }) {
  const divRef = useRef(null)
  const [clientId, setClientId] = useState('')

  useEffect(() => {
    let active = true
    getJson('/auth/config')
      .then((cfg) => active && setClientId(cfg.google_client_id || ''))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    loadGis()
      .then(() => {
        if (cancelled || !window.google || !divRef.current) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (resp) => {
            if (resp?.credential) onCredential(resp.credential)
            else onError?.('Google sign-in was cancelled.')
          },
        })
        window.google.accounts.id.renderButton(divRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
        })
      })
      .catch(() => onError?.('Could not load Google sign-in.'))
    return () => {
      cancelled = true
    }
  }, [clientId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Google not configured -> render nothing.
  if (!clientId) return null

  return <div ref={divRef} style={{ display: 'flex', justifyContent: 'center' }} />
}
