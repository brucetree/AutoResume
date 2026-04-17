'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiGet, apiDelete } from '@/lib/api'

interface Application {
  _id: string
  company: string
  position: string
  status: string
  createdAt: string
  matchScore?: number | null
  processingTime?: number | null
}

interface Resume {
  _id: string
  originalFileName: string
  version: number
  createdAt: string
  updatedAt: string
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  analyzing: {
    label: 'Analyzing',
    bg: 'bg-primary-container',
    text: 'text-on-primary-container',
  },
  editing: {
    label: 'Draft',
    bg: 'bg-surface-container-highest',
    text: 'text-on-surface-variant',
  },
  applied: {
    label: 'Applied',
    bg: 'bg-tertiary-fixed',
    text: 'text-on-tertiary-fixed',
  },
  interview: {
    label: 'Interview',
    bg: 'bg-secondary-container',
    text: 'text-on-secondary-container',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-error-container',
    text: 'text-on-error-container',
  },
  offer: {
    label: 'Offer',
    bg: 'bg-tertiary-fixed',
    text: 'text-on-tertiary-fixed',
  },
}

const ACTION_LABELS: Record<string, string> = {
  analyzing: 'View Progress',
  editing: 'Resume Editing',
  applied: 'Manage Details',
  interview: 'Manage Details',
  rejected: 'View Details',
  offer: 'View Details',
}

const APP_ICONS = ['architecture', 'token', 'layers', 'hub', 'diamond', 'auto_awesome']

function getTimeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

