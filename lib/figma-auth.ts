import { createClient } from '@/utils/supabase/client'

export async function getFigmaAuthUrl() {
  try {
    const supabase = createClient()
    
    console.log('Starting Figma OAuth flow')
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'figma',
      options: {
        scopes: [
          'current_user:read',      // For user profile info
          'file_content:read',      // For reading file contents
          'file_comments:read',     // For reading comments
          'file_metadata:read',     // For file metadata
          'file_versions:read'      // For version history
        ].join(' '), 
        // Change redirectTo to match Supabase's callback
        redirectTo: `${window.location.origin}/api/figma/auth/callback`,
        queryParams: {
          // Remove additional_user_data to prevent encoding issues
          redirect_to: `${window.location.origin}/dashboard`
        }
      }
    })

    if (error) {
      console.error('Supabase OAuth error:', error)
      throw error
    }

    return data?.url
  } catch (error) {
    console.error('Failed to initialize Figma auth:', error)
    throw error
  }
}