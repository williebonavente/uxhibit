import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabase = await createClient();
        const response = await supabase.auth.exchangeCodeForSession(code);
        if (response.error) {
            console.error('Error logging in:', response.error.message)
            return NextResponse.json({ error: response.error.message }, { status: 400 });
        }
    }
    return NextResponse.redirect(`${requestUrl.origin}/auth/reset-password`);
}
