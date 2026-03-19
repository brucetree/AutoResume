'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { apiUpload, apiPost } from '@/lib/api'

interface AnalyzeResult {
  application: { _id: string }
}

export default function UploadPage() {
  const { status } = useSession()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [jobInput, setJobInput] = useState('')
  const [jobInputType, setJobInputType] = useState<'text' | 'url'>('text')
  const [step, setStep] = useState<'upload' | 'analyzing'>('upload')
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !company || !position || !jobInput) {
      setError('请填写所有必填项')
      return
    }
    setError('')
    setStep('analyzing')

    try {
      // Step 1: Upload and parse resume
      const formData = new FormData()
      formData.append('file', file)
      const { resume } = await apiUpload<{ resume: { _id: string } }>('/api/resumes', formData)

      // Step 2: Analyze against job
      const body: Record<string, string> = {
        resumeId: resume._id,
        company,
        position,
      }
      if (jobInputType === 'url') {
        body.jobUrl = jobInput
      } else {
        body.jobDescription = jobInput
      }

      const data = await apiPost<AnalyzeResult>('/api/jobs/analyze', body)
      router.push(`/resume/${data.application._id}/edit`)
    } catch (err) {
      setError('分析失败，请重试')
      setStep('upload')
    }
  }

  if (step === 'analyzing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
        <p className="text-gray-600">AI 正在分析简历，请稍候...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">上传简历 & 分析岗位</h2>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">{error}</div>
          )}

          {/* Resume upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              简历文件 <span className="text-gray-400">(PDF / Word)</span>
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition"
              onClick={() => fileRef.current?.click()}
            >
              {file ? (
                <p className="text-indigo-600 font-medium">{file.name}</p>
              ) : (
                <p className="text-gray-500">点击选择文件，或拖拽到此处</p>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {/* Company & Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">岗位名称</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Job description */}
          <div>
            <div className="flex gap-4 mb-2">
              <label className="text-sm font-medium text-gray-700">岗位信息</label>
              <div className="flex gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setJobInputType('text')}
                  className={`underline ${jobInputType === 'text' ? 'text-indigo-600' : 'text-gray-400'}`}
                >
                  粘贴描述
                </button>
                <button
                  type="button"
                  onClick={() => setJobInputType('url')}
                  className={`underline ${jobInputType === 'url' ? 'text-indigo-600' : 'text-gray-400'}`}
                >
                  输入 URL
                </button>
              </div>
            </div>
            {jobInputType === 'text' ? (
              <textarea
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                rows={6}
                placeholder="粘贴岗位 JD 内容..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            ) : (
              <input
                type="url"
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                placeholder="https://example.com/job/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            开始 AI 分析
          </button>
        </form>
      </div>
    </div>
  )
}
