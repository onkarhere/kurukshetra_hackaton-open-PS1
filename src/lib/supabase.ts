import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://slqdpipsrbtrfjjxnvpd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zmOYfWAqfVX8YCYwAyZTNA_YphBB_NW'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

/**
 * Supabase Data Access Services
 */
export async function getStudentsFromDb() {
  const { data, error } = await supabase.from('students').select('*').order('name')
  if (error) {
    console.warn('Supabase fetch error, fallback to mock layer:', error)
    return null
  }
  return data
}

export async function getCoursesFromDb() {
  const { data, error } = await supabase.from('courses').select('*').order('title')
  if (error) {
    console.warn('Supabase fetch error, fallback to mock layer:', error)
    return null
  }
  return data
}

export async function getBatchesFromDb() {
  const { data, error } = await supabase.from('batches').select('*').order('name')
  if (error) {
    console.warn('Supabase fetch error, fallback to mock layer:', error)
    return null
  }
  return data
}

export async function getTrainersFromDb() {
  const { data, error } = await supabase.from('trainers').select('*').order('name')
  if (error) {
    console.warn('Supabase fetch error, fallback to mock layer:', error)
    return null
  }
  return data
}

export async function getFeeInstalmentsFromDb() {
  const { data, error } = await supabase.from('fee_instalments').select('*').order('due_date')
  if (error) {
    console.warn('Supabase fetch error, fallback to mock layer:', error)
    return null
  }
  return data
}

export async function getCertificatesFromDb() {
  const { data, error } = await supabase.from('certificates').select('*').order('issue_date', { ascending: false })
  if (error) {
    console.warn('Supabase fetch error, fallback to mock layer:', error)
    return null
  }
  return data
}
