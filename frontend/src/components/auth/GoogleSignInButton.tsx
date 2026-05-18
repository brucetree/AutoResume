'use client'

import { useEffect, useState } from 'react'
import { getCsrfToken } from 'next-auth/react'

interface GoogleSignInButtonProps {
  callbackUrl?: string
  className?: string
  children: React.ReactNode
}

/**
 * Google sign-in button that submits a NATIVE HTML form to NextAuth's
 * /api/auth/signin/google endpoint.
 *
 * Why not next-auth/react's `signIn('google', ...)`?
 *   signIn() does `await fetch(signinUrl) → window.location.href = data.url`.
 *   In production (HTTPS, __Secure-/__Host- prefix cookies), the Set-Cookie
 *   headers for `__Secure-next-auth.state` and `__Secure-next-auth.pkce.code_verifier`
 *   sometimes are not committed to the browser's cookie store before
 *   `window.location.href` triggers navigation to Google. When Google redirects
 *   back to /api/auth/callback/google, those cookies are missing — NextAuth
 *   logs `[OAUTH_CALLBACK_ERROR] State cookie was missing.` and bounces the
 *   user to /login?error=OAuthCallback.
 *
 * Why does a native form fix it?
 *   A form submit causes a full browser navigation. The browser receives the
 *   302 response from /api/auth/signin/google, COMMITS the Set-Cookie headers
 *   into the cookie store, THEN follows the Location: https://accounts.google.com/...
 *   redirect. There is no JS in the middle, so no race condition.
 *
 * The CSRF token is still required (NextAuth validates both the cookie and
 * the form value). We fetch it once on mount via getCsrfToken(); the button
 * stays disabled for the brief moment before it arrives.
 */
export default function GoogleSignInButton({
  callbackUrl = '/dashboard',
  className,
  children,
}: GoogleSignInButtonProps) {
  const [csrfToken, setCsrfToken] = useState<string | undefined>()

  useEffect(() => {
    getCsrfToken().then(setCsrfToken)
  }, [])

  return (
    <form method="POST" action="/api/auth/signin/google">
      <input type="hidden" name="csrfToken" value={csrfToken ?? ''} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <button type="submit" className={className} disabled={!csrfToken}>
        {children}
      </button>
    </form>
  )
}
