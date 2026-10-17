import { Submission } from '@/types'

/**
 * Tokenizes text into word shingles (n-grams) for Jaccard similarity comparison.
 */
function getShingles(text: string, shingleSize: number = 3): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)

  const shingles = new Set<string>()
  if (words.length < shingleSize) {
    words.forEach((w) => shingles.add(w))
    return shingles
  }

  for (let i = 0; i <= words.length - shingleSize; i++) {
    shingles.add(words.slice(i, i + shingleSize).join(' '))
  }

  return shingles
}

/**
 * Calculates Jaccard similarity coefficient between two texts: |A ∩ B| / |A ∪ B|
 */
export function calculateJaccardSimilarity(textA: string, textB: string): number {
  if (!textA || !textB) return 0
  const setA = getShingles(textA)
  const setB = getShingles(textB)

  if (setA.size === 0 || setB.size === 0) return 0

  let intersection = 0
  setA.forEach((item) => {
    if (setB.has(item)) intersection++
  })

  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

/**
 * Compares a submission against all other submissions for the same assignment.
 * If similarity exceeds 0.80, returns a flag note and the matching submission ID.
 */
export function checkSubmissionSimilarity(
  currentSubmissionId: string,
  currentText: string,
  assignmentSubmissions: Submission[]
): { isSimilar: boolean; similarity: number; matchedSubmission?: Submission; reason?: string } {
  if (!currentText || currentText.length < 50) {
    return { isSimilar: false, similarity: 0 }
  }

  for (const other of assignmentSubmissions) {
    if (other.id === currentSubmissionId || !other.text || other.text.length < 50) {
      continue
    }

    const similarity = calculateJaccardSimilarity(currentText, other.text)
    if (similarity >= 0.8) {
      const pct = Math.round(similarity * 100)
      return {
        isSimilar: true,
        similarity,
        matchedSubmission: other,
        reason: `Possible similarity — review (${pct}% structural match with ${other.studentName || other.studentId})`,
      }
    }
  }

  return { isSimilar: false, similarity: 0 }
}
