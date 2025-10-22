import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qdrppchwgqrnxkcnayoj.supabase.co'
const supabaseKey = 'eyJhbGc...ของพี่...' // ใช้ anon public key
export const supabase = createClient(supabaseUrl, supabaseKey)