export default function DashboardPage() {
  const { status } = useSession()
  const [applications, setApplications] = useState<Application[]>([])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'analyzing' | 'applied'>('all')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const fetchData = () => {
    Promise.all([
      apiGet<{ applications: Application[] }>('/api/applications').catch(() => ({ applications: [] })),
      apiGet<{ resumes: Resume[] }>('/api/resumes').catch(() => ({ resumes: [] })),
    ])
      .then(([appData, resumeData]) => {
        setApplications(appData.applications || [])
        setResumes(resumeData.resumes || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (status === 'authenticated') fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const handleDeleteApp = async (id: string) => {
    try {
      await apiDelete(`/api/applications/${id}`)
      setApplications((prev) => prev.filter((a) => a._id !== id))
    } catch (err) {
      console.error('Delete application failed:', err)
    }
    setDeleteConfirmId(null)
  }

  const filteredApps = applications.filter((app) => {
    if (filter === 'all') return true
    if (filter === 'analyzing') return app.status === 'analyzing'
    if (filter === 'applied') return ['applied', 'interview', 'offer'].includes(app.status)
    return true
  })

  const scoredApps = applications.filter((a) => typeof a.matchScore === 'number')
  const avgScore = scoredApps.length > 0
    ? Math.round((scoredApps.reduce((sum, a) => sum + (a.matchScore as number), 0) / scoredApps.length) * 10) / 10
    : 0

  const timedApps = applications.filter((a) => typeof a.processingTime === 'number')
  const avgProcessingMs = timedApps.length > 0
    ? timedApps.reduce((sum, a) => sum + (a.processingTime as number), 0) / timedApps.length
    : 0
  const avgProcessingDisplay = avgProcessingMs > 0 ? `${(avgProcessingMs / 1000).toFixed(1)}s` : ''

  const totalScanned = applications.length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 md:space-y-20 md:p-6">
      {/* Hero Header */}
      <section>
        {/* Mobile header */}
        <div className="md:hidden mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-1">Performance</p>
          <h2 className="text-3xl font-bold font-headline tracking-tight">Daily Insights</h2>
        </div>
        {/* Desktop header */}
        <div className="hidden md:block">
          <h2 className="font-headline text-5xl font-extrabold tracking-tighter text-on-surface">Dashboard</h2>
          <p className="mt-4 text-on-surface-variant font-body text-lg max-w-xl">
            Optimize your professional trajectory with high-fidelity resume analysis and tracking.
          </p>
        </div>
      </section>

      {/* Stats Grid */}
      {/* Mobile: horizontal scroll */}
      <section className="md:hidden -mx-6 px-6">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar">
          <div className={`min-w-[140px] flex-shrink-0 bg-surface-container-lowest p-5 rounded-xl editorial-shadow ${avgScore > 0 ? '' : 'opacity-60'}`}>
            <p className="text-on-surface-variant text-[11px] font-medium mb-3">Avg. Match Score</p>
            {avgScore > 0 ? (
              <>
                <p className="text-3xl font-extrabold font-headline text-on-tertiary-container">
                  {avgScore}
                  <span className="text-sm ml-0.5">%</span>
                </p>
                <div className="mt-4 w-full bg-surface-container-high h-1 rounded-[9999px]">
                  <div className="bg-on-tertiary-container h-full rounded-[9999px]" style={{ width: `${avgScore}%` }} />
                </div>
              </>
            ) : (
              <>
                <p className="text-lg font-bold font-headline text-on-surface mt-1">Not yet</p>
                <p className="text-[10px] text-on-surface-variant mt-2 font-medium leading-relaxed">
                  Run your first analysis to unlock insights
                </p>
              </>
            )}
          </div>
          <div className="min-w-[140px] flex-shrink-0 bg-surface-container-lowest p-5 rounded-xl editorial-shadow">
            <p className="text-on-surface-variant text-[11px] font-medium mb-3">Resumes Scanned</p>
            <p className="text-3xl font-extrabold font-headline">{totalScanned}</p>
            <p className="text-[10px] text-on-surface-variant mt-2 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              Active
            </p>
          </div>
          <div className={`min-w-[140px] flex-shrink-0 bg-surface-container-lowest p-5 rounded-xl editorial-shadow ${avgProcessingDisplay ? '' : 'opacity-60'}`}>
            <p className="text-on-surface-variant text-[11px] font-medium mb-3">AI Efficiency</p>
            {avgProcessingDisplay ? (
              <>
                <p className="text-3xl font-extrabold font-headline">{avgProcessingDisplay}</p>
                <p className="text-[10px] text-on-tertiary-container mt-2 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">bolt</span>
                  Optimal
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold font-headline text-on-surface mt-1">Not yet</p>
                <p className="text-[10px] text-on-surface-variant mt-2 font-medium leading-relaxed">
                  Processing time appears after your first analysis
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Desktop: bento grid */}
      <section className="hidden md:grid grid-cols-12 gap-6 h-[240px]">
        <div className="col-span-4 bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between group hover:bg-white transition-all">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-on-surface-variant font-label text-xs uppercase tracking-widest">Resumes Scanned</span>
              <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">description</span>
            </div>
            <p className="text-5xl font-headline font-extrabold mt-6 tracking-tighter">{totalScanned}</p>
          </div>
          <div className="flex items-center gap-2 text-tertiary-container text-xs font-semibold">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>Active tracking</span>
          </div>
        </div>

        <div className={`col-span-4 bg-primary text-on-primary p-8 rounded-xl flex flex-col justify-between overflow-hidden relative group transition-opacity ${avgScore > 0 ? '' : 'opacity-60'}`}>
          <div className="z-10">
            <div className="flex justify-between items-start">
              <span className="text-on-primary/60 font-label text-xs uppercase tracking-widest">Avg. Match Score</span>
              <span className="material-symbols-outlined text-on-primary/40">verified</span>
            </div>
            {avgScore > 0 ? (
              <p className="text-5xl font-headline font-extrabold mt-6 tracking-tighter">{avgScore}%</p>
            ) : (
              <div className="mt-6">
                <p className="text-3xl font-headline font-extrabold tracking-tight">Not yet</p>
                <p className="text-on-primary/70 text-sm mt-2 leading-relaxed max-w-[220px]">
                  Run your first analysis to unlock insights
                </p>
              </div>
            )}
          </div>
          <div className="z-10 flex items-center gap-2 text-tertiary-fixed text-xs font-semibold">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span>{avgScore > 0 ? 'High Precision Achieved' : 'Awaiting your first result'}</span>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-on-primary-container rounded-[9999px] blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity" />
        </div>

        <div className={`col-span-4 bg-tertiary-fixed p-8 rounded-xl flex flex-col justify-between group transition-opacity ${avgProcessingDisplay ? '' : 'opacity-60'}`}>
          <div>
            <div className="flex justify-between items-start">
              <span className="text-on-tertiary-fixed font-label text-xs uppercase tracking-widest">AI Efficiency</span>
              <span className="material-symbols-outlined text-on-tertiary-fixed/40">psychology</span>
            </div>
            {avgProcessingDisplay ? (
              <p className="text-5xl font-headline font-extrabold mt-6 tracking-tighter text-on-tertiary-fixed">{avgProcessingDisplay}</p>
            ) : (
              <div className="mt-6">
                <p className="text-3xl font-headline font-extrabold tracking-tight text-on-tertiary-fixed">Not yet</p>
                <p className="text-on-tertiary-fixed/80 text-sm mt-2 leading-relaxed max-w-[220px]">
                  Processing time appears after your first analysis
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-on-tertiary-fixed text-xs font-semibold">
            <span className="material-symbols-outlined text-sm">speed</span>
            <span>{avgProcessingDisplay ? 'Average Processing Time' : 'Awaiting your first result'}</span>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        {/* Application History */}
        <section className="md:col-span-8 space-y-6 md:space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-xl md:text-2xl font-bold tracking-tight">
              <span className="hidden md:inline">Application History</span>
              <span className="md:hidden">Recent Applications</span>
            </h3>
            {/* Desktop filter pills */}
            <div className="hidden md:flex gap-2">
              {(['all', 'analyzing', 'applied'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-[9999px] text-xs font-medium cursor-pointer transition-all ${
                    filter === f
                      ? 'bg-surface-container-highest text-on-surface-variant'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-primary hover:text-on-primary'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'analyzing' ? 'Analyzing' : 'Applied'}
                </button>
              ))}
            </div>
            {/* Mobile "View All" */}
            <span className="md:hidden text-sm font-medium text-on-surface-variant">View All</span>
          </div>

          {filteredApps.length === 0 ? (
            <div className="bg-surface-container-low p-12 rounded-xl text-center space-y-4">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">inbox</span>
              <p className="text-on-surface-variant">No applications yet</p>
              <Link
                href="/resume/upload"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Upload a resume to get started
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApps.map((app, idx) => {
                const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.editing
                const icon = APP_ICONS[idx % APP_ICONS.length]
                return (
                  <div
                    key={app._id}
                    className="bg-surface-container-low rounded-xl group hover:bg-surface-container-high transition-colors"
                  >
                    <div className="p-4 md:p-6 flex items-center justify-between">
                      {/* Mobile: entire left side is a link */}
                      <Link
                        href={`/resume/${app._id}/edit`}
                        className="flex items-center gap-4 md:gap-6 flex-1 min-w-0"
                      >
                        <div className="w-12 h-12 bg-surface-container-lowest rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary">{icon}</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-on-surface">{app.position}</h4>
                          <p className="text-[11px] md:text-xs text-on-surface-variant">
                            {app.company} &bull; {getTimeAgo(app.createdAt)}
                          </p>
                        </div>
                      </Link>

                      <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
                        {/* Status badge — desktop only */}
                        <span
                          className={`hidden md:inline-block ${statusCfg.bg} ${statusCfg.text} px-3 py-1 rounded-[9999px] text-[10px] font-bold uppercase tracking-widest`}
                        >
                          {statusCfg.label}
                        </span>

                        {/* Desktop: chevron link */}
                        <Link
                          href={`/resume/${app._id}/edit`}
                          className="hidden md:flex items-center text-on-surface-variant group-hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </Link>

                        {/* Mobile: status badge (compact) */}
                        <span
                          className={`md:hidden ${statusCfg.bg} ${statusCfg.text} px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight`}
                        >
                          {statusCfg.label}
                        </span>

                        {/* Delete button — both desktop and mobile */}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDeleteConfirmId(app._id)
                          }}
                          className="text-on-surface-variant/40 hover:text-error transition-colors p-1"
                          title="Delete application"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Manage Resumes Sidebar */}
        <section className="md:col-span-4 space-y-6 md:space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-xl md:text-2xl font-bold tracking-tight">Manage Resumes</h3>
            <Link href="/resume/upload">
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">add</span>
            </Link>
          </div>

          {resumes.length === 0 ? (
            <div className="space-y-4">
              {/* Import card */}
              <Link
                href="/resume/upload"
                className="bg-surface-container-low p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 border border-dashed border-outline-variant hover:border-primary/30 transition-all"
              >
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">upload_file</span>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Import Resume</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {resumes.slice(0, 3).map((resume, idx) => {
                const isActive = idx === 0
                const versionLabel = isActive
                  ? `Active v${resume.version || idx + 1}`
                  : `v${resume.version || idx + 1} Archive`
                return (
                  <div
                    key={resume._id}
                    className={`bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-transparent hover:border-primary/10 transition-all cursor-pointer group ${
                      !isActive ? 'opacity-70 hover:opacity-100' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-12 bg-surface-container rounded-sm flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline">picture_as_pdf</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isActive
                            ? 'bg-tertiary-container text-on-tertiary-container'
                            : 'bg-outline-variant/40 text-on-surface-variant'
                        }`}
                      >
                        {versionLabel}
                      </span>
                    </div>
                    <h5 className="font-bold text-sm">{resume.originalFileName || 'Resume.pdf'}</h5>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      Updated {new Date(resume.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    {isActive && (
                      <div className="mt-4 pt-4 border-t border-outline-variant/10 flex gap-4">
                        <span className="material-symbols-outlined text-xs text-on-surface-variant hover:text-primary cursor-pointer">visibility</span>
                        <span className="material-symbols-outlined text-xs text-on-surface-variant hover:text-primary cursor-pointer">content_copy</span>
                        <span className="material-symbols-outlined text-xs text-on-surface-variant hover:text-error cursor-pointer">delete</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* AI Insights Chip */}
          {applications.length > 0 && (
            <div className="bg-tertiary-fixed p-6 rounded-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-on-tertiary-fixed"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-on-tertiary-fixed">AI Strategy Tip</span>
              </div>
              <p className="text-sm font-medium text-on-tertiary-fixed leading-relaxed">
                Upload your resume and a job description to get AI-powered optimization suggestions and match scoring.
              </p>
              <Link
                href="/resume/upload"
                className="text-xs font-extrabold text-on-tertiary-fixed underline underline-offset-4 decoration-2 hover:opacity-70 transition-all"
              >
                Start Analysis
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-24 right-6 z-40">
        <Link
          href="/resume/upload"
          className="w-14 h-14 obsidian-gradient text-on-primary rounded-[9999px] editorial-shadow flex items-center justify-center active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-2xl">upload_file</span>
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm px-6">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-error">warning</span>
              </div>
              <h3 className="font-headline font-bold text-lg">Delete Application?</h3>
            </div>
            <p className="text-sm text-on-surface-variant">
              This will permanently remove this application record and its analysis data.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteApp(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium text-white bg-error rounded-lg hover:bg-error/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
