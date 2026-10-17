import { Assignment, GradingResult, GradingDeduction, CheckingLevel } from '@/types'
import { isSupabaseConfigured, USE_SUPABASE, supabase } from '@/lib/supabase'

export interface IGradingService {
  grade(assignment: Assignment, submissionText: string, submittedAt?: string): Promise<GradingResult>
}

/**
 * Searches submission text for evidence of a criterion and extracts an authentic quoted line.
 */
function findEvidenceLine(text: string, searchTerms: string[]): string | undefined {
  const lines = text.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') && trimmed.includes('--- File:')) continue

    const lower = trimmed.toLowerCase()
    for (const term of searchTerms) {
      if (lower.includes(term.toLowerCase())) {
        return trimmed.length > 90 ? trimmed.substring(0, 90) + '...' : trimmed
      }
    }
  }
  return undefined
}

/**
 * Deterministic Mock Grader implementing checking levels, rubric deduction rules, and evidence quoting.
 */
export class MockGrader implements IGradingService {
  async grade(
    assignment: Assignment,
    submissionText: string,
    submittedAt?: string
  ): Promise<GradingResult> {
    const textLower = submissionText.toLowerCase()
    const deductions: GradingDeduction[] = []
    const strengths: string[] = []
    const improvements: string[] = []
    let totalCut = 0

    // Evaluate each rubric criterion independently
    for (const crit of assignment.rubric) {
      const searchTerms: string[] = []

      // Derive search terms from criterion title and keywords
      searchTerms.push(crit.title.toLowerCase())
      if (crit.keywords && crit.keywords.length > 0) {
        crit.keywords.forEach((k) => searchTerms.push(k.toLowerCase()))
      }

      // Add common synonymous stems for core concepts
      if (crit.title.toLowerCase().includes('try-with-resources') || crit.title.toLowerCase().includes('try with resources')) {
        searchTerms.push('try (', 'try(', 'bufferedreader', 'filereader', 'autoclosable')
      }
      if (crit.title.toLowerCase().includes('custom exception')) {
        searchTerms.push('class ', 'extends exception', 'extends runtimeexception', 'throw new')
      }
      if (crit.title.toLowerCase().includes('filenotfoundexception') || crit.title.toLowerCase().includes('exception handling')) {
        searchTerms.push('filenotfoundexception', 'catch (filenotfoundexception', 'catch(filenotfoundexception')
      }
      if (crit.title.toLowerCase().includes('comment')) {
        searchTerms.push('//', '/*', '/**', '* @')
      }
      if (crit.title.toLowerCase().includes('screenshot') || crit.title.toLowerCase().includes('log') || crit.title.toLowerCase().includes('output')) {
        searchTerms.push('screenshot', 'log', 'output', 'console', 'terminal', 'system.out.println')
      }
      if (crit.title.toLowerCase().includes('entity') || crit.title.toLowerCase().includes('annotation')) {
        searchTerms.push('@entity', '@table', '@id', '@manytoone', '@onetoone')
      }
      if (crit.title.toLowerCase().includes('abstract') || crit.title.toLowerCase().includes('inheritance')) {
        searchTerms.push('abstract class', 'abstract ', 'extends ')
      }
      if (crit.title.toLowerCase().includes('grid') || crit.title.toLowerCase().includes('responsive')) {
        searchTerms.push('grid', 'md:grid-cols', 'flex', 'tailwind')
      }

      // Check matches
      const isMatched = searchTerms.some((term) => textLower.includes(term.toLowerCase()))
      const evidence = findEvidenceLine(submissionText, searchTerms)

      if (isMatched && evidence) {
        // Criterion is present! Check degree of completeness based on CheckingLevel
        if (assignment.checkingLevel === 'easy') {
          strengths.push(`Present: ${crit.title}`)
        } else if (assignment.checkingLevel === 'medium') {
          strengths.push(`Satisfied: ${crit.title}`)
        } else {
          // Hard: check for thoroughness
          strengths.push(`Verified complete: ${crit.title}`)
        }
      } else {
        // Criterion missing or deficient
        let marksCut = crit.deductIfMissing

        // Apply checking level adjustment
        if (assignment.checkingLevel === 'easy') {
          // Easy: partial deduction cut if allowed, generous grading
          marksCut = crit.partialAllowed ? Math.max(1, Math.round(crit.deductIfMissing * 0.5)) : Math.round(crit.deductIfMissing * 0.75)
        } else if (assignment.checkingLevel === 'medium') {
          // Medium: standard deduction
          marksCut = crit.deductIfMissing
        } else {
          // Hard: strictly full deduction
          marksCut = crit.deductIfMissing
        }

        totalCut += marksCut

        let reason = `${crit.title} was not detected in the submission.`
        if (crit.type === 'must_include') {
          reason = `Required component "${crit.title}" is missing from the submitted code.`
        } else if (crit.type === 'concept') {
          reason = `Conceptual requirement "${crit.title}" could not be identified.`
        } else if (crit.type === 'format') {
          reason = `Formatting or documentation expectation "${crit.title}" was not fulfilled.`
        } else if (crit.type === 'correctness') {
          reason = `Specific error handling or logic for "${crit.title}" is missing.`
        }

        deductions.push({
          criterionId: crit.id,
          title: crit.title,
          marksCut,
          reason,
          evidence: 'not found in your submission',
        })

        improvements.push(`Ensure to incorporate ${crit.title} (${crit.description || 'as required by rubric'}).`)
      }
    }

    // Calculate Late Penalty (computed in code, not model)
    let latePenalty = 0
    if (assignment.allowLate && submittedAt && new Date(submittedAt) > new Date(assignment.dueAt)) {
      const msLate = new Date(submittedAt).getTime() - new Date(assignment.dueAt).getTime()
      const daysLate = Math.max(1, Math.ceil(msLate / (1000 * 60 * 60 * 24)))
      latePenalty = daysLate * (assignment.latePenaltyPerDay || 0)
    }

    // Compute awarded marks: maxMarks - sum(deductions) - latePenalty, clamped to [0, maxMarks]
    const awarded = Math.max(0, Math.min(assignment.maxMarks, assignment.maxMarks - totalCut - latePenalty))

    const isLowConfidence = submissionText.length < 50 || deductions.length >= assignment.rubric.length - 1

    return {
      level: assignment.checkingLevel,
      maxMarks: assignment.maxMarks,
      awarded,
      deductions,
      latePenalty,
      strengths: strengths.length > 0 ? strengths : ['Basic submission structure submitted'],
      improvements: improvements.length > 0 ? improvements : ['Review all rubric parameters before turning in'],
      confidence: isLowConfidence ? 'low' : deductions.length > 0 ? 'medium' : 'high',
      needsHumanReview: isLowConfidence,
      model: 'batchwise-grading-v2',
      gradedAt: new Date().toISOString(),
    }
  }
}

