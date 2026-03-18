import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold text-indigo-700">autoResume</h1>
        <p className="text-xl text-gray-600">
          上传简历 + 输入岗位 → AI 分析差距 → 在线编辑 → 导出 PDF
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            立即开始
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition"
          >
            注册账号
          </Link>
        </div>
      </div>
    </main>
  )
}
