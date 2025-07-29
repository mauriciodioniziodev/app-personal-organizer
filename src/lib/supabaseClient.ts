import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabaseInstance = null;

if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR_SUPABASE_URL') && !supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
} else {
    console.warn("Supabase credentials are not set correctly in .env file. Supabase client will not be initialized.");
}

export const supabase = supabaseInstance;