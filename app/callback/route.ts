import { NextRequest, NextResponse } from 'next/server'

// Use Edge runtime for better performance
export const runtime = 'edge'

/**
 * Discord OAuth2 Callback Route
 * Handles the OAuth callback from Discord:
 * 1. Validates authorization code
 * 2. Exchanges code for access token
 * 3. Fetches user profile and guild membership
 * 4. Validates guild membership
 * 5. Redirects based on validation results
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  // Validate all required environment variables
  const frontendUrl = process.env.FRONTEND_URL
  const clientId = process.env.DISCORD_CLIENT_ID
  const clientSecret = process.env.DISCORD_CLIENT_SECRET
  const redirectUri = process.env.DISCORD_REDIRECT_URI
  const guildId = process.env.DISCORD_GUILD_ID

  if (!frontendUrl || !clientId || !clientSecret || !redirectUri || !guildId) {
    return new Response('Server configuration error: missing required environment variables', { status: 500 })
  }

  // Helper function to build error redirect URL with proper encoding
  const buildErrorUrl = (message: string): string => {
    const url = new URL(`${frontendUrl}/verification/error`)
    url.searchParams.set('msg', message)
    return url.toString()
  }

  // Helper function to clear oauth cookie
  const clearOAuthCookie = (response: NextResponse): NextResponse => {
    response.cookies.delete('oauth_state')
    return response
  }

  // Step 1: Validate state parameter for CSRF protection
  const storedState = request.cookies.get('oauth_state')?.value
  
  if (!state || !storedState || state !== storedState) {
    const response = NextResponse.redirect(buildErrorUrl('Invalid or missing state parameter'))
    return clearOAuthCookie(response)
  }

  // Step 2: Validate that authorization code exists
  if (!code) {
    const response = NextResponse.redirect(buildErrorUrl('Missing code'))
    return clearOAuthCookie(response)
  }

  try {
    // Step 3: Exchange authorization code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const response = NextResponse.redirect(buildErrorUrl('Token exchange failed'))
      return clearOAuthCookie(response)
    }

    const tokenData = await tokenResponse.json()

    // Step 4: Validate access token exists
    if (!tokenData.access_token) {
      const response = NextResponse.redirect(buildErrorUrl('Token exchange failed'))
      return clearOAuthCookie(response)
    }

    // Step 5: Validate required scopes (identify and guilds)
    const scopes = tokenData.scope ? tokenData.scope.split(' ') : []
    if (!scopes.includes('identify') || !scopes.includes('guilds')) {
      const response = NextResponse.redirect(buildErrorUrl('Required scopes missing'))
      return clearOAuthCookie(response)
    }

    // Step 6: Fetch user profile from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      const response = NextResponse.redirect(buildErrorUrl('Failed to fetch user profile'))
      return clearOAuthCookie(response)
    }

    const user = await userResponse.json()

    // Step 7: Validate user data
    if (!user.id || !user.username) {
      const response = NextResponse.redirect(buildErrorUrl('Invalid user data'))
      return clearOAuthCookie(response)
    }

    // Step 8: Fetch user's guild memberships
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!guildsResponse.ok) {
      const response = NextResponse.redirect(buildErrorUrl('Failed to fetch guilds'))
      return clearOAuthCookie(response)
    }

    const guilds = await guildsResponse.json()

    // Step 9: Validate guilds is an array
    if (!Array.isArray(guilds)) {
      const response = NextResponse.redirect(buildErrorUrl('Invalid guild data'))
      return clearOAuthCookie(response)
    }

    // Step 10: Check if user is member of the required guild
    const isMember = guilds.some((guild: any) => guild.id === guildId)

    if (!isMember) {
      const response = NextResponse.redirect(buildErrorUrl('You are not in our server please join janvi\'s server first'))
      return clearOAuthCookie(response)
    }

    // Step 11: Build success redirect URL with user data
    // Get display name (global_name or username as fallback)
    const displayName = user.global_name || user.username
    
    // Build avatar URL if user has an avatar
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`

    // Construct success callback URL with user parameters
    const successUrl = new URL(`${frontendUrl}/verification/callback`)
    successUrl.searchParams.set('name', displayName)
    successUrl.searchParams.set('id', user.id)
    successUrl.searchParams.set('tag', user.username)
    successUrl.searchParams.set('avatar', avatarUrl)

    // Redirect to frontend with user data and clear oauth cookie
    const response = NextResponse.redirect(successUrl.toString())
    return clearOAuthCookie(response)

  } catch (error) {
    // Handle any unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const response = NextResponse.redirect(buildErrorUrl(errorMessage))
    return clearOAuthCookie(response)
  }
}