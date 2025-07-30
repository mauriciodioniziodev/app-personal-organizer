import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabaseInstance = null;

// Only initialize Supabase if both URL and Key are provided and valid.
if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR_SUPABASE_URL') && !supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')) {
    try {
        supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
    } catch (error) {
        console.error("Failed to initialize Supabase client:", error);
        supabaseInstance = null;
    }
} else {
    console.warn("Supabase credentials are not configured. Using fallback data.");
}


export const supabase = supabaseInstance;
