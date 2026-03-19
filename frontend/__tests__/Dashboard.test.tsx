import { render, screen, waitFor } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'

const mockPush = jest.fn()
const mockApiGet = jest.fn()

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { name: 'Bruce', email: 'bruce@test.com' } },
    status: 'authenticated',
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('next/link', () => {
  return function Link({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

jest.mock('@/lib/api', () => ({
  apiGet: (...args: unknown[]) => mockApiGet(...args),
}))

jest.mock('@/components/UserMenu', () => {
  return function MockUserMenu() {
    return <div data-testid="user-menu">UserMenu</div>
  }
})

const mockApplications = [
  {
    _id: 'app1',
    company: 'Google',
    position: 'SWE',
    status: 'editing',
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    _id: 'app2',
    company: 'Meta',
    position: 'Frontend',
    status: 'applied',
    createdAt: '2026-01-12T00:00:00Z',
  },
]

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApiGet.mockResolvedValue({ applications: mockApplications })
  })

  it('renders application records', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument()
      expect(screen.getByText('Meta')).toBeInTheDocument()
    })
  })

  it('links to edit page using application ID', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      const links = screen.getAllByText('查看简历')
      expect(links[0].closest('a')).toHaveAttribute('href', '/resume/app1/edit')
      expect(links[1].closest('a')).toHaveAttribute('href', '/resume/app2/edit')
    })
  })

  it('shows empty state when no applications', async () => {
    mockApiGet.mockResolvedValue({ applications: [] })
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('还没有投递记录')).toBeInTheDocument()
    })
  })

  it('displays status labels correctly', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('编辑中')).toBeInTheDocument()
      expect(screen.getByText('已投递')).toBeInTheDocument()
    })
  })
})
