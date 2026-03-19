import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditResumePage from '@/app/resume/[id]/edit/page'

const mockPush = jest.fn()
const mockApiGet = jest.fn()
const mockApiPut = jest.fn()
let mockEditorOnChange: ((html: string) => void) | null = null

jest.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'authenticated' }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'app123' }),
}))

jest.mock('@/lib/api', () => ({
  apiGet: (...args: unknown[]) => mockApiGet(...args),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
}))

jest.mock('@/components/UserMenu', () => {
  return function MockUserMenu() {
    return <div data-testid="user-menu">UserMenu</div>
  }
})

// Mock next/dynamic to directly render the component
jest.mock('next/dynamic', () => {
  return (loader: () => Promise<{ default: React.ComponentType<unknown> }>) => {
    // Return a mock RichTextEditor component
    return function MockRichTextEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
      mockEditorOnChange = onChange
      return <div data-testid="rich-text-editor" data-content={content}>{content}</div>
    }
  }
})

const mockApp = {
  application: {
    _id: 'app123',
    company: 'TestCorp',
    position: 'Engineer',
    jobDescription: 'Build things',
    gapAnalysis: 'Need more experience with React',
    status: 'editing',
    createdAt: '2026-01-15T00:00:00Z',
    resumeId: {
      _id: 'res1',
      originalFileName: 'resume.pdf',
      parsedText: 'My resume text',
    },
    modifiedResumeId: {
      _id: 'mod1',
      modifiedContent: '<h1>Modified Resume</h1><p>Content here</p>',
    },
  },
}

describe('EditResumePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEditorOnChange = null
    mockApiGet.mockResolvedValue(mockApp)
    mockApiPut.mockResolvedValue({})
  })

  it('shows loading state initially', () => {
    mockApiGet.mockReturnValue(new Promise(() => {})) // never resolves
    render(<EditResumePage />)
    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('fetches application by id and displays details', async () => {
    render(<EditResumePage />)
    await waitFor(() => {
      expect(screen.getByText('TestCorp')).toBeInTheDocument()
    })
    expect(screen.getByText('Engineer')).toBeInTheDocument()
    expect(screen.getByText('编辑中')).toBeInTheDocument()
    expect(mockApiGet).toHaveBeenCalledWith('/api/applications/app123')
  })

  it('displays gap analysis', async () => {
    render(<EditResumePage />)
    await waitFor(() => {
      expect(screen.getByText('Need more experience with React')).toBeInTheDocument()
    })
  })

  it('displays job description in details', async () => {
    render(<EditResumePage />)
    await waitFor(() => {
      expect(screen.getByText('查看岗位描述 (JD)')).toBeInTheDocument()
    })
  })

  it('renders rich text editor with content', async () => {
    render(<EditResumePage />)
    await waitFor(() => {
      const editor = screen.getByTestId('rich-text-editor')
      expect(editor).toBeInTheDocument()
      expect(editor).toHaveAttribute('data-content', '<h1>Modified Resume</h1><p>Content here</p>')
    })
  })

  it('saves content when clicking save button', async () => {
    const user = userEvent.setup()
    render(<EditResumePage />)
    await waitFor(() => {
      expect(screen.getByText('TestCorp')).toBeInTheDocument()
    })
    await user.click(screen.getByText('保存'))
    expect(mockApiPut).toHaveBeenCalledWith('/api/resumes/mod1', {
      modifiedContent: '<h1>Modified Resume</h1><p>Content here</p>',
    })
  })

  it('navigates to dashboard when clicking back button', async () => {
    const user = userEvent.setup()
    render(<EditResumePage />)
    await waitFor(() => {
      expect(screen.getByText('TestCorp')).toBeInTheDocument()
    })
    await user.click(screen.getByText('返回'))
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('shows record not found when app is null', async () => {
    mockApiGet.mockRejectedValue(new Error('not found'))
    render(<EditResumePage />)
    await waitFor(() => {
      expect(screen.getByText('记录不存在')).toBeInTheDocument()
    })
  })

  it('includes UserMenu component', async () => {
    render(<EditResumePage />)
    await waitFor(() => {
      expect(screen.getByTestId('user-menu')).toBeInTheDocument()
    })
  })
})
