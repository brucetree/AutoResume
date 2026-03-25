'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef, useCallback } from 'react'
import { apiGet, apiPatch, apiDelete, apiGetBlob, apiUpload } from '@/lib/api'

interface Resume {
  _id: string
  originalFileName: string
  fileType: string
  fileSize?: number
  isPrimary: boolean
  version: number
  createdAt: string
  updatedAt: string
}

function formatFileSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ResumesPage() {
  const { status } = useSession()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [mobileMenuId, setMobileMenuId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  const fetchResumes = useCallback(async () => {
    try {
      const data = await apiGet<{ resumes: Resume[] }>('/api/resumes')
      setResumes(data.resumes || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') fetchResumes()
  }, [status, fetchResumes])

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      await apiUpload('/api/resumes', formData)
      await fetchResumes()
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  const handleSetPrimary = async (id: string) => {
    try {
      await apiPatch(`/api/resumes/${id}/primary`)
      await fetchResumes()
    } catch (err) {
      console.error('Set primary failed:', err)
    }
  }

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null)
      return
    }
    try {
      await apiPatch(`/api/resumes/${id}/rename`, { fileName: renameValue.trim() })
      await fetchResumes()
    } catch (err) {
      console.error('Rename failed:', err)
    }
    setRenamingId(null)
  }

  const handleDownload = async (id: string, fileName: string) => {
    try {
      const blob = await apiGetBlob(`/api/resumes/${id}/download`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/resumes/${id}`)
      await fetchResumes()
    } catch (err) {
      console.error('Delete failed:', err)
    }
    setDeleteConfirmId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 md:p-6">
      {/* Page Header */}
      <section>
        <div className="md:hidden space-y-2">
          <h2 className="text-3xl font-headline font-bold tracking-tight text-primary">Your Library</h2>
          <p className="text-on-surface-variant font-body">Manage and refine your professional narratives.</p>
        </div>
        <div className="hidden md:block">
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-primary mb-2">Resume Management</h2>
          <p className="text-on-surface-variant font-body">Manage, version, and refine your professional portfolio with precision.</p>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        {/* Upload Card */}
        <div className="md:col-span-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`bg-surface-container-low p-8 rounded-xl h-full flex flex-col justify-center items-center border-2 border-dashed transition-all group cursor-pointer min-h-[200px] ${
              isDragging
                ? 'border-on-tertiary-container bg-tertiary-fixed/10'
                : 'border-outline-variant/50 hover:border-on-tertiary-container'
            }`}
          >
            <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-3xl text-primary">upload_file</span>
            </div>
            <h3 className="font-headline text-lg font-bold mb-1">
              <span className="hidden md:inline">Upload New Resume</span>
              <span className="md:hidden">Import Resume</span>
            </h3>
            <p className="text-on-surface-variant text-sm text-center px-4">
              <span className="hidden md:inline">Drag and drop your PDF or DOCX file here to start analysis</span>
              <span className="md:hidden">PDF, DOCX up to 10MB</span>
            </p>
            <div className="mt-6 flex gap-2">
              <span className="bg-surface-container-lowest px-3 py-1 text-[10px] font-bold rounded-[9999px] border border-outline-variant/20 uppercase tracking-widest text-on-surface-variant">PDF</span>
              <span className="bg-surface-container-lowest px-3 py-1 text-[10px] font-bold rounded-[9999px] border border-outline-variant/20 uppercase tracking-widest text-on-surface-variant">DOCX</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Resume List */}
        <div className="md:col-span-8 space-y-4">
          {/* Mobile section header */}
          {resumes.length > 0 && (
            <div className="md:hidden flex items-center justify-between mb-2">
              <h3 className="font-headline font-bold text-lg">Existing Resumes</h3>
              <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant font-semibold">
                {resumes.length} {resumes.length === 1 ? 'File' : 'Files'}
              </span>
            </div>
          )}

          {resumes.length === 0 ? (
            <div className="bg-surface-container-low p-12 rounded-xl text-center space-y-4">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">folder_open</span>
              <p className="text-on-surface-variant">No resumes uploaded yet</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Upload your first resume
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          ) : (
            resumes.map((resume) => (
              <div
                key={resume._id}
                className="bg-surface-container-lowest p-4 md:p-6 rounded-xl flex items-center justify-between group hover:shadow-xl hover:shadow-black/[0.02] transition-all"
              >
                <div className="flex items-center gap-4 md:gap-5 min-w-0 flex-1">
                  {/* File icon */}
                  <div className={`w-10 h-10 md:w-12 md:h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    resume.isPrimary ? 'bg-primary-container/5 border border-primary-container/10' : 'bg-surface-container'
                  }`}>
                    <span className={`material-symbols-outlined ${resume.isPrimary ? 'text-primary-container' : 'text-outline'}`}>
                      description
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 md:gap-3 mb-0.5 md:mb-1">
                      {renamingId === resume._id ? (
                        <input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => handleRename(resume._id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(resume._id)
                            if (e.key === 'Escape') setRenamingId(null)
                          }}
                          className="font-headline font-bold text-sm md:text-lg bg-surface-container-low border border-primary/20 rounded-lg px-2 py-1 outline-none focus:border-primary w-full max-w-[240px]"
                        />
                      ) : (
                        <h4 className="font-headline font-bold text-sm md:text-lg truncate max-w-[140px] md:max-w-none">
                          {resume.originalFileName || 'Resume.pdf'}
                        </h4>
                      )}
                      {resume.isPrimary && (
                        <span className="bg-[#22C55E]/10 text-[#22C55E] text-[8px] md:text-[10px] font-extrabold uppercase tracking-widest px-1.5 md:px-2 py-0.5 rounded-[9999px] border border-[#22C55E]/20 flex-shrink-0">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] md:text-xs text-on-surface-variant font-medium">
                      <span className="hidden md:inline">Uploaded on {formatDate(resume.createdAt)}</span>
                      <span className="md:hidden">Edited {formatDate(resume.updatedAt)}</span>
                      {resume.fileSize ? ` \u2022 ${formatFileSize(resume.fileSize)}` : ''}
                    </p>
                  </div>
                </div>

                {/* Desktop actions */}
                <div className="hidden md:flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleSetPrimary(resume._id)}
                    className={`p-2 transition-all rounded-lg ${
                      resume.isPrimary
                        ? 'text-[#EAB308]'
                        : 'text-on-surface-variant hover:text-[#EAB308] hover:bg-surface-container'
                    }`}
                    title={resume.isPrimary ? 'Current Primary' : 'Set as Primary'}
                  >
                    <span className={`material-symbols-outlined text-[20px] ${resume.isPrimary ? 'filled' : ''}`}
                      style={resume.isPrimary ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      star
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setRenamingId(resume._id)
                      setRenameValue(resume.originalFileName || '')
                    }}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all rounded-lg"
                    title="Rename"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                  </button>
                  <button
                    onClick={() => handleDownload(resume._id, resume.originalFileName || `resume.${resume.fileType}`)}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all rounded-lg"
                    title="Download"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                  <div className="w-[1px] h-6 bg-outline-variant/30 mx-1" />
                  <button
                    onClick={() => setDeleteConfirmId(resume._id)}
                    className="p-2 text-error/60 hover:text-error hover:bg-error-container/20 transition-all rounded-lg"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>

                {/* Mobile actions */}
                <div className="md:hidden flex items-center gap-1">
                  <button
                    onClick={() => {
                      setRenamingId(resume._id)
                      setRenameValue(resume.originalFileName || '')
                    }}
                    className="p-2 rounded-lg text-on-surface-variant hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => setMobileMenuId(mobileMenuId === resume._id ? null : resume._id)}
                    className="p-2 rounded-lg text-on-surface-variant hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>

                {/* Mobile dropdown menu */}
                {mobileMenuId === resume._id && (
                  <div
                    className="md:hidden absolute right-6 mt-48 bg-white rounded-xl shadow-lg border border-outline-variant/20 py-2 z-30 min-w-[160px]"
                    onClick={() => setMobileMenuId(null)}
                  >
                    {!resume.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(resume._id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-container-low transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">star</span>
                        Set as Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(resume._id, resume.originalFileName || `resume.${resume.fileType}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      Download
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(resume._id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error-container/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Tip Card (Mobile) */}
      {resumes.length > 0 && (
        <div className="md:hidden glass-panel rounded-2xl p-6 border border-white/20 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-[9999px] bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold uppercase tracking-wider">
                Power Tip
              </div>
              <h4 className="font-headline font-bold text-primary">Analyze Score</h4>
              <p className="text-sm text-on-surface-variant">
                Upload a job description to get AI-powered match scoring and optimization suggestions.
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 ml-4">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm px-6">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-error">warning</span>
              </div>
              <h3 className="font-headline font-bold text-lg">Delete Resume?</h3>
            </div>
            <p className="text-sm text-on-surface-variant">
              This action cannot be undone. The file will be permanently removed from your library.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium text-white bg-error rounded-lg hover:bg-error/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-24 right-6 z-40">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-14 h-14 obsidian-gradient text-on-primary rounded-[9999px] editorial-shadow flex items-center justify-center active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-2xl">upload_file</span>
        </button>
      </div>
    </div>
  )
}
