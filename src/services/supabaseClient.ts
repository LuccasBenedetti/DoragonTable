import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://icwrgwaiintuzmhvsafk.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_HZbFh-0VwZ-ss0WCfOMaRw_IBd9Q9yM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
