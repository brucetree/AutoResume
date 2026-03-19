'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { apiGet, apiPut } from '@/lib/api'
import UserMenu from '@/components/UserMenu'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

const STATUS_LABELS: Record<string, string> = {
  analyzing: '分析中',
  editing: '编辑中',
  applied: '已投递',
  interview: '面试中',
  rejected: '已拒绝',
  offer: 'Offer',
}

const STATUS_COLORS: Record<string, string> = {
  analyzing: 'bg-yellow-100 text-yellow-800',
  editing: 'bg-blue-100 text-blue-800',
  applied: 'bg-indigo-100 text-indigo-800',
  interview: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
  offer: 'bg-green-100 text-green-800',
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

export default function EditResumePage() {
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
  const [showGap, setShowGap] = useState(true)

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
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    if (!app) return
    setExporting(true)
    try {
      await apiPut(`/api/resumes/${app.modifiedResumeId._id}`, { modifiedContent: content })
      window.open(`${API_URL}/api/applications/${app._id}/export-pdf`, '_blank')
    } catch {
      alert('导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>
  }

  if (!app) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">记录不存在</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-indigo-700 cursor-pointer" onClick={() => router.push('/dashboard')}>
            autoResume
          </h1>
          <span className="text-gray-300">|</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{app.company}</span>
              <span className="text-gray-400">-</span>
              <span className="text-gray-600">{app.position}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                {STATUS_LABELS[app.status]}
              </span>
            </div>
            <p className="text-xs text-gray-400">{app.resumeId?.originalFileName} · {new Date(app.createdAt).toLocaleDateString('zh-CN')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <UserMenu />
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            返回
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {saved ? '已保存' : saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {exporting ? '生成中...' : '导出 PDF'}
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-4">
        {/* Gap Analysis */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <button
            onClick={() => setShowGap(!showGap)}
            className="w-full px-6 py-3 flex items-center justify-between text-left"
          >
            <h3 className="font-semibold text-gray-700">简历差距分析</h3>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showGap ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showGap && (
            <div className="px-6 pb-5 space-y-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-4">
                {app.gapAnalysis}
              </pre>
              {app.jobDescription && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-indigo-600 hover:underline font-medium">查看岗位描述 (JD)</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {app.jobDescription}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Rich Text Editor */}
        <div>
          <RichTextEditor content={content} onChange={setContent} />
          <p className="text-xs text-gray-400 mt-2">使用工具栏格式化简历内容，导出时自动渲染为 PDF</p>
        </div>
      </div>
    </div>
  )
}
