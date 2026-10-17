import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const USE_SUPABASE = false

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any)

/**
 * Supabase Authentication Services
 */
export async function signInWithSupabase(email: string, password: string) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: { user: null, session: null },
      error: new Error('Supabase credentials not configured in environment. Please use demo credentials.'),
    }
  }
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
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: { user: null, session: null },
      error: new Error('Supabase credentials not configured in environment.'),
    }
  }
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
  if (!isSupabaseConfigured || !supabase) return
  try {
    await supabase.auth.signOut()
  } catch (err) {
    console.warn('Sign out error:', err)
  }
}

export async function getSupabaseSession() {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data } = await supabase.auth.getSession()
    return data.session
  } catch (err) {
    return null
  }
}
