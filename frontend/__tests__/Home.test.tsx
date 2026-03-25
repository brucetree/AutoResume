/**
 * Home page now redirects based on auth status:
 * - Authenticated → /dashboard
 * - Unauthenticated → /login
 *
 * Since it's a server component using getServerSession() and redirect(),
 * it cannot be unit tested with render(). The redirect logic is verified
 * by integration/e2e tests instead.
 */

// Mock next-auth to avoid jose ESM import issues in Jest
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Home from '@/app/page'

describe('Home page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to /dashboard when authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'Test' } })

    await Home()

    expect(redirect).toHaveBeenCalledWith('/dashboard')
  })

  it('redirects to /login when not authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    await Home()

    expect(redirect).toHaveBeenCalledWith('/login')
  })
})