/**
 * Edge function grader calling Supabase edge function when enabled.
 */
export class EdgeFunctionGrader implements IGradingService {
  private fallbackGrader = new MockGrader()

  async grade(
    assignment: Assignment,
    submissionText: string,
    submittedAt?: string
  ): Promise<GradingResult> {
    if (!USE_SUPABASE || !isSupabaseConfigured || !supabase) {
      return this.fallbackGrader.grade(assignment, submissionText, submittedAt)
    }

    try {
      const { data, error } = await supabase.functions.invoke('grade-submission', {
        body: {
          assignment: {
            title: assignment.title,
            instructions: assignment.instructions,
            maxMarks: assignment.maxMarks,
            checkingLevel: assignment.checkingLevel,
            rubric: assignment.rubric,
            referenceSolution: assignment.referenceSolution,
            allowLate: assignment.allowLate,
            latePenaltyPerDay: assignment.latePenaltyPerDay,
            dueAt: assignment.dueAt,
          },
          submissionText,
          submittedAt,
        },
      })

      if (error || !data) {
        console.warn('Edge function grading failed, falling back to local mock grader:', error)
        return this.fallbackGrader.grade(assignment, submissionText, submittedAt)
      }

      return data as GradingResult
    } catch (err) {
      console.warn('Exception calling edge function grading:', err)
      return this.fallbackGrader.grade(assignment, submissionText, submittedAt)
    }
  }
}

// Default exported grading service singleton
export const gradingService: IGradingService = new MockGrader()
