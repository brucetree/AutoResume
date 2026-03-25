import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnalysisResultsPage from '@/app/resume/[id]/edit/page'

const mockPush = jest.fn()
const mockApiGet = jest.fn()
const mockApiPut = jest.fn()
let mockEditorOnChange: ((html: string) => void) | null = null

jest.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'authenticated', data: { user: { name: 'Test' } } }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'app123' }),
  usePathname: () => '/resume/app123/edit',
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

jest.mock('@/components/layout/AppShell', () => {
  return function MockAppShell({ children }: { children: React.ReactNode }) {
    return <div data-testid="app-shell">{children}</div>
  }
})

// Mock next/dynamic to directly render the component
jest.mock('next/dynamic', () => {
  return (loader: () => Promise<{ default: React.ComponentType<unknown> }>) => {
    return function MockRichTextEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
      mockEditorOnChange = onChange
      return <div data-testid="rich-text-editor" data-content={content}>{content}</div>
    }
  }
})

const structuredAnalysis = JSON.stringify({
  matchScore: 84,
  suggestions: [
    {
      category: 'role_alignment',
      title: 'Role Alignment',
      items: ['Quantify project management impact', 'Add cross-functional collaboration examples'],
    },
    {
      category: 'skill_gaps',
      title: 'Skill Gaps',
      items: ['Add Agile/Scrum experience'],
    },
  ],
  skillBreakdown: [
    { skill: 'Technical Skills', level: 85 },
    { skill: 'Leadership', level: 70 },
  ],
  proTip: 'Focus on quantifying achievements with specific metrics.',
})

const mockApp = {
  application: {
    _id: 'app123',
    company: 'TestCorp',
    position: 'Engineer',
    jobDescription: 'Build things',
    gapAnalysis: structuredAnalysis,
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

describe('AnalysisResultsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEditorOnChange = null
    mockApiGet.mockResolvedValue(mockApp)
    mockApiPut.mockResolvedValue({})
  })

  it('shows loading state initially', () => {
    mockApiGet.mockReturnValue(new Promise(() => {})) // never resolves
    render(<AnalysisResultsPage />)
    expect(screen.getByText('Loading analysis...')).toBeInTheDocument()
  })

  it('fetches application by id and displays details', async () => {
    render(<AnalysisResultsPage />)
    await waitFor(() => {
      // Multiple elements expected (desktop + mobile views)
      expect(screen.getAllByText(/Engineer/).length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText(/TestCorp/).length).toBeGreaterThan(0)
    expect(mockApiGet).toHaveBeenCalledWith('/api/applications/app123')
  })

  it('displays match score', async () => {
    render(<AnalysisResultsPage />)
    await waitFor(() => {
      // Score appears in both desktop and mobile views
      expect(screen.getAllByText('84').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('/100').length).toBeGreaterThan(0)
  })

  it('displays revision suggestions', async () => {
    render(<AnalysisResultsPage />)
    await waitFor(() => {
      // Suggestions appear in both desktop and mobile views
      expect(screen.getAllByText('Role Alignment').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('Skill Gaps').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Quantify project management impact').length).toBeGreaterThan(0)
  })

  it('displays skill breakdown', async () => {
    render(<AnalysisResultsPage />)
    await waitFor(() => {
      expect(screen.getAllByText('Technical Skills').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('85%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Leadership').length).toBeGreaterThan(0)
    expect(screen.getAllByText('70%').length).toBeGreaterThan(0)
  })

  it('displays pro tip', async () => {
    render(<AnalysisResultsPage />)
    await waitFor(() => {
      expect(
        screen.getAllByText('Focus on quantifying achievements with specific metrics.').length
      ).toBeGreaterThan(0)
    })
  })

  it('renders rich text editor with content', async () => {
    render(<AnalysisResultsPage />)
    await waitFor(() => {
      // Editor appears in both desktop and mobile views
      const editors = screen.getAllByTestId('rich-text-editor')
      expect(editors.length).toBeGreaterThan(0)
      expect(editors[0]).toHaveAttribute('data-content', '<h1>Modified Resume</h1><p>Content here</p>')
    })
  })

  it('saves content when clicking save button', async () => {
    const user = userEvent.setup()
    render(<AnalysisResultsPage />)
    await waitFor(() => {
      expect(screen.getAllByText(/Engineer/).length).toBeGreaterThan(0)
    })
    // Click the first "Save Version" button (desktop view)
    const saveButtons = screen.getAllByText('Save Version')
    await user.click(saveButtons[0])
    expect(mockApiPut).toHaveBeenCalledWith('/api/resumes/mod1', {
      modifiedContent: '<h1>Modified Resume</h1><p>Content here</p>',
    })
  })

  it('shows record not found when app is null', async () => {
    mockApiGet.mockRejectedValue(new Error('not found'))
    render(<AnalysisResultsPage />)
    await waitFor(() => {
      expect(screen.getByText('Record not found')).toBeInTheDocument()
    })
  })

  it('wraps content in AppShell', async () => {
    render(<AnalysisResultsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('app-shell')).toBeInTheDocument()
    })
  })

  it('handles plain text gap analysis gracefully', async () => {
    mockApiGet.mockResolvedValue({
      application: {
        ...mockApp.application,
        gapAnalysis: 'Plain text gap analysis without JSON structure',
      },
    })
    render(<AnalysisResultsPage />)
    await waitFor(() => {
      expect(
        screen.getAllByText('Plain text gap analysis without JSON structure').length
      ).toBeGreaterThan(0)
    })
    // Should show the fallback "Gap Analysis" section
    expect(screen.getAllByText('Gap Analysis').length).toBeGreaterThan(0)
  })

  it('shows job description when expanded', async () => {
    const user = userEvent.setup()
    render(<AnalysisResultsPage />)
    await waitFor(() => {
      expect(screen.getAllByText('Job Description').length).toBeGreaterThan(0)
    })
    // Click the first "Job Description" button to expand
    const jdButtons = screen.getAllByText('Job Description')
    await user.click(jdButtons[0])
    expect(screen.getAllByText('Build things').length).toBeGreaterThan(0)
  })
})
