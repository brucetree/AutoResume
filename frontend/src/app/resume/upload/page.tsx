'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useCallback, useEffect } from 'react'
import { apiGet, apiUpload, apiPost } from '@/lib/api'
import AppShell from '@/components/layout/AppShell'

interface AnalyzeResult {
  application: { _id: string }
}

interface ResumeListItem {
  _id: string
  originalFileName: string
  fileType: 'pdf' | 'docx'
  isPrimary: boolean
  updatedAt: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return '1 week ago'
  if (weeks < 4) return `${weeks} weeks ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

export default function AnalysisSetupPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [step, setStep] = useState<'setup' | 'analyzing'>('setup')
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [existingResumes, setExistingResumes] = useState<ResumeListItem[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    apiGet<{ resumes: ResumeListItem[] }>('/api/resumes')
      .then((data) => setExistingResumes(data.resumes))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen])

  const selectedResume = existingResumes.find((r) => r._id === selectedResumeId) || null

  async function handleFetchUrl() {
    if (!jobUrl) {
      setError('Please enter a URL first')
      return
    }
    setError('')
    setIsFetching(true)
    try {
      const data = await apiPost<{ jobTitle: string; company: string; jobDescription: string }>(
        '/api/jobs/parse-url',
        { url: jobUrl }
      )
      if (data.jobTitle) setPosition(data.jobTitle)
      if (data.company) setCompany(data.company)
      if (data.jobDescription) setJobDescription(data.jobDescription)
    } catch {
      setError('Failed to parse URL. Please try again or enter details manually.')
    } finally {
      setIsFetching(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setSelectedResumeId(null)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file && !selectedResumeId) {
      setError('Please select an existing resume or upload a new one')
      return
    }
    if (!position && !jobDescription && !jobUrl) {
      setError('Please provide job details (URL or manual entry)')
      return
    }
    setError('')
    setStep('analyzing')

    try {
      let resumeId: string
      if (selectedResumeId) {
        resumeId = selectedResumeId
      } else {
        const formData = new FormData()
        formData.append('file', file as File)
        const { resume } = await apiUpload<{ resume: { _id: string } }>('/api/resumes', formData)
        resumeId = resume._id
      }

      const body: Record<string, string> = {
        resumeId,
        company,
        position,
      }
      if (jobUrl) body.jobUrl = jobUrl
      if (jobDescription) body.jobDescription = jobDescription

      const data = await apiPost<AnalyzeResult>('/api/jobs/analyze', body)
      router.push(`/resume/${data.application._id}/edit`)
    } catch {
      setError('Analysis failed. Please try again.')
      setStep('setup')
    }
  }

  if (step === 'analyzing') {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-2 border-primary border-t-transparent" />
            <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary text-lg">
              auto_awesome
            </span>
          </div>
          <div className="text-center">
            <p className="font-headline font-bold text-lg text-on-surface">Analyzing your profile...</p>
            <p className="text-sm text-on-surface-variant mt-2">Our AI is dissecting your resume against the target role</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto mb-10 md:mb-16">
        <div className="flex flex-col gap-2">
          <span className="text-on-tertiary-container bg-tertiary-fixed px-3 py-1 rounded-full md:rounded-sm text-[10px] font-bold tracking-widest uppercase w-fit">
            <span className="hidden md:inline">New Session</span>
            <span className="md:hidden">Configuration</span>
          </span>
          <h2 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tighter text-on-surface mt-2">
            Analysis Setup
          </h2>
          <p className="text-on-surface-variant text-sm md:text-lg max-w-2xl font-light leading-relaxed">
            <span className="hidden md:inline">
              Align your professional narrative with architectural precision. Our AI dissects job requirements to ensure your resume resonates with maximum impact.
            </span>
            <span className="md:hidden">
              Prepare your professional profile for a deep-tissue AI evaluation.
            </span>
          </p>
        </div>
      </section>

      {error && (
        <div className="max-w-6xl mx-auto mb-6 bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="md:col-span-7 flex flex-col gap-10 md:gap-12">
          {/* Step 1: Resume Upload */}
          <div>
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[10px] md:text-xs">
                01
              </span>
              <h3 className="font-headline text-lg md:text-xl font-bold tracking-tight">Professional Source</h3>
            </div>

            {/* Existing resumes dropdown */}
            {existingResumes.length > 0 && (
              <div className="mb-6 space-y-4">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Select from existing resumes
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((v) => !v)}
                    className={`w-full flex items-center justify-between bg-surface-container-lowest border rounded-xl px-4 md:px-5 py-3.5 md:py-4 transition-all shadow-sm ${
                      isDropdownOpen || selectedResume
                        ? 'border-surface-tint'
                        : 'border-outline-variant/30 hover:border-surface-tint/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <span className="material-symbols-outlined text-surface-tint flex-shrink-0">
                        {selectedResume
                          ? selectedResume.fileType === 'pdf'
                            ? 'picture_as_pdf'
                            : 'article'
                          : 'description'}
                      </span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-sm font-medium truncate ${
                            selectedResume ? 'text-on-surface font-bold' : 'text-on-surface'
                          }`}
                        >
                          {selectedResume
                            ? selectedResume.originalFileName
                            : 'Choose a previously analyzed resume...'}
                        </span>
                        {selectedResume?.isPrimary && (
                          <span className="bg-primary text-on-primary text-[9px] font-black px-2 py-0.5 rounded tracking-tighter flex-shrink-0">
                            PRIMARY
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`material-symbols-outlined text-surface-tint transition-transform flex-shrink-0 ml-2 ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-surface-container-lowest rounded-xl shadow-2xl shadow-on-surface/10 border border-outline-variant/15 overflow-hidden z-50">
                      <div className="max-h-80 overflow-y-auto">
                        {existingResumes.map((resume) => {
                          const isSelected = resume._id === selectedResumeId
                          return (
                            <button
                              key={resume._id}
                              type="button"
                              onClick={() => {
                                setSelectedResumeId(resume._id)
                                setFile(null)
                                setIsDropdownOpen(false)
                              }}
                              className={`w-full px-5 md:px-6 py-4 flex items-center justify-between cursor-pointer border-l-4 transition-colors text-left ${
                                isSelected
                                  ? 'bg-surface-container-low border-primary'
                                  : 'border-transparent hover:bg-surface-container-low'
                              }`}
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <span
                                  className={`material-symbols-outlined flex-shrink-0 ${
                                    isSelected ? 'text-primary' : 'text-on-secondary-container'
                                  }`}
                                >
                                  {resume.fileType === 'pdf' ? 'picture_as_pdf' : 'article'}
                                </span>
                                <div className="min-w-0">
                                  <p
                                    className={`text-sm truncate ${
                                      isSelected
                                        ? 'text-on-surface font-bold'
                                        : 'text-on-surface-variant font-medium'
                                    }`}
                                  >
                                    {resume.originalFileName}
                                  </p>
                                  <p className="text-[10px] text-outline uppercase tracking-wider font-medium mt-0.5">
                                    Modified {timeAgo(resume.updatedAt)}
                                  </p>
                                </div>
                              </div>
                              {resume.isPrimary && (
                                <span className="bg-primary text-on-primary text-[9px] font-black px-2 py-0.5 rounded tracking-tighter flex-shrink-0 ml-2">
                                  PRIMARY
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                      <div className="bg-surface-container p-3 border-t border-outline-variant/10">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false)
                            fileRef.current?.click()
                          }}
                          className="w-full py-2 flex items-center justify-center gap-2 text-primary font-bold text-xs hover:bg-surface-container-high rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                          Upload New Version
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* OR UPLOAD NEW divider */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="h-px bg-outline-variant/20 flex-1" />
                  <span className="text-[10px] font-bold text-outline uppercase tracking-widest">
                    OR UPLOAD NEW
                  </span>
                  <div className="h-px bg-outline-variant/20 flex-1" />
                </div>
              </div>
            )}

            <div
              className={`relative w-full h-48 md:h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden ${
                isDragging
                  ? 'border-surface-tint bg-surface-container'
                  : file
                  ? 'border-on-tertiary-container/30 bg-tertiary-fixed/5'
                  : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container hover:border-surface-tint'
              }`}
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {/* Background text */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center select-none">
                <span className="font-headline text-[8rem] md:text-[12rem] font-black italic">RESUME</span>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center px-8">
                {file ? (
                  <>
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-tertiary-fixed/20 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-2xl md:text-3xl text-on-tertiary-container">
                        check_circle
                      </span>
                    </div>
                    <p className="font-semibold text-sm md:text-lg text-on-surface">{file.name}</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Click to change
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-surface-container-lowest flex items-center justify-center mb-4 shadow-sm">
                      <span className="material-symbols-outlined text-2xl md:text-3xl text-primary">upload_file</span>
                    </div>
                    <p className="font-semibold text-sm md:text-lg text-on-surface mb-1">
                      <span className="hidden md:inline">Drag and drop your resume</span>
                      <span className="md:hidden">Upload current resume</span>
                    </p>
                    <p className="text-xs md:text-sm text-on-surface-variant">PDF, DOCX, or RTF (Max 10MB)</p>
                    <div className="mt-4 md:mt-6 hidden md:block">
                      <span className="text-xs font-medium text-surface-tint underline decoration-2 underline-offset-4">
                        Browse local files
                      </span>
                    </div>
                  </>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.rtf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  setFile(f)
                  if (f) setSelectedResumeId(null)
                }}
              />
            </div>
          </div>

          {/* Step 2: Job Context */}
          <div>
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[10px] md:text-xs">
                02
              </span>
              <h3 className="font-headline text-lg md:text-xl font-bold tracking-tight">Target Context</h3>
            </div>

            <div className="md:bg-surface-container-low md:rounded-xl md:p-8 space-y-6 md:space-y-8">
              {/* URL Parser */}
              <div>
                <label className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  Auto-Parse from URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm hidden md:inline">
                      link
                    </span>
                    <input
                      type="text"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      className="w-full bg-surface-container-highest md:bg-surface-container-lowest border-none rounded-lg md:pl-10 pl-4 pr-4 py-3 md:py-3 focus:ring-2 focus:ring-surface-tint/20 text-sm transition-all"
                      placeholder="Auto-parse from URL"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchUrl}
                    disabled={isFetching}
                    className="obsidian-gradient md:bg-surface-container-highest md:bg-none md:text-on-surface text-on-primary px-6 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition-colors disabled:opacity-50"
                  >
                    {isFetching ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                        Parsing...
                      </span>
                    ) : 'Fetch'}
                  </button>
                </div>
                <p className="hidden md:block mt-2 text-[10px] text-on-surface-variant italic">
                  Supports LinkedIn, Indeed, Glassdoor, and major ATS portals.
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="h-px bg-outline-variant/20 flex-1" />
                <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest md:tracking-tighter">
                  or manual entry
                </span>
                <div className="h-px bg-outline-variant/20 flex-1" />
              </div>

              {/* Manual Fields */}
              <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full bg-surface-container-low md:bg-surface-container-lowest border-none rounded-lg px-4 py-3 md:py-3 focus:ring-2 focus:ring-surface-tint/20 text-sm"
                    placeholder="e.g. Senior Product Designer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-surface-container-low md:bg-surface-container-lowest border-none rounded-lg px-4 py-3 md:py-3 focus:ring-2 focus:ring-surface-tint/20 text-sm"
                    placeholder="e.g. Acme Innovations"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                    Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full bg-surface-container-low md:bg-surface-container-lowest border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-surface-tint/20 text-sm resize-none"
                    placeholder="Paste the full job description here for deep semantic analysis..."
                    rows={5}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview & CTA (Desktop) */}
        <div className="md:col-span-5">
          <div className="md:sticky md:top-24 space-y-8">
            {/* Preview Section - Desktop only */}
            <div className="hidden md:block bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-sm relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-tertiary-fixed/10 blur-3xl rounded-full" />

              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="font-headline text-lg font-bold tracking-tight">Analysis Preview</h3>
                <span className="text-[10px] text-on-tertiary-container font-bold px-2 py-0.5 bg-tertiary-fixed rounded">
                  LIVE
                </span>
              </div>

