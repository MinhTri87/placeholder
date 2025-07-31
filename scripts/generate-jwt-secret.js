#!/usr/bin/env node

const crypto = require("crypto");

/**
 * Generate a secure JWT secret key
 *
 * JWT_SECRET is used to sign and verify JSON Web Tokens for user authentication.
 * It should be:
 * - At least 256 bits (32 bytes) long
 * - Cryptographically random
 * - Kept secret and never shared
 * - Different for each environment (development, staging, production)
 */

function generateJWTSecret() {
  // Generate 64 bytes (512 bits) of random data and convert to hex
  const secret = crypto.randomBytes(64).toString("hex");
  return secret;
}

function main() {
  console.log("\n🔐 JWT Secret Key Generator");
  console.log("==========================\n");

  console.log("What is JWT_SECRET?");
  console.log("- A secret key used to sign and verify authentication tokens");
  console.log("- Must be kept secret and secure");
  console.log("- Should be at least 256 bits (32 bytes) long");
  console.log("- Different for each environment\n");

  const secret = generateJWTSecret();

  console.log("Generated JWT Secret:");
  console.log("--------------------");
  console.log(secret);
  console.log("\n📋 Copy this to your .env file:");
  console.log(`JWT_SECRET=${secret}`);
  console.log("\n⚠️  Security Notes:");
  console.log("- Never commit this secret to version control");
  console.log("- Use different secrets for dev/staging/production");
  console.log("- Store securely in environment variables");
  console.log("- Rotate regularly for maximum security\n");

  // Generate a few more options
  console.log("Alternative secrets (choose one):");
  console.log("--------------------------------");
  for (let i = 1; i <= 3; i++) {
    console.log(`${i}. ${generateJWTSecret()}`);
  }
  console.log("\n✅ Usage: Set one of these as JWT_SECRET in your environment");
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateJWTSecret };
