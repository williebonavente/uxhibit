import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  try {
    const supabase = await createClient()
    
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
    }

    return NextResponse.redirect(new URL('/login', requestUrl.origin))
    // Redirect to dashboard after successful auth
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
  }
}