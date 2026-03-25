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
根据职位要求，优化简历内容。保留原有真实经历，重新组织语言以更好匹配职位要求。以 HTML 格式输出完整的优化简历。
使用语义化 HTML 标签：<h1> 用于姓名，<h2> 用于板块标题，<h3> 用于子标题，<p> 用于正文段落，<ul>/<li> 用于列表，<strong> 用于加粗，<em> 用于斜体。不要包含 <html>、<head>、<body> 等外层标签，只输出简历正文的 HTML 片段。

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
  "modifiedResume": "优化后的完整简历（HTML片段格式）"
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

/**
 * Parse job posting text and extract structured fields.
 * Returns: { jobTitle: string, company: string, jobDescription: string }
 */
async function parseJobPosting(rawText) {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-flash-latest' })

  const prompt = `You are a job posting parser. Extract the following fields from the raw job posting text below.

Return a JSON object with exactly these fields:
- "jobTitle": The job title/position name (string)
- "company": The company/organization name (string)
- "jobDescription": The full job description including responsibilities, requirements, qualifications, etc. Clean it up but keep all relevant details. (string)

If a field cannot be determined, use an empty string "".

Do NOT include markdown code block markers. Return only valid JSON.

---

Raw job posting text:
${rawText.slice(0, 6000)}
`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')

  try {
    return JSON.parse(clean)
  } catch {
    return { jobTitle: '', company: '', jobDescription: rawText.slice(0, 3000) }
  }
}

module.exports = { analyzeAndModify, parseJobPosting }
