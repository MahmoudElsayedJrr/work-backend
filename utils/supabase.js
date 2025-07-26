const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.supabaseUrl;
const supabaseKey = process.env.supabaseKey;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
