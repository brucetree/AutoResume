'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { apiGet, apiPut, apiPostBlob } from '@/lib/api'
import AppShell from '@/components/layout/AppShell'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false })

/* ── Types ── */
interface StructuredAnalysis {
  matchScore: number
  suggestions: Array<{
    category: string
    title: string
    items: string[]
  }>
  skillBreakdown: Array<{
    skill: string
    level: number
  }>
  proTip: string
}

interface ApplicationDetail {
  _id: string
  company: string
  position: string
  jobDescription: string
  jobUrl?: string
  gapAnalysis: string
  status: string
  createdAt: string
  resumeId: {
    _id: string
    originalFileName: string
    parsedText: string
  }
  modifiedResumeId: {
    _id: string
    modifiedContent: string
  }
}

/* ── Helpers ── */
const CATEGORY_META: Record<string, { icon: string; color: string; bg: string }> = {
  role_alignment: { icon: 'target', color: 'text-surface-tint', bg: 'bg-primary-fixed/30' },
  skill_gaps: { icon: 'warning', color: 'text-amber-600', bg: 'bg-amber-50' },
  experience: { icon: 'work', color: 'text-purple-600', bg: 'bg-purple-50' },
  formatting: { icon: 'format_paint', color: 'text-teal-600', bg: 'bg-teal-50' },
  general: { icon: 'lightbulb', color: 'text-surface-tint', bg: 'bg-primary-fixed/30' },
}

function parseAnalysis(raw: string): StructuredAnalysis | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.matchScore === 'number') return parsed
    return null
  } catch {
    return null
  }
}

/* ── Circular Score ── */
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const scoreColor =
    score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500'
  const strokeColor =
    score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-container-high"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-headline font-extrabold ${scoreColor}`}>{score}</span>
        <span className="text-[10px] text-on-surface-variant font-medium">/100</span>
      </div>
    </div>
  )
}