              <div className="space-y-6 relative z-10">
                {/* Uploaded file info */}
                {file && (
                  <div className="flex items-start gap-4 p-4 bg-surface-container-low rounded-lg">
                    <div className="w-10 h-12 bg-white flex items-center justify-center rounded shadow-inner border border-outline-variant/5">
                      <span className="material-symbols-outlined text-error">picture_as_pdf</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold truncate max-w-[180px]">{file.name}</p>
                      <p className="text-[10px] text-on-surface-variant mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                      className="ml-auto text-on-surface-variant hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                )}

                {/* Selected existing resume info */}
                {!file && selectedResume && (
                  <div className="flex items-start gap-4 p-4 bg-surface-container-low rounded-lg">
                    <div className="w-10 h-12 bg-white flex items-center justify-center rounded shadow-inner border border-outline-variant/5">
                      <span className="material-symbols-outlined text-primary">
                        {selectedResume.fileType === 'pdf' ? 'picture_as_pdf' : 'article'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold truncate max-w-[180px]">
                        {selectedResume.originalFileName}
                      </p>
                      <p className="text-[10px] text-on-surface-variant mt-1">
                        From library • Modified {timeAgo(selectedResume.updatedAt)}
                      </p>
                    </div>
                    {selectedResume.isPrimary && (
                      <span className="ml-auto bg-primary text-on-primary text-[9px] font-black px-2 py-0.5 rounded tracking-tighter self-start">
                        PRIMARY
                      </span>
                    )}
                  </div>
                )}

                {/* Parsed job info */}
                {(position || company) && (
                  <div className="space-y-4">
                    {position && (
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Target Role</p>
                        <p className="text-sm font-semibold">{position}</p>
                      </div>
                    )}
                    {company && (
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Organization</p>
                        <p className="text-sm font-semibold">{company}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state */}
                {!file && !selectedResume && !position && !company && (
                  <div className="py-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline-variant/50 mb-3">
                      preview
                    </span>
                    <p className="text-xs text-on-surface-variant">
                      Upload a resume and fill in job details to see a live preview
                    </p>
                  </div>
                )}
              </div>

              {/* Desktop CTA */}
              <div className="mt-12 pt-8 border-t border-outline-variant/10">
                <button
                  type="submit"
                  className="w-full obsidian-gradient text-white py-4 rounded-lg font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 group shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
                >
                  Begin Analysis
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
                <p className="text-center mt-4 text-[10px] text-on-surface-variant font-medium">
                  Estimated compute time: 14 seconds
                </p>
              </div>
            </div>

            {/* AI Insight - Desktop only */}
            <div className="hidden md:flex bg-tertiary-container text-on-tertiary-container p-6 rounded-xl gap-4 items-start border border-tertiary-fixed/10">
              <span className="material-symbols-outlined text-tertiary-fixed">auto_awesome</span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-1">AI Recommendation</h4>
                <p className="text-xs font-light leading-relaxed">
                  Upload your resume and provide job details. Our AI will analyze keyword alignment, skill gaps, and provide targeted recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="md:hidden col-span-1 mt-4 mb-8">
          <button
            type="submit"
            className="w-full obsidian-gradient py-5 rounded-xl text-on-primary font-headline font-extrabold tracking-tight text-lg shadow-xl shadow-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            Begin Analysis
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
          <p className="text-center text-[10px] text-on-surface-variant mt-6 leading-relaxed px-8">
            By starting the analysis, our <span className="text-on-tertiary-container font-bold">Insight Emerald AI</span> will match your profile against 250+ industry-standard heuristic markers.
          </p>
        </div>
      </form>

      {/* Desktop Footer */}
      <footer className="hidden md:flex max-w-6xl mx-auto mt-20 py-8 text-on-surface-variant/40 justify-between items-center text-[10px] font-bold uppercase tracking-[0.3em]">
        <span>© 2024 AutoResume</span>
        <div className="flex gap-8">
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
        </div>
      </footer>
    </AppShell>
  )
}
