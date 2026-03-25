import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserMenu from '@/components/UserMenu'

const mockSignOut = jest.fn()

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { name: 'Bruce', email: 'bruce@test.com' } },
  }),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}))

describe('UserMenu', () => {
  beforeEach(() => {
    mockSignOut.mockClear()
  })

  it('renders the user name', () => {
    render(<UserMenu />)
    expect(screen.getByText('Bruce')).toBeInTheDocument()
  })

  it('does not show dropdown by default', () => {
    render(<UserMenu />)
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
  })

  it('shows dropdown when clicking user name', async () => {
    const user = userEvent.setup()
    render(<UserMenu />)
    await user.click(screen.getByText('Bruce'))
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  it('calls signOut when clicking logout', async () => {
    const user = userEvent.setup()
    render(<UserMenu />)
    await user.click(screen.getByText('Bruce'))
    await user.click(screen.getByText('Sign Out'))
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
  })

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    render(<div><UserMenu /><span>outside</span></div>)
    await user.click(screen.getByText('Bruce'))
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
    await user.click(screen.getByText('outside'))
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
  })
})