/* ── Skill Bar ── */
function SkillBar({ skill, level }: { skill: string; level: number }) {
  const barColor =
    level >= 80 ? 'bg-emerald-500' : level >= 60 ? 'bg-surface-tint' : level >= 40 ? 'bg-amber-500' : 'bg-red-400'

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-on-surface">{skill}</span>
        <span className="text-[10px] font-bold text-on-surface-variant">{level}%</span>
      </div>
      <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function AnalysisResultsPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [app, setApp] = useState<ApplicationDetail | null>(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mobileTab, setMobileTab] = useState<'analyze' | 'editor'>('analyze')
  const [showJD, setShowJD] = useState(false)

  const analysis = useMemo(() => {
    if (!app?.gapAnalysis) return null
    return parseAnalysis(app.gapAnalysis)
  }, [app?.gapAnalysis])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && id) {
      apiGet<{ application: ApplicationDetail }>(`/api/applications/${id}`)
        .then((data) => {
          setApp(data.application)
          setContent(data.application.modifiedResumeId?.modifiedContent || '')
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [status, id])

  async function handleSave() {
    if (!app?.modifiedResumeId?._id) return
    setSaving(true)
    try {
      await apiPut(`/api/resumes/${app.modifiedResumeId._id}`, { modifiedContent: content })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    if (!app) return
    setExporting(true)
    try {
      // Save latest content first
      await apiPut(`/api/resumes/${app.modifiedResumeId._id}`, { modifiedContent: content })
      // Fetch PDF as blob with auth token
      const blob = await apiPostBlob(`/api/applications/${app._id}/export-pdf`)
      // Trigger browser download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${app.company}-${app.position}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-on-surface-variant">Loading analysis...</p>
        </div>
      </AppShell>
    )
  }

  if (!app) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <span className="material-symbols-outlined text-5xl text-outline-variant">search_off</span>
          <p className="text-on-surface-variant">Record not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-surface-tint hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </AppShell>
    )
  }

  /* ── Analysis Panel Content ── */
  const AnalysisContent = (
    <div className="space-y-6">
      {/* Header with score */}
      <div className="bg-surface-container-lowest rounded-xl p-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-tertiary-fixed/10 blur-3xl rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-headline text-lg font-bold tracking-tight text-on-surface">
                Match Optimization Score
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                {app.company} · {app.position}
              </p>
            </div>
            <span className="text-[10px] text-on-tertiary-container font-bold px-2 py-0.5 bg-tertiary-fixed rounded">
              AI
            </span>
          </div>

          <div className="flex items-center gap-8">
            <ScoreRing score={analysis?.matchScore ?? 70} />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-on-surface">
                {(analysis?.matchScore ?? 70) >= 80
                  ? 'Strong match! Your profile aligns well.'
                  : (analysis?.matchScore ?? 70) >= 60
                  ? 'Good foundation with room for improvement.'
                  : 'Significant gaps detected. Review suggestions below.'}
              </p>
              <p className="text-xs text-on-surface-variant">
                Based on AI analysis of your resume against the target role requirements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revision Suggestions */}
      {analysis?.suggestions && analysis.suggestions.length > 0 && (
        <div>
          <h3 className="font-headline text-sm font-bold tracking-tight text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">edit_note</span>
            Revision Suggestions
          </h3>
          <div className="space-y-3">
            {analysis.suggestions.map((group, idx) => {
              const meta = CATEGORY_META[group.category] || CATEGORY_META.general
              return (
                <div key={idx} className="bg-surface-container-lowest rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined text-base ${meta.color}`}>
                        {meta.icon}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-on-surface">{group.title}</h4>
                  </div>
                  <ul className="space-y-2 ml-11">
                    {group.items.map((item, i) => (
                      <li key={i} className="text-xs text-on-surface-variant leading-relaxed flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-outline-variant mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Skill Breakdown */}
      {analysis?.skillBreakdown && analysis.skillBreakdown.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-5">
          <h3 className="font-headline text-sm font-bold tracking-tight text-on-surface mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">bar_chart</span>
            Skill Proficiency Breakdown
          </h3>
          <div className="space-y-4">
            {analysis.skillBreakdown.map((s, idx) => (
              <SkillBar key={idx} skill={s.skill} level={s.level} />
            ))}
          </div>
        </div>
      )}

      {/* Job Description Reference */}
      {app.jobDescription && (
        <div className="bg-surface-container-lowest rounded-xl p-5">
          <button
            onClick={() => setShowJD(!showJD)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="font-headline text-sm font-bold tracking-tight text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-base">description</span>
              Job Description
            </h3>
            <span
              className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${
                showJD ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </button>
          {showJD && (
            <div className="mt-4 max-h-60 overflow-y-auto scrollbar-thin">
              <pre className="whitespace-pre-wrap text-xs text-on-surface-variant leading-relaxed">
                {app.jobDescription}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Pro Tip */}
      {analysis?.proTip && (
        <div className="bg-tertiary-container rounded-xl p-5 flex gap-4 items-start">
          <div className="w-8 h-8 rounded-lg bg-tertiary-fixed/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-base text-tertiary-fixed">auto_awesome</span>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-tertiary-container mb-1">
              Pro Tip
            </h4>
            <p className="text-xs text-on-tertiary-container/80 leading-relaxed">
              {analysis.proTip}
            </p>
          </div>
        </div>
      )}

      {/* Fallback for unstructured analysis */}
      {!analysis && app.gapAnalysis && (
        <div className="bg-surface-container-lowest rounded-xl p-5">
          <h3 className="font-headline text-sm font-bold tracking-tight text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">analytics</span>
            Gap Analysis
          </h3>
          <pre className="whitespace-pre-wrap text-xs text-on-surface-variant leading-relaxed">
            {app.gapAnalysis}
          </pre>
        </div>
      )}
    </div>
  )

  /* ── Editor Panel Content ── */
  const EditorContent = (
    <div className="space-y-4">
      {/* Editor Actions */}
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-sm font-bold tracking-tight text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-base">edit_document</span>
          Resume Editor
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold bg-surface-container-low hover:bg-surface-container-high text-on-surface rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Version'}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="obsidian-gradient px-4 py-2 text-xs font-bold text-on-primary rounded-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            {exporting ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* TipTap Editor */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-ambient-light">
        <RichTextEditor content={content} onChange={setContent} />
      </div>

      <p className="text-[10px] text-on-surface-variant italic">
        Use the toolbar to format resume content. Changes are auto-rendered when exporting to PDF.
      </p>
    </div>
  )

  return (
    <AppShell>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto mb-6 md:mb-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="md:hidden w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-on-surface text-lg">arrow_back</span>
            </button>
            <span className="text-on-tertiary-container bg-tertiary-fixed px-3 py-1 rounded-full md:rounded-sm text-[10px] font-bold tracking-widest uppercase">
              Analysis Results
            </span>
          </div>
          <h2 className="font-headline text-2xl md:text-4xl font-extrabold tracking-tighter text-on-surface mt-1">
            <span className="hidden md:inline">{app.position} — {app.company}</span>
            <span className="md:hidden">{app.position}</span>
          </h2>
          <p className="text-on-surface-variant text-xs md:text-sm font-light">
            <span className="md:hidden">{app.company} · </span>
            {app.resumeId?.originalFileName} · {new Date(app.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex gap-1 bg-surface-container-high rounded-xl p-1 mb-6 max-w-7xl mx-auto">
        <button
          onClick={() => setMobileTab('analyze')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'analyze'
              ? 'bg-surface-container-lowest text-on-surface shadow-sm'
              : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-sm">analytics</span>
          Analyze
        </button>
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'editor'
              ? 'bg-surface-container-lowest text-on-surface shadow-sm'
              : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-sm">edit_document</span>
          Editor
        </button>
      </div>

      {/* Desktop: Two-Panel Layout */}
      <div className="hidden md:grid md:grid-cols-12 gap-8 max-w-7xl mx-auto">
        {/* Left: Analysis Panel */}
        <div className="md:col-span-5 space-y-6">
          <div className="sticky top-24 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 pb-8 scrollbar-thin">
            {AnalysisContent}
          </div>
        </div>

        {/* Right: Editor Panel */}
        <div className="md:col-span-7">
          {EditorContent}
        </div>
      </div>

      {/* Mobile: Tab Content */}
      <div className="md:hidden max-w-7xl mx-auto">
        {mobileTab === 'analyze' ? AnalysisContent : EditorContent}
      </div>

      {/* Mobile Floating Action */}
      {mobileTab === 'analyze' && (
        <div className="md:hidden fixed bottom-24 left-0 right-0 px-6 z-40">
          <button
            onClick={() => setMobileTab('editor')}
            className="w-full obsidian-gradient py-4 rounded-xl text-on-primary font-headline font-extrabold tracking-tight text-sm shadow-xl shadow-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Open Resume Editor
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      )}

      {mobileTab === 'editor' && (
        <div className="md:hidden fixed bottom-24 left-0 right-0 px-6 z-40 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl text-xs font-bold bg-surface-container-lowest text-on-surface shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 obsidian-gradient py-3.5 rounded-xl text-xs font-bold text-on-primary shadow-xl shadow-primary/10 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            {exporting ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      )}
    </AppShell>
  )
}
