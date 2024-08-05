import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const supabase = createServerClient({
    headers: {
      cookies: cookies().getAll(),
    },
  })

  return supabase
}
