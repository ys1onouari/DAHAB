import { supabaseReady } from './supabase.js';

export async function login(email, password, persistSession = true) {
  const supabase = await supabaseReady;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  if (!persistSession) {
    // Supabase stocke toujours le token dans localStorage même avec persistSession:false
    // On nettoie pour empêcher la persistance après rechargement
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.endsWith('-auth-token')) localStorage.removeItem(k);
    }
  }

  return data;
}


