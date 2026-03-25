'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { apiPatch, apiDelete } from '@/lib/api'

export default function SettingsPage() {
  const { data: session } = useSession()

  // Profile state
  const [displayName, setDisplayName] = useState(session?.user?.name || '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleUpdateName = async () => {
    if (!displayName.trim()) return
    setNameSaving(true)
    setNameSuccess(false)
    try {
      await apiPatch('/api/auth/profile', { name: displayName.trim() })
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    } catch {
      // ignore
    }
    setNameSaving(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    setPasswordSaving(true)
    try {
      await apiPatch('/api/auth/password', { currentPassword, newPassword })
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch {
      setPasswordError('Current password is incorrect')
    }
    setPasswordSaving(false)
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await apiDelete('/api/auth/account')
      signOut({ callbackUrl: '/' })
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-0 md:px-6 py-4 md:py-8">
      {/* Page Header */}
      <header className="mb-10 md:mb-20">
        <h2 className="text-3xl md:text-5xl font-extrabold font-headline tracking-tighter text-primary mb-2 md:mb-4">Settings</h2>
        <p className="text-on-surface-variant text-sm md:text-base max-w-xl">
          <span className="hidden md:inline">Configure your professional identity and account security preferences for optimal analysis results.</span>
          <span className="md:hidden">Manage your account and preferences</span>
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12 md:gap-24">
        {/* Profile Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 items-start">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-surface-variant md:hidden">person_outline</span>
              <h3 className="text-xl font-bold font-headline tracking-tight">Profile</h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed hidden md:block">
              This information will be used to personalize your resume generation process.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="md:p-0 p-6 rounded-xl md:rounded-none md:bg-transparent bg-surface-container-low space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold font-headline text-on-surface-variant tracking-wider uppercase">
                  Display Name
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onBlur={handleUpdateName}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                    className="flex-1 bg-surface-container-low md:bg-surface-container-lowest border-none rounded-xl h-14 px-6 focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all"
                    placeholder="Your display name"
                  />
                </div>
                {nameSaving && <p className="text-xs text-on-surface-variant">Saving...</p>}
                {nameSuccess && <p className="text-xs text-on-tertiary-container">Name updated successfully</p>}
              </div>

              {/* Email display */}
              <div className="md:hidden">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1 mb-1.5">Email Address</p>
                <p className="px-1 text-on-surface font-medium">{session?.user?.email || ''}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 items-start">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-surface-variant md:hidden">lock</span>
              <h3 className="text-xl font-bold font-headline tracking-tight">Security</h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed hidden md:block">
              Maintain a secure account by regularly updating your credentials.
            </p>
          </div>
          <div className="md:col-span-2">
            <form onSubmit={handleUpdatePassword} className="space-y-5 md:space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-bold font-headline text-on-surface-variant tracking-wider uppercase">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-surface-container-highest border-none rounded-xl h-14 px-6 focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold font-headline text-on-surface-variant tracking-wider uppercase">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-surface-container-highest border-none rounded-xl h-14 px-6 focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all"
                    placeholder="Minimum 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold font-headline text-on-surface-variant tracking-wider uppercase">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-surface-container-highest border-none rounded-xl h-14 px-6 focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {passwordError && <p className="text-sm text-error">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-on-tertiary-container">Password updated successfully</p>}

              <div className="pt-2 md:pt-4">
                <button
                  type="submit"
                  disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full md:w-auto obsidian-gradient text-on-primary font-headline text-sm font-bold py-4 px-10 rounded-xl shadow-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Account Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 items-start">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-surface-variant md:hidden">person</span>
              <h3 className="text-xl font-bold font-headline tracking-tight">Account</h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed hidden md:block">
              Manage your session or permanently remove your data from our system.
            </p>
          </div>
          <div className="md:col-span-2 space-y-6 md:space-y-12">
            {/* Session / Log Out */}
            {/* Desktop: glassmorphism card */}
            <div className="hidden md:block p-1 w-full bg-surface-container-high rounded-3xl overflow-hidden">
              <div className="bg-surface-container-lowest p-10 rounded-[1.25rem] flex items-center justify-between">
                <div>
                  <h4 className="font-bold font-headline text-lg mb-1">Session Access</h4>
                  <p className="text-sm text-on-surface-variant">
                    Logged in as {session?.user?.email || ''}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="bg-surface-container-low text-primary font-headline text-sm font-bold py-3 px-8 rounded-lg border border-outline-variant/20 hover:bg-surface-container-highest transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>

            {/* Mobile: simple button */}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="md:hidden w-full flex items-center justify-between px-6 py-4 rounded-xl border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container-high transition-colors group"
            >
              <span className="font-semibold text-primary">Log Out</span>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">
                logout
              </span>
            </button>

            {/* Danger Zone */}
            {/* Desktop */}
            <div className="hidden md:flex items-center justify-between px-4">
              <div>
                <h4 className="font-bold font-headline text-error text-lg mb-1">Danger Zone</h4>
                <p className="text-sm text-on-surface-variant">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-error font-headline text-sm font-bold hover:underline underline-offset-8 transition-all flex-shrink-0 ml-8"
              >
                Delete Account
              </button>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex justify-center pt-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-error font-medium text-sm border-b border-error/20 pb-0.5 hover:border-error transition-all"
              >
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="hidden md:block mt-32 pt-12 border-t border-outline-variant/10 text-center">
        <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.3em] font-medium">
          &copy; 2024 AutoResume Technologies. Editorial AI Precision.
        </p>
      </footer>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm px-6">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-error">warning</span>
              </div>
              <h3 className="font-headline font-bold text-lg">Delete Account?</h3>
            </div>
            <p className="text-sm text-on-surface-variant">
              This will permanently delete your account, all resumes, and all application data. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-error rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
