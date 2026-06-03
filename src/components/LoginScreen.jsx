import { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID } from '../googleConfig'
import { waitFor, parseJwt } from '../utils'

export default function LoginScreen({ onSignIn }) {
  const btnRef   = useRef(null)
  const [ready,  setReady]  = useState(false)
  const [error,  setError]  = useState(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    waitFor(() => !!window.google?.accounts?.id)
      .then(() => {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          auto_select: false,
          cancel_on_tap_outside: true,

          callback(response) {
            const payload = parseJwt(response.credential)

            // ── Security checks ─────────────────────────────────────────────
            if (!payload) {
              setError('שגיאה בקריאת אסימון — נסי שוב')
              return
            }
            // Audience must match our Client ID (prevents token injection from other apps)
            if (payload.aud !== GOOGLE_CLIENT_ID) {
              setError('שגיאת אבטחה: זהות האפליקציה אינה תואמת')
              return
            }
            // Reject expired tokens
            if (payload.exp < Date.now() / 1000) {
              setError('תוקף ההתחברות פג — נסי שוב')
              return
            }
            // Email must be verified by Google
            if (!payload.email_verified) {
              setError('כתובת המייל אינה מאומתת ב-Google')
              return
            }
            // ────────────────────────────────────────────────────────────────

            // Store ONLY display-safe profile info — never the raw JWT token
            const user = {
              id:      payload.sub,
              name:    payload.name,
              email:   payload.email,
              picture: payload.picture,
              exp:     payload.exp,
            }

            // sessionStorage: auto-cleared when the browser tab closes
            sessionStorage.setItem('app_user', JSON.stringify(user))
            onSignIn(user)
          },
        })

        if (btnRef.current) {
          window.google.accounts.id.renderButton(btnRef.current, {
            type:   'standard',
            shape:  'rectangular',
            theme:  'outline',
            text:   'signin_with',
            size:   'large',
            locale: 'he',
            width:  260,
          })
          setReady(true)
        }
      })
      .catch(() => setError('טעינת Google Sign-In נכשלה — רענני את הדף'))
  }, [onSignIn])

  return (
    <div className="login-screen">
      <div className="login-card">
        <span className="login-app-icon">📅</span>
        <h1 className="login-app-title">מתכנן יומי</h1>
        <p className="login-app-sub">ארגני את היום שלך בקלות</p>

        <div className="login-divider" />

        {!GOOGLE_CLIENT_ID ? (
          <div className="login-setup-msg">
            <p>⚙️ להפעלה, הוסיפי את ה-Client ID שלך ב-</p>
            <code>src/googleConfig.js</code>
          </div>
        ) : (
          <>
            <p className="login-prompt">התחברי עם חשבון Google כדי להתחיל</p>

            {/* Google renders the branded button inside this div */}
            <div
              ref={btnRef}
              className="login-btn-container"
              style={{ minHeight: ready ? undefined : 44 }}
            />

            {error && <p className="login-error" role="alert">{error}</p>}
          </>
        )}

        {/* Transparent security notice */}
        <div className="login-security-notice">
          <span className="login-security-icon">🔒</span>
          <div>
            <p>ההתחברות מתבצעת <strong>ישירות מול שרתי Google</strong> בלבד.</p>
            <p>
              רק שמך ותמונת הפרופיל נשמרים <strong>זמנית בדפדפן</strong> —
              לא מועברים לשום שרת חיצוני.
            </p>
            <p>הנתונים נמחקים אוטומטית עם סגירת הדפדפן.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
