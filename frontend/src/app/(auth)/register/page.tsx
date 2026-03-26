'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Registration failed')
        return
      }
      router.push('/login?registered=true')
    } catch {
      setError('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Mobile Header — back arrow + logo */}
      <header className="lg:hidden flex items-center gap-3 px-6 h-16 bg-surface-container-low/50">
        <Link href="/" className="text-on-surface active:scale-95 transition-transform duration-200">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <span className="material-symbols-outlined text-on-surface text-xl">widgets</span>
        <span className="text-xl font-extrabold tracking-tighter text-on-surface font-headline">AutoResume</span>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden lg:block fixed top-0 w-full z-50 bg-surface-container-low/80 backdrop-blur-xl">
        <div className="flex justify-between items-center px-8 py-6 max-w-screen-2xl mx-auto">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter text-on-surface font-headline">
            <span className="material-symbols-outlined text-on-surface text-xl">widgets</span>
            AutoResume
          </Link>
          <div className="flex gap-8 items-center">
            <div className="h-4 w-px bg-outline-variant/30" />
            <Link href="/login" className="text-on-surface font-semibold text-sm active:scale-95 duration-200">
              Login
            </Link>
            <span className="obsidian-gradient text-on-primary px-5 py-2 rounded-lg text-sm font-semibold">
              Sign Up
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow px-6 pt-10 pb-20 lg:pt-32 flex items-start lg:items-center justify-center">
        <div className="max-w-md lg:max-w-6xl w-full lg:grid lg:grid-cols-12 lg:gap-16 lg:items-start">

          {/* Left Column — Branding & Social Proof */}
          <div className="lg:col-span-5 flex flex-col gap-12 mb-12 lg:mb-0">
            <div className="space-y-4 lg:space-y-6">
              {/* Desktop only badge */}
              <span className="hidden lg:inline-flex items-center px-3 py-1 bg-tertiary-container/10 text-on-tertiary-container rounded-full text-xs font-semibold tracking-wider uppercase">
                The Digital Architect
              </span>
              <h1 className="font-headline text-5xl lg:text-6xl font-extrabold tracking-tight lg:tracking-tighter leading-tight lg:leading-none text-primary">
                Start Your Journey.
              </h1>
              <p className="font-body text-lg lg:text-xl text-on-surface-variant leading-relaxed lg:max-w-md">
                <span className="lg:hidden">Elevate your career with the Digital Architect framework. Professional precision for every application.</span>
                <span className="hidden lg:inline">Create your high-end professional narrative with AI-driven precision and editorial flair.</span>
              </p>
            </div>

            {/* Testimonial Card */}
            <div className="bg-surface-container-low/80 backdrop-blur-2xl ghost-border p-6 lg:p-8 rounded-xl shadow-ambient space-y-6">
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>
                <p className="text-on-surface italic leading-relaxed lg:text-lg lg:leading-snug">
                  <span className="lg:hidden">&ldquo;The precision analysis helped me land interviews at three Fortune 500 companies within a week.&rdquo;</span>
                  <span className="hidden lg:inline">&ldquo;The Precision Framework didn&apos;t just fix my resume; it restructured my entire career narrative. I landed 3 interviews within a week.&rdquo;</span>
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
                    <span className="material-symbols-outlined text-on-surface-variant">person</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-primary">Sarah Jenkins</p>
                    <p className="font-body text-xs text-on-surface-variant">Senior Product Designer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats — Desktop only */}
            <div className="hidden lg:flex items-center gap-8">
              <div>
                <p className="font-headline text-3xl font-extrabold text-primary">10,000+</p>
                <p className="font-body text-xs uppercase tracking-widest text-on-surface-variant">Professionals Curated</p>
              </div>
              <div className="h-8 w-px bg-outline-variant/30" />
              <div>
                <p className="font-headline text-3xl font-extrabold text-primary">98%</p>
                <p className="font-body text-xs uppercase tracking-widest text-on-surface-variant">Success Rate</p>
              </div>
            </div>
          </div>

          {/* Right Column — Registration Form */}
          <div className="lg:col-span-7">
            <div className="lg:bg-surface-container-lowest lg:p-10 xl:p-14 lg:rounded-xl lg:shadow-ambient-light lg:ghost-border">
              <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
                {error && (
                  <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm font-medium">
                    {error}
                  </div>
                )}

                {/* Name & Email — stacked on mobile, side-by-side on desktop */}
                <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
                  <div className="space-y-2">
                    <label htmlFor="fullname" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                      Full Name
                    </label>
                    <input
                      id="fullname"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      required
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-4 lg:py-3.5 text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-surface-tint transition-all duration-300 placeholder:text-outline"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@framework.com"
                      required
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-4 lg:py-3.5 text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-surface-tint transition-all duration-300 placeholder:text-outline"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-4 lg:py-3.5 text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-surface-tint transition-all duration-300 placeholder:text-outline"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-4 lg:py-3.5 text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-surface-tint transition-all duration-300 placeholder:text-outline"
                  />
                </div>

                {/* Terms checkbox — Desktop only */}
                <div className="hidden lg:flex items-start gap-3 px-1">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    required
                    className="mt-1 rounded text-primary focus:ring-primary border-outline-variant bg-surface-container-highest"
                  />
                  <label htmlFor="terms" className="text-sm text-on-surface-variant leading-tight">
                    I agree to the{' '}
                    <a href="#" className="text-primary font-semibold underline underline-offset-4 decoration-outline-variant hover:decoration-primary transition-all">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-primary font-semibold underline underline-offset-4 decoration-outline-variant hover:decoration-primary transition-all">
                      Privacy Policy
                    </a>.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full obsidian-gradient text-on-primary font-bold py-5 rounded-lg text-sm tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 mt-4 lg:mt-0 lg:font-headline lg:text-base"
                >
                  {loading ? 'Creating your account...' : 'Join the Precision Framework'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-10">
                <div className="h-px flex-grow bg-outline-variant/20" />
                <span className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-on-surface-variant/50">
                  or continue with
                </span>
                <div className="h-px flex-grow bg-outline-variant/20" />
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-4 mb-12 lg:mb-0">
                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="flex items-center justify-center gap-3 py-4 lg:py-3.5 px-4 bg-surface-container-low ghost-border rounded-lg hover:bg-surface-container-high active:scale-95 transition-all font-bold text-xs text-on-surface"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
                  className="flex items-center justify-center gap-3 py-4 lg:py-3.5 px-4 bg-surface-container-low ghost-border rounded-lg hover:bg-surface-container-high active:scale-95 transition-all font-bold text-xs text-on-surface"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" fill="currentColor" />
                  </svg>
                  GitHub
                </button>
              </div>
            </div>

            <p className="text-center mt-10 lg:mt-10 text-xs lg:text-base text-on-surface-variant lg:font-medium">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-bold hover:underline decoration-tertiary-fixed decoration-2 underline-offset-4">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-6 bg-surface-container-low flex flex-col items-center gap-4 text-center lg:mt-20">
        <div className="lg:max-w-screen-2xl lg:mx-auto lg:w-full lg:flex lg:flex-row lg:justify-between lg:items-center">
          {/* Mobile footer */}
          <p className="lg:hidden font-body text-xs tracking-wide uppercase text-on-surface-variant/50">
            &copy; 2024 AutoResume. High-End Editorial Precision.
          </p>
          <div className="flex gap-4 lg:hidden">
            <a href="#" className="font-body text-xs tracking-wide uppercase text-on-surface-variant/50 hover:text-on-surface transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="font-body text-xs tracking-wide uppercase text-on-surface-variant/50 hover:text-on-surface transition-colors">
              Terms of Service
            </a>
            <a href="#" className="font-body text-xs tracking-wide uppercase text-on-surface-variant/50 hover:text-on-surface transition-colors">
              Help Center
            </a>
          </div>

          {/* Desktop footer */}
          <div className="hidden lg:block text-sm font-black text-on-surface font-headline tracking-wide uppercase">AutoResume</div>
          <div className="hidden lg:flex gap-8">
            <a href="#" className="font-body text-xs tracking-wide uppercase text-on-surface-variant/60 hover:text-on-surface transition-opacity">
              Privacy Policy
            </a>
            <a href="#" className="font-body text-xs tracking-wide uppercase text-on-surface-variant/60 hover:text-on-surface transition-opacity">
              Terms of Service
            </a>
            <a href="#" className="font-body text-xs tracking-wide uppercase text-on-surface-variant/60 hover:text-on-surface transition-opacity">
              Help Center
            </a>
          </div>
          <div className="hidden lg:block text-xs text-on-surface-variant/50 font-body uppercase tracking-wide">
            &copy; 2024 AutoResume. The Digital Architect.
          </div>
        </div>
      </footer>
    </div>
  )
}
