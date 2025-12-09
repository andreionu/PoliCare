import { createClient } from '@supabase/supabase-js'

// Le citim din fișierul .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Lipsesc cheile Supabase din .env.local!')
}