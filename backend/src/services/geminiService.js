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
 * Returns: { gapAnalysis: string (JSON), modifiedResume: string (HTML) }
 */
async function analyzeAndModify(resumeText, jobDescription) {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-flash-latest' })

  const prompt = `You are a professional resume optimization consultant. Analyze the following resume and job description, then complete these tasks:

## Task 1: Structured Analysis
Provide a structured analysis in JSON format with:
- matchScore: A number from 0-100 representing how well the resume matches the job
- suggestions: An array of suggestion categories, each with:
  - category: "role_alignment" or "skill_gaps" or "experience" or "formatting"
  - title: A short title for this category (e.g. "Role Alignment", "Skill Gaps")
  - items: Array of specific actionable suggestion strings
- skillBreakdown: An array of skill assessments, each with:
  - skill: The skill name (e.g. "Technical Skills", "Leadership", "Communication")
  - level: A number from 0-100 representing proficiency level based on the resume
- proTip: A single concise pro tip for the candidate (1-2 sentences)

## Task 2: Optimized Resume
Based on job requirements, optimize the resume content. Keep the original real experience, reorganize language to better match job requirements. Output as HTML fragment.
Use semantic HTML tags: <h1> for name, <h2> for section titles, <h3> for subtitles, <p> for body paragraphs, <ul>/<li> for lists, <strong> for bold, <em> for italic. Do not include <html>, <head>, <body> outer tags, only output the resume body HTML fragment.

---

## Original Resume:
${resumeText}

---

## Job Description:
${jobDescription}

---

Return in the following JSON format (do NOT include markdown code block markers):
{
  "gapAnalysis": {
    "matchScore": 75,
    "suggestions": [
      {
        "category": "role_alignment",
        "title": "Role Alignment",
        "items": ["suggestion 1", "suggestion 2"]
      },
      {
        "category": "skill_gaps",
        "title": "Skill Gaps",
        "items": ["suggestion 1", "suggestion 2"]
      }
    ],
    "skillBreakdown": [
      { "skill": "Technical Skills", "level": 80 },
      { "skill": "Leadership", "level": 65 }
    ],
    "proTip": "A concise pro tip here"
  },
  "modifiedResume": "optimized resume HTML fragment"
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  // Strip markdown code fences if present
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')

  try {
    const parsed = JSON.parse(clean)
    // Stringify gapAnalysis if it's an object (for storage as string in DB)
    return {
      gapAnalysis: typeof parsed.gapAnalysis === 'object'
        ? JSON.stringify(parsed.gapAnalysis)
        : parsed.gapAnalysis,
      modifiedResume: parsed.modifiedResume,
    }
  } catch {
    // Fallback: return raw text as modifiedResume
    return {
      gapAnalysis: JSON.stringify({
        matchScore: 70,
        suggestions: [{ category: 'general', title: 'General', items: ['Analysis completed. Please review the modified resume.'] }],
        skillBreakdown: [],
        proTip: 'Review the optimized resume and make any personal adjustments.',
      }),
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
