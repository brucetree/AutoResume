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
  usePathname: () => '/dashboard',
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
    mockApiGet.mockImplementation((path: string) => {
      if (path === '/api/applications') return Promise.resolve({ applications: mockApplications })
      if (path === '/api/resumes') return Promise.resolve({ resumes: [] })
      return Promise.resolve({})
    })
  })

  it('renders application records', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('SWE')).toBeInTheDocument()
      expect(screen.getByText('Frontend')).toBeInTheDocument()
    })
  })

  it('links to edit page using application ID', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      const links = screen.getAllByText('Resume Editing')
      expect(links[0].closest('a')).toHaveAttribute('href', '/resume/app1/edit')
    })
  })

  it('shows empty state when no applications', async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path === '/api/applications') return Promise.resolve({ applications: [] })
      if (path === '/api/resumes') return Promise.resolve({ resumes: [] })
      return Promise.resolve({})
    })
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('No applications yet')).toBeInTheDocument()
    })
  })

  it('displays status labels correctly', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getAllByText('Draft').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Applied').length).toBeGreaterThan(0)
    })
  })

  it('renders dashboard heading on desktop', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  it('renders stats section', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getAllByText(/Resumes Scanned/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/AI Efficiency/i).length).toBeGreaterThan(0)
    })
  })
})
