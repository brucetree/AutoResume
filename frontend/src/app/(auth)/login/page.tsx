'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('Invalid email or password')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side — Architectural Imagery (Desktop only) */}
      <section className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden bg-surface-container">
        <div className="absolute inset-0 z-0 bg-surface-container-high" />
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-surface via-transparent to-transparent opacity-60" />

        <div className="relative z-20 flex flex-col justify-between p-16 w-full">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">widgets</span>
            <Link href="/" className="text-2xl font-black font-headline tracking-tighter text-primary">
              AutoResume
            </Link>
          </div>

          <div className="max-w-md">
            <h2 className="font-headline font-extrabold text-5xl tracking-tighter text-primary mb-6 leading-none">
              Engineered for<br />Professional{' '}
              <span className="text-on-tertiary-container">Distinction</span>.
            </h2>
            <p className="text-on-surface-variant text-lg font-light leading-relaxed">
              Access your private suite of AI-driven tools designed to architect the future of your career with mathematical precision.
            </p>
          </div>

          <div />
        </div>
      </section>

      {/* Right Side — Login Form */}
      <section className="flex-1 flex flex-col bg-surface-container-lowest">
        {/* Mobile Header — fixed */}
        <header className="md:hidden fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl flex items-center gap-2 px-6 h-16">
          <span className="material-symbols-outlined text-on-surface text-xl">widgets</span>
          <Link href="/" className="text-xl font-extrabold tracking-tighter text-on-surface font-headline">
            AutoResume
          </Link>
        </header>

        <div className="flex-1 flex flex-col justify-center items-center p-6 pt-24 pb-12 md:p-16 lg:p-24">
          <div className="w-full max-w-[420px] space-y-12">
            {/* Header */}
            <header className="space-y-3 text-left">
              <h1 className="font-headline font-extrabold text-4xl tracking-tighter text-primary leading-tight">
                <span className="md:hidden">Welcome to AutoResume</span>
                <span className="hidden md:inline">Welcome to AutoResume.</span>
              </h1>
              {/* Mobile: left border accent */}
              <p className="md:hidden text-on-surface-variant font-medium border-l-2 border-tertiary-fixed pl-4">
                Your Precision Intelligence Portal.
              </p>
              {/* Desktop: plain text */}
              <p className="hidden md:block text-on-surface-variant font-light text-base">
                Your Precision Intelligence Portal.
              </p>
            </header>

            {/* Success message after registration */}
            {registered && (
              <div className="bg-tertiary-container/10 text-on-tertiary-container px-4 py-3 rounded-lg text-sm font-medium">
                Account created successfully. Please log in.
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold tracking-widest uppercase text-on-surface-variant ml-1"
                  >
                    Professional Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full h-14 px-4 bg-surface-container-highest border-none rounded-lg focus:ring-1 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all duration-300 placeholder:text-outline/60 text-on-surface font-medium text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end ml-1">
                    <label
                      htmlFor="password"
                      className="block text-xs font-bold tracking-widest uppercase text-on-surface-variant"
                    >
                      Secure Password
                    </label>
                    <a
                      href="#"
                      className="text-xs font-bold text-surface-tint hover:underline"
                    >
                      Forgot?
                    </a>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-14 px-4 bg-surface-container-highest border-none rounded-lg focus:ring-1 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all duration-300 placeholder:text-outline/60 text-on-surface font-medium text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 px-1 pt-1">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    className="w-5 h-5 rounded-md border-outline-variant text-primary-container focus:ring-surface-tint transition-all"
                  />
                  <label htmlFor="remember" className="text-sm font-medium text-on-surface-variant select-none">
                    <span className="md:hidden">Stay signed in</span>
                    <span className="hidden md:inline">Stay signed in for 30 days</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 obsidian-gradient text-on-primary font-headline font-bold rounded-xl shadow-xl shadow-primary-container/10 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-sm tracking-wide"
              >
                {loading ? 'Signing in...' : (
                  <>
                    Enter Workspace
                    <span className="material-symbols-outlined text-lg md:hidden">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-outline-variant/30" />
              <span className="flex-shrink mx-4 text-[10px] font-black tracking-[0.2em] text-outline uppercase">
                or connect via
              </span>
              <div className="flex-grow border-t border-outline-variant/30" />
            </div>

            {/* OAuth Buttons */}
            <div>
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="w-full h-14 flex items-center justify-center gap-3 bg-surface-container-low border border-outline-variant/15 rounded-xl hover:bg-surface-container-high transition-colors active:scale-95 duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-sm font-bold text-on-surface">Continue with Google</span>
              </button>
            </div>

            {/* Footer Link */}
            <div className="mt-12 text-center md:text-left">
              <p className="text-sm text-on-surface-variant">
                <span className="md:hidden">New to the platform?</span>
                <span className="hidden md:inline">New to the architecture?</span>
                <Link href="/register" className="text-primary font-bold ml-1 hover:underline transition-all">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
