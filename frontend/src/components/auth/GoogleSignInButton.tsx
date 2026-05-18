'use client'

import { signIn } from 'next-auth/react'

interface GoogleSignInButtonProps {
  callbackUrl?: string
  className?: string
  children: React.ReactNode
}

/**
 * Google sign-in button using next-auth/react's `signIn()`.
 *
 * History:
 *  - Originally inline `onClick={() => signIn('google', ...)}` in login/register
 *    pages. Users reported "first click fails, second click works" on production.
 *  - v1.2.4 attempted a native HTML form POST as a workaround for a suspected
 *    Set-Cookie / window.location race. That approach didn't fix the original
 *    bug AND introduced a NEW bug: the manually managed csrfToken state could
 *    fall out of sync with the actual cookie, causing CSRF mismatch errors
 *    (NextAuth responded with /api/auth/signin?csrf=true).
 *  - This file is the revert: back to the canonical signIn() approach, which
 *    has NextAuth's own CSRF handling baked in.
 *
 * Component still extracted from the pages so that any future Google-button
 * tweak only needs to happen in one place.
 */
export default function GoogleSignInButton({
  callbackUrl = '/dashboard',
  className,
  children,
}: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signIn('google', { callbackUrl })}
      className={className}
    >
      {children}
    </button>
  )
}
