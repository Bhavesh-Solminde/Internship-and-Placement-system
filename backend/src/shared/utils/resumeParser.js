import fs from "fs";
import path from "path";
import { ENV } from "../../env.js";

/**
 * Extract raw text from a PDF file using pdf-parse.
 * @param {string} filePath - Absolute path to the PDF
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromPDF(filePath) {
  // Import the internal parser directly to bypass ESM module.parent issues in pdf-parse 1.1.1
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || "";
}

/**
 * Build the empty / default parsed-resume shape.
 */
function emptyResult() {
  return {
    name: "",
    email: "",
    phone: "",
    education: [],
    experience: [],
    projects: [],
    skills: [],
    experience_years: 0,
  };
}

/**
 * Parse a PDF resume file and extract structured data using Gemini AI.
 *
 * Strategy:
 *   1. Extract text from the PDF with pdf-parse (fast, local).
 *   2. Send the extracted text to Gemini for structured parsing.
 *   3. If Gemini is unavailable or errors, return an empty result
 *      so the request does not crash entirely.
 *
 * @param {string} filePath - Absolute path to the uploaded PDF file
 * @returns {Promise<object>} Parsed resume data
 */
export const parseResumeWithAI = async (filePath) => {
  // ── 1. Guard: no API key ──────────────────────────────────────────
  if (!ENV.GEMINI_API_KEY) {
    console.warn("[ResumeParser] GEMINI_API_KEY not set — returning empty parsed fields.");
    return emptyResult();
  }

  // ── 2. Extract text from the PDF ──────────────────────────────────
  let resumeText = "";
  try {
    resumeText = await extractTextFromPDF(filePath);
  } catch (pdfErr) {
    console.error("[ResumeParser] Failed to extract text from PDF:", pdfErr.message);
    throw new Error("Could not read the uploaded PDF. Please make sure it is a valid, non-encrypted PDF file.");
  }

  if (!resumeText || resumeText.trim().length < 20) {
    console.warn("[ResumeParser] PDF text is too short or empty — possibly a scanned/image PDF.");
    throw new Error(
      "The uploaded PDF does not contain extractable text. Please upload a text-based (non-scanned) resume."
    );
  }

  // ── 3. Build the Gemini prompt ────────────────────────────────────
  const prompt = `You are a professional resume parser. Analyze the following resume text and extract the information into a strict JSON format. Return ONLY a valid JSON object with no markdown, no code fences, no explanation — just the JSON.

Required JSON structure:
{
  "name": "Full name of the candidate",
  "email": "Email address if found, empty string if not",
  "phone": "Phone number if found, empty string if not",
  "education": [
    {
      "degree": "Degree name (e.g., B.Tech, M.S.)",
      "institution": "University/College name",
      "field": "Field of study/Major",
      "from_year": "Start year (e.g., 2018)",
      "to_year": "End year or 'Present'"
    }
  ],
  "experience": [
    {
      "title": "Job title/role",
      "company": "Company name",
      "start": "Start date (e.g., Jan 2021)",
      "end": "End date or 'Present'",
      "description": "Concise summary of responsibilities",
      "is_current": true/false
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "tech": "Comma separated technologies used",
      "description": "Concise summary of the project",
      "url": "Project URL if mentioned"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "experience_years": 0
}

Rules:
- "experience_years" must be a number (e.g., 2.5). Estimate from work experience dates. If fresher/student, use 0.
- "skills" must be an array of individual skill strings, not comma-separated in one string.
- Keep education, experience, and projects arrays. If not found, return empty arrays [].
- If a field within an object is not found, use an empty string "".

--- RESUME TEXT START ---
${resumeText.slice(0, 12000)}
--- RESUME TEXT END ---`;

  // ── 4. Call Gemini API with timeout ───────────────────────────────
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30-second timeout

  let response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      }
    );
  } catch (fetchErr) {
    clearTimeout(timeout);
    if (fetchErr.name === "AbortError") {
      console.error("[ResumeParser] Gemini API request timed out after 30s");
      throw new Error("AI service timed out. Please try again later.");
    }
    console.error("[ResumeParser] Network error calling Gemini API:", fetchErr.message);
    throw new Error("Could not reach the AI service. Please check your internet connection and try again.");
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[ResumeParser] Gemini API returned ${response.status}:`, errText);
    throw new Error(`AI service returned an error (HTTP ${response.status}). Please try again later.`);
  }

  const result = await response.json();

  // ── 5. Extract and parse the structured JSON ──────────────────────
  const rawContent = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawContent) {
    console.error("[ResumeParser] Empty response from Gemini. Full result:", JSON.stringify(result).slice(0, 500));
    throw new Error("AI service returned an empty response. Please try again.");
  }

  // Strip potential markdown code fences and any preamble text
  let cleanedContent = rawContent
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // If the cleaned content doesn't start with '{', try to extract JSON object
  if (!cleanedContent.startsWith("{")) {
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }
  }

  try {
    const parsed = JSON.parse(cleanedContent);

    // Normalize the output
    return {
      name: parsed.name || "",
      email: parsed.email || "",
      phone: parsed.phone || "",
      education: Array.isArray(parsed.education) ? parsed.education : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience_years: Number(parsed.experience_years) || 0,
    };
  } catch (parseErr) {
    console.error("[ResumeParser] Failed to parse JSON from Gemini response:", cleanedContent.slice(0, 500));
    throw new Error("AI returned an invalid response. Please try again.");
  }
};
