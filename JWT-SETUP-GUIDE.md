# JWT Secret Key Setup Guide

## What is JWT_SECRET?

**JWT (JSON Web Token)** is a secure way to transmit information between your app and users. The `JWT_SECRET` is a cryptographic key that:

- **Signs tokens** when users log in
- **Verifies tokens** on every request
- **Prevents tampering** with authentication data
- **Ensures security** of user sessions

## Why You Need It

Without a proper JWT_SECRET:

- ❌ Authentication system won't work
- ❌ Users can't log in securely
- ❌ Sessions could be hijacked
- ❌ App will show security errors

## How to Generate JWT_SECRET

### Method 1: Using Node.js (Recommended)

```bash
# In your project directory, run:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Method 2: Using PowerShell (Windows)

```powershell
# Generate random hex string
[System.Convert]::ToHex([System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes(64))
```

### Method 3: Online Generator

Visit: https://generate-secret.vercel.app/64

### Method 4: Manual Generation

```javascript
// Create a file called generate-key.js with this content:
const crypto = require("crypto");
console.log("Your JWT Secret:", crypto.randomBytes(64).toString("hex"));

// Then run: node generate-key.js
```

## Example Generated Keys

Here are examples of what secure JWT secrets look like:

```
a8f5f167f44f4964e6c998dee827110c03a8a2c9be8b4d6f9b8e4c9c4f4f7b6f1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7
b2e4f6a8c0d2e4f6a8c0d2e4f6a8c0d2e4f6a8c0d2e4f6a8c0d2e4f6a8c0d2e4f6a8c0d2e4f6a8c0d2e4f6a8c0d2e4f6a8c0d2e4
```

## Setting Up Your JWT_SECRET

### Step 1: Generate Your Secret

Use any of the methods above to generate a secure random key.

### Step 2: Create/Update .env File

Create a `.env` file in your project root:

```env
# Your secure JWT secret (replace with generated key)
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c03a8a2c9be8b4d6f9b8e4c9c4f4f7b6f1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7

# Token expiration time (optional)
JWT_EXPIRES_IN=24h

# Database settings
DB_SERVER=10.10.0.1
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=Admin@123
DB_NAME=GroupManager
```

### Step 3: Restart Your Application

After setting the JWT_SECRET, restart your server for changes to take effect.

## Security Best Practices

### ✅ DO:

- Use a cryptographically random secret (at least 256 bits/32 bytes)
- Keep the secret in environment variables, not in code
- Use different secrets for development, staging, and production
- Rotate secrets regularly (quarterly/yearly)
- Store secrets securely (encrypted storage, vaults)

### ❌ DON'T:

- Use simple passwords like "secret123"
- Commit secrets to version control (Git)
- Share secrets in chat/email
- Use the same secret across environments
- Store secrets in code files

## Environment Variables for IIS

For Windows IIS deployment, set environment variables using:

### Option 1: web.config

```xml
<configuration>
  <appSettings>
    <add key="JWT_SECRET" value="your-generated-secret-here" />
    <add key="JWT_EXPIRES_IN" value="24h" />
  </appSettings>
</configuration>
```

### Option 2: IIS Manager

1. Open IIS Manager
2. Select your application
3. Go to Configuration Editor
4. Navigate to system.webServer/aspNetCore
5. Add environment variables in environmentVariables section

### Option 3: Command Line

```cmd
setx JWT_SECRET "your-generated-secret-here"
```

## Troubleshooting

### Error: "JWT_SECRET environment variable is not set!"

**Solution**: Generate and set a JWT_SECRET in your .env file or environment variables.

### Error: "Invalid token"

**Causes**:

- JWT_SECRET changed after tokens were issued
- Token expired (check JWT_EXPIRES_IN)
- Malformed token

**Solution**: Clear browser storage and log in again.

### Error: "Failed to sign token"

**Cause**: JWT_SECRET is too short or invalid
**Solution**: Generate a new secret using the methods above.

## Testing Your Setup

1. Start your application
2. Go to the login page
3. Use demo credentials: `admin` / `admin123`
4. If login succeeds, JWT is working correctly!

## Why This Matters

A secure JWT_SECRET is crucial because:

- It prevents users from creating fake login tokens
- It ensures your authentication system can't be bypassed
- It protects user data and application security
- It meets enterprise security standards

Remember: **Your JWT_SECRET is like the master key to your application's security!** 🔐
