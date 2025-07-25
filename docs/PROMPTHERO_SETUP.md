# PromptHero Cookie Setup Guide

## Step-by-Step Instructions

### 1. Sign in to PromptHero
1. Go to [https://prompthero.com/](https://prompthero.com/)
2. Click "Sign In" or "Sign Up" if you don't have an account
3. Complete the authentication process

### 2. Extract Cookies (Chrome)
1. While logged in to PromptHero, press **F12** to open Developer Tools
2. Go to the **Application** tab
3. In the left sidebar, expand **Storage** > **Cookies**
4. Click on **https://prompthero.com**
5. Look for cookies that might be important for authentication:
   - Any cookie with "session" in the name
   - Cookies starting with `__Secure-`
   - Cookies with names like `auth_token`, `access_token`, `csrf_token`
   - User identification cookies

### 3. Extract Cookies (Firefox)
1. Press **F12** to open Developer Tools
2. Go to the **Storage** tab
3. Expand **Cookies** > **https://prompthero.com**
4. Look for the same types of cookies mentioned above

### 4. Format Cookie String
Copy the cookie names and values, then format them as:
```
cookie_name1=cookie_value1; cookie_name2=cookie_value2; cookie_name3=cookie_value3
```

**Example:**
```
__Secure-session=eyJhbGciOiJIUzI1NiJ9...; user_token=abc123xyz; csrf_token=def456ghi
```

### 5. Add to Environment File
1. Open your `.env.local` file in the project root
2. Add your cookies:
```bash
PROMPTHERO_COOKIES="your_actual_cookie_string_here"
```

### 6. Test the Setup
```bash
# Try a full crawl to test if cookies work
npm run crawl
```

## Important Notes

- **Cookies expire**: You may need to refresh them periodically
- **Security**: Never commit your `.env.local` file to version control
- **Privacy**: Only use your own account cookies
- **Format**: Make sure there are no extra spaces or newlines in the cookie string

## Troubleshooting

### Common Cookie Names on PromptHero
Look for cookies with these patterns:
- `session_*`
- `__Secure-*`
- `auth_*`
- `token_*`
- `csrf_*`
- `user_*`

### If Cookies Don't Work
1. **Clear and re-login**: Clear all PromptHero cookies and sign in again
2. **Check format**: Ensure proper semicolon separation and no extra characters
3. **Copy all cookies**: Include all cookies from the site, not just obvious ones
4. **Browser differences**: Try extracting cookies from a different browser

### Testing Checklist
- [ ] Can sign in to PromptHero manually
- [ ] Extracted cookies from developer tools
- [ ] Formatted cookies correctly with semicolons
- [ ] Added cookies to `.env.local` file
- [ ] Can see prompts when running full crawl
