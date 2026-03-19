import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RichTextEditor from '@/components/RichTextEditor'

describe('RichTextEditor', () => {
  it('renders the editor with toolbar buttons', () => {
    render(<RichTextEditor content="" onChange={jest.fn()} />)
    expect(screen.getByTitle('加粗')).toBeInTheDocument()
    expect(screen.getByTitle('斜体')).toBeInTheDocument()
    expect(screen.getByTitle('下划线')).toBeInTheDocument()
    expect(screen.getByTitle('撤销')).toBeInTheDocument()
    expect(screen.getByTitle('重做')).toBeInTheDocument()
  })

  it('renders heading buttons', () => {
    render(<RichTextEditor content="" onChange={jest.fn()} />)
    expect(screen.getByTitle('标题 1')).toBeInTheDocument()
    expect(screen.getByTitle('标题 2')).toBeInTheDocument()
    expect(screen.getByTitle('标题 3')).toBeInTheDocument()
    expect(screen.getByText('正文')).toBeInTheDocument()
  })

  it('renders list buttons', () => {
    render(<RichTextEditor content="" onChange={jest.fn()} />)
    expect(screen.getByTitle('无序列表')).toBeInTheDocument()
    expect(screen.getByTitle('有序列表')).toBeInTheDocument()
  })

  it('renders alignment and block buttons', () => {
    render(<RichTextEditor content="" onChange={jest.fn()} />)
    expect(screen.getByTitle('左对齐')).toBeInTheDocument()
    expect(screen.getByTitle('居中')).toBeInTheDocument()
    expect(screen.getByTitle('引用')).toBeInTheDocument()
    expect(screen.getByTitle('分隔线')).toBeInTheDocument()
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
