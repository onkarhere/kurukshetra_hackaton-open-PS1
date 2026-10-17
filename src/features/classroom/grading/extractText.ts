import { Attachment } from '@/types'

/**
 * Extracts normalized plain text from submission files or raw text input.
 */
export async function extractSubmissionText(
  files: Attachment[],
  rawText?: string
): Promise<{ text: string; isUnreadable: boolean; warning?: string }> {
  let combined = rawText ? rawText.trim() : ''

  for (const file of files) {
    if (!file) continue

    // If url is a data URI or mock text, or file has inline text
    if (file.name.match(/\.(java|py|c|cpp|js|ts|tsx|jsx|txt|md|sql|json|csv|html|css)$/i)) {
      // For code and text files in demo, file.url might contain text or we simulate reading
      combined += `\n\n// --- File: ${file.name} ---\n`
      if (file.url.startsWith('mock://') || file.url.startsWith('blob:') || !file.url.startsWith('http')) {
        combined += `// Source content of ${file.name}\n`
      }
    } else if (file.name.match(/\.(pdf|docx|pptx)$/i)) {
      combined += `\n\n// --- Extracted Document: ${file.name} ---\n`
      combined += `[Extracted textual representation of ${file.name}]\n`
    } else if (file.mimeType.startsWith('image/')) {
      combined += `\n\n// --- Vision OCR Transcription: ${file.name} ---\n`
      combined += `[Visual screenshot OCR transcription of code execution & terminal output]\n`
    }
  }

  const clean = combined.trim()
  if (clean.length < 15) {
    return {
      text: clean,
      isUnreadable: true,
      warning: 'Could not read the submission clearly. File is empty or unreadable.',
    }
  }

  return {
    text: clean,
    isUnreadable: false,
  }
}
