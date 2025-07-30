import { createClient } from '@/utils/supabase/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
// import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        // ERROR sa Code!!!
        // const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        // (await cookieStore).getAll()
        const supabase = await createClient();
        // For some reason I need to get the cookies here to make the exchangeCodeForSession work
        // Don't know if I also need to get them after but will do anyways
        const response = await supabase.auth.exchangeCodeForSession(code);
        // RangeError [ERR_HTTP_INVALID_STATUS_CODE]: Invalid status code: 0
        if (response.error) {
            console.error('Error logging in:', response.error.message)
            return NextResponse.json({ error: response.error.message }, { status: 400 });
        }
    }
    // URL to redirect to after sign in process completes
    // return NextResponse.redirect(requestUrl.origin);
    return NextResponse.redirect(`${requestUrl.origin}/auth/reset-password`);
}
