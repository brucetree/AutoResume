const { GoogleGenerativeAI } = require('@google/generative-ai')

let genAI = null

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured')
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

/**
 * Analyze gap between resume and job description.
 * Returns: { gapAnalysis: string, modifiedResume: string }
 */
async function analyzeAndModify(resumeText, jobDescription) {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-flash-latest' })

  const prompt = `你是一位专业的简历优化顾问。请分析以下简历和职位描述，完成两项任务：

## 任务1：差距分析
列出简历与职位要求之间的主要差距，格式为清晰的要点列表。

## 任务2：优化后的简历
根据职位要求，优化简历内容。保留原有真实经历，重新组织语言以更好匹配职位要求。以 Markdown 格式输出完整的优化简历。

---

## 原始简历：
${resumeText}

---

## 职位描述：
${jobDescription}

---

请按如下 JSON 格式返回（不要包含 markdown 代码块标记）：
{
  "gapAnalysis": "差距分析内容（用\\n分隔要点）",
  "modifiedResume": "优化后的完整简历（Markdown格式）"
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  // Strip markdown code fences if present
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')

  try {
    return JSON.parse(clean)
  } catch {
    // Fallback: return raw text as modifiedResume
    return {
      gapAnalysis: '分析完成，请查看修改后的简历。',
      modifiedResume: text,
    }
  }
}

module.exports = { analyzeAndModify }
