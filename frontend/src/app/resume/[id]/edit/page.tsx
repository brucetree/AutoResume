'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { apiGet, apiPut } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Resume {
  _id: string
  modifiedContent: string
  originalFileName: string
}

export default function EditResumePage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [resume, setResume] = useState<Resume | null>(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && id) {
      apiGet<{ resume: Resume }>(`/api/resumes/${id}`)
        .then((data) => {
          setResume(data.resume)
          setContent(data.resume.modifiedContent || '')
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [status, id])

  async function handleSave() {
    setSaving(true)
    try {
      await apiPut(`/api/resumes/${id}`, { modifiedContent: content })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    // Find application with this modified resume ID
    try {
      const { applications } = await apiGet<{ applications: { _id: string; modifiedResumeId?: { _id: string } }[] }>('/api/applications')
      const app = applications.find((a) => a.modifiedResumeId?._id === id)
      if (!app) {
        alert('找不到对应的投递记录，请先保存')
        return
      }
      // Save latest content first
      await apiPut(`/api/resumes/${id}`, { modifiedContent: content })
      // Trigger download
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">编辑修改后的简历</h2>
          <p className="text-xs text-gray-500">{resume?.originalFileName}</p>
        </div>
        <div className="flex gap-3">
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

      {/* Editor */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full min-h-[70vh] px-6 py-5 bg-white border border-gray-200 rounded-xl shadow-sm font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          placeholder="修改后的简历内容（Markdown 格式）..."
          spellCheck={false}
        />
        <p className="text-xs text-gray-400 mt-2">内容为 Markdown 格式，导出时自动渲染为 PDF</p>
      </div>
    </div>
  )
}
