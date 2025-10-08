# Discord OAuth Authentication Service

A lightweight, serverless Discord OAuth2 authentication service built with Next.js. This service validates Discord server membership and redirects users to your frontend application with their profile information.

## Features

- 🔐 **Secure OAuth2 Flow** - CSRF protection with state parameter validation
- 🚀 **Serverless Architecture** - Edge Runtime for optimal performance
- ✅ **Guild Membership Validation** - Verify users belong to your Discord server
- 🔄 **Seamless Integration** - Easy to integrate with any frontend application
- 🛡️ **Security First** - HttpOnly cookies, environment-based configuration
- ⚡ **Fast & Lightweight** - Minimal dependencies, maximum performance

## How It Works

1. User visits your authentication service
2. Automatically redirects to Discord OAuth2 authorization
3. User authorizes and Discord redirects back
4. Service validates guild membership
5. Redirects to your frontend with user data (or error message)

## Prerequisites

- Node.js 18+ or compatible runtime
- Discord Application with OAuth2 credentials
- Discord Server (Guild) ID for membership validation

## Installation

```bash
# Clone the repository
git clone https://github.com/KnarliX/Discord-Auth.git
cd Discord-Auth

# Install dependencies
pnpm install
# or
npm install
```

## Configuration

Create a `.env.local` file in the root directory:

```env
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=https://your-domain.com/callback
DISCORD_GUILD_ID=your_discord_server_id
FRONTEND_URL=https://your-frontend-domain.com
```

### Getting Discord Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select existing one
3. Navigate to OAuth2 settings
4. Copy your Client ID and Client Secret
5. Add your redirect URI: `https://your-domain.com/callback`
6. Get your Discord Server ID by enabling Developer Mode in Discord and right-clicking your server

## Usage

### Development

```bash
pnpm dev
```

The service will run on `http://localhost:5000`

### Production

```bash
pnpm build
pnpm start
```

## API Routes

### `GET /`
Initiates OAuth flow by redirecting to Discord authorization page.

**Response:** `307 Redirect` to Discord OAuth

### `GET /callback`
Handles OAuth callback from Discord.

**Query Parameters:**
- `code` - Authorization code from Discord
- `state` - CSRF protection token

**Success Response:** `307 Redirect` to `{FRONTEND_URL}/verification/callback?name={name}&id={id}&tag={username}&avatar={avatar}`

**Error Response:** `307 Redirect` to `{FRONTEND_URL}/verification/error?msg={error_message}`

## Integration Example

### Frontend Implementation

```javascript
// Handle success callback
const params = new URLSearchParams(window.location.search);
const userName = params.get('name');
const userId = params.get('id');
const userTag = params.get('tag');
const avatarUrl = params.get('avatar');

// Use the user data in your application
console.log('Authenticated user:', { userName, userId, userTag, avatarUrl });
```

### Error Handling

```javascript
// Handle error callback
const params = new URLSearchParams(window.location.search);
const errorMessage = params.get('msg');

if (errorMessage) {
  console.error('Authentication error:', errorMessage);
  // Show error to user
}
```

## Deployment

This service can be deployed to any platform that supports Next.js:

- **[Vercel](https://vercel.com)** (Recommended)
- **Netlify**
- **Railway**
- **Fly.io**
- Or any Node.js hosting platform

### Environment Variables

Make sure to set all required environment variables in your deployment platform.

## Security

- ✅ State parameter for CSRF protection
- ✅ HttpOnly cookies with configurable security
- ✅ Environment-based secure flag (HTTPS in production)
- ✅ 5-minute cookie expiration
- ✅ No hardcoded credentials
- ✅ Proper error handling and validation

## Error Messages

| Error | Description |
|-------|-------------|
| `Missing code` | Authorization code not received from Discord |
| `Invalid or missing state parameter` | CSRF validation failed |
| `Token exchange failed` | Failed to exchange code for access token |
| `Required scopes missing` | User didn't grant necessary permissions |
| `Failed to fetch user profile` | Couldn't retrieve user information |
| `Invalid user data` | User data is incomplete or invalid |
| `Failed to fetch guilds` | Couldn't retrieve user's server list |
| `You are not a member of the required Discord server. Please join our server first.` | User is not a member of required Discord server |

**Note:** To customize the guild membership error message with your server name, edit the error message in `app/callback/route.ts` at line 138. Replace the generic message with something like: `You are not in our server please join [YOUR SERVER NAME] first`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/KnarliX/Discord-Auth/issues) on GitHub.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Uses [Discord OAuth2 API](https://discord.com/developers/docs/topics/oauth2)

---

Made with ❤️ for the Discord community and janvi's Discord server 