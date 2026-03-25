import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResumesPage from '@/app/resumes/page'

const mockApiGet = jest.fn()
const mockApiPatch = jest.fn()
const mockApiDelete = jest.fn()
const mockApiGetBlob = jest.fn()
const mockApiUpload = jest.fn()

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { name: 'Bruce', email: 'bruce@test.com' } },
    status: 'authenticated',
  }),
}))

jest.mock('@/lib/api', () => ({
  apiGet: (...args: unknown[]) => mockApiGet(...args),
  apiPatch: (...args: unknown[]) => mockApiPatch(...args),
  apiDelete: (...args: unknown[]) => mockApiDelete(...args),
  apiGetBlob: (...args: unknown[]) => mockApiGetBlob(...args),
  apiUpload: (...args: unknown[]) => mockApiUpload(...args),
}))

const mockResumes = [
  {
    _id: 'r1',
    originalFileName: 'Product_Manager_v1.pdf',
    fileType: 'pdf',
    fileSize: 2457600,
    isPrimary: true,
    version: 1,
    createdAt: '2023-10-12T00:00:00Z',
    updatedAt: '2023-10-12T00:00:00Z',
  },
  {
    _id: 'r2',
    originalFileName: 'Senior_Lead_2024.pdf',
    fileType: 'pdf',
    fileSize: 1843200,
    isPrimary: false,
    version: 1,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
]

describe('ResumesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApiGet.mockResolvedValue({ resumes: mockResumes })
    mockApiPatch.mockResolvedValue({ resume: mockResumes[0] })
    mockApiDelete.mockResolvedValue({ message: 'Resume deleted successfully' })
  })

  it('renders resume list', async () => {
    render(<ResumesPage />)
    await waitFor(() => {
      expect(screen.getByText('Product_Manager_v1.pdf')).toBeInTheDocument()
      expect(screen.getByText('Senior_Lead_2024.pdf')).toBeInTheDocument()
    })
  })

  it('shows Primary badge for primary resume', async () => {
    render(<ResumesPage />)
    await waitFor(() => {
      expect(screen.getByText('Primary')).toBeInTheDocument()
    })
  })

  it('shows empty state when no resumes', async () => {
    mockApiGet.mockResolvedValue({ resumes: [] })
    render(<ResumesPage />)
    await waitFor(() => {
      expect(screen.getByText('No resumes uploaded yet')).toBeInTheDocument()
    })
  })

  it('shows upload card', async () => {
    render(<ResumesPage />)
    await waitFor(() => {
      expect(screen.getAllByText(/Upload New Resume|Import Resume/).length).toBeGreaterThan(0)
    })
  })

  it('shows delete confirmation modal', async () => {
    const user = userEvent.setup()
    render(<ResumesPage />)
    await waitFor(() => {
      expect(screen.getByText('Product_Manager_v1.pdf')).toBeInTheDocument()
    })
    // Click delete button (desktop)
    const deleteButtons = screen.getAllByTitle('Delete')
    await user.click(deleteButtons[0])
    expect(screen.getByText('Delete Resume?')).toBeInTheDocument()
  })

  it('renders page heading', async () => {
    render(<ResumesPage />)
    await waitFor(() => {
      expect(screen.getByText('Resume Management')).toBeInTheDocument()
    })
  })
})
