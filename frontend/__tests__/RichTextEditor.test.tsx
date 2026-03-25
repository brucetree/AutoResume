import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RichTextEditor from '@/components/RichTextEditor'

describe('RichTextEditor', () => {
  it('renders the editor with toolbar buttons', () => {
    render(<RichTextEditor content="" onChange={jest.fn()} />)
    expect(screen.getByTitle('Bold')).toBeInTheDocument()
    expect(screen.getByTitle('Italic')).toBeInTheDocument()
    expect(screen.getByTitle('Underline')).toBeInTheDocument()
    expect(screen.getByTitle('Undo')).toBeInTheDocument()
    expect(screen.getByTitle('Redo')).toBeInTheDocument()
  })

  it('renders heading buttons', () => {
    render(<RichTextEditor content="" onChange={jest.fn()} />)
    expect(screen.getByTitle('Heading 1')).toBeInTheDocument()
    expect(screen.getByTitle('Heading 2')).toBeInTheDocument()
    expect(screen.getByTitle('Heading 3')).toBeInTheDocument()
    expect(screen.getByText('P')).toBeInTheDocument()
  })

  it('renders list buttons', () => {
    render(<RichTextEditor content="" onChange={jest.fn()} />)
    expect(screen.getByTitle('Bullet List')).toBeInTheDocument()
    expect(screen.getByTitle('Numbered List')).toBeInTheDocument()
  })

  it('renders alignment and block buttons', () => {
    render(<RichTextEditor content="" onChange={jest.fn()} />)
    expect(screen.getByTitle('Align Left')).toBeInTheDocument()
    expect(screen.getByTitle('Align Center')).toBeInTheDocument()
    expect(screen.getByTitle('Quote')).toBeInTheDocument()
    expect(screen.getByTitle('Divider')).toBeInTheDocument()
  })

  it('renders initial HTML content', () => {
    render(<RichTextEditor content="<p>Hello World</p>" onChange={jest.fn()} />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders rich HTML content with headings', () => {
    render(<RichTextEditor content="<h2>Experience</h2><p>Software Engineer</p>" onChange={jest.fn()} />)
    expect(screen.getByText('Experience')).toBeInTheDocument()
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
  })
})
