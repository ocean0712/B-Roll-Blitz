import { createClient } from '@supabase/supabase-js';

// Using dummy keys so the frontend completely loads without crashing
const supabaseUrl = "https://placeholder-project.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
