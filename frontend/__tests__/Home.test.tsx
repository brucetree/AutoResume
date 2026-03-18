import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// Mock next/link and next/font
jest.mock('next/link', () => {
  return function Link({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

jest.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter' }),
}))

describe('Home page', () => {
  it('renders the app title', () => {
    render(<Home />)
    expect(screen.getByText('autoResume')).toBeInTheDocument()
  })

  it('renders login and register links', () => {
    render(<Home />)
    expect(screen.getByText('立即开始')).toBeInTheDocument()
    expect(screen.getByText('注册账号')).toBeInTheDocument()
  })
})
