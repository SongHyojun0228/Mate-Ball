import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user ?? null, loading: false })
      if (session?.user) {
        get().fetchProfile(session.user.id)
      }
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null })
      if (session?.user) {
        get().fetchProfile(session.user.id)
      } else {
        set({ profile: null })
      }
    })
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*, teams(*)')
      .eq('id', userId)
      .single()
    set({ profile: data })
  },

  signUp: async (email, password, nickname) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    })
    if (error) throw error
    return data
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  signInWithKakao: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: window.location.origin + '/' },
    })
    if (error) throw error
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null, profile: null })
  },

  deleteAccount: async () => {
    const { error } = await supabase.rpc('delete_user')
    if (error) throw error
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  updateFavoriteTeam: async (teamId) => {
    const userId = get().user?.id
    if (!userId) return

    const { error } = await supabase
      .from('profiles')
      .update({ favorite_team_id: teamId })
      .eq('id', userId)
    if (error) throw error

    await get().fetchProfile(userId)
  },
}))
