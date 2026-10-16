import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://slqdpipsrbtrfjjxnvpd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zmOYfWAqfVX8YCYwAyZTNA_YphBB_NW'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

/**
 * Supabase Authentication Services
 */
export async function signInWithSupabase(email: string, password: string) {
  try {
    const res = await supabase.auth.signInWithPassword({ email, password })
    return res
  } catch (err: any) {
    return { data: { user: null, session: null }, error: err }
  }
}

export async function signUpWithSupabase(
  email: string,
  password: string,
  metadata: { name: string; role: string; branch: string }
) {
  try {
    const res = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    return res
  } catch (err: any) {
    return { data: { user: null, session: null }, error: err }
  }
}

export async function signOutSupabase() {
  try {
    await supabase.auth.signOut()
  } catch (err) {
    console.warn('Sign out error:', err)
  }
}

export async function getSupabaseSession() {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session
  } catch (err) {
    return null
  }
}

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
