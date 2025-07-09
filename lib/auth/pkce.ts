import crypto from 'crypto'

export interface PKCEChallenge {
  codeVerifier: string
  codeChallenge: string
  codeChallengeMethod: 'S256'
}

export function generatePKCEChallenge(): PKCEChallenge {
  // Generate a random code verifier
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  
  // Create code challenge using SHA256
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256'
  }
}

export function validatePKCE(codeVerifier: string, codeChallenge: string): boolean {
  const expectedChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
  
  return expectedChallenge === codeChallenge
}