import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// This is the public client, safe to be used in the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabaseInstance = null;

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


// This function creates a privileged client for server-side operations.
export const createSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase URL or Service Key for admin client');
        return null;
    }
    
    try {
        return createClient<Database>(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    } catch (error) {
        console.error("Failed to initialize Supabase admin client:", error);
        return null;
    }
}
