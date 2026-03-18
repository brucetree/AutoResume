'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiGet, apiPatch } from '@/lib/api'

interface Application {
  _id: string
  company: string
  position: string
  status: string
  createdAt: string
  modifiedResumeId?: { _id: string }
}

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

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      apiGet<{ applications: Application[] }>('/api/applications')
        .then((data) => setApplications(data.applications))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [status])

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-indigo-700">autoResume</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{session?.user?.name}</span>
          <Link
            href="/resume/upload"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
          >
            新建分析
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">投递记录</h2>

        {applications.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">还没有投递记录</p>
            <Link href="/resume/upload" className="mt-4 inline-block text-indigo-600 hover:underline">
              上传简历开始分析 →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">公司</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">岗位</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{app.company}</td>
                    <td className="px-6 py-4 text-gray-600">{app.position}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                        {STATUS_LABELS[app.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(app.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4">
                      {app.modifiedResumeId && (
                        <Link
                          href={`/resume/${app.modifiedResumeId._id}/edit`}
                          className="text-indigo-600 hover:underline text-sm"
                        >
                          查看简历
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
