import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qmkrrjzvaflzgbvnlfqx.supabase.co'
const supabaseAnonKey = 'sb_publishable_M83gUj0Xxm9kddLisD92OQ_Jj94-U66'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)