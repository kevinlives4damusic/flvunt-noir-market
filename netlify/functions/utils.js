import crypto from 'crypto';

/**
 * Securely verify Yoco webhook signature using constant-time comparison
 */
export const verifyYocoSignature = (payload, signature, secret) => {
  if (!secret || !signature) return false;

  try {
    // Convert signature to buffer safely
    const providedSignature = Buffer.from(signature, 'hex');
    
    // Calculate expected signature
    const hmac = crypto.createHmac('sha256', secret);
    const expectedSignature = Buffer.from(hmac.update(payload).digest('hex'), 'hex');
    
    // Use constant-time comparison to prevent timing attacks
    if (providedSignature.length !== expectedSignature.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(providedSignature, expectedSignature);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};