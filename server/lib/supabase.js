const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://icwrgwaiintuzmhvsafk.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_HZbFh-0VwZ-ss0WCfOMaRw_IBd9Q9yM';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
