const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verifies a reCAPTCHA v3 token server-side against Google's siteverify endpoint.
 *
 * @param {string} token - the token returned by executeRecaptcha() on the client
 * @param {string} [expectedAction] - the action name passed to executeRecaptcha(); if
 *   provided, a mismatch is treated as a failure (protects against a token minted for
 *   a different action being replayed here)
 * @param {number} [minScore=0.5] - v3 returns a 0.0 (bot) to 1.0 (human) score; below
 *   this threshold is treated as a failure
 * @returns {Promise<{success: boolean, score?: number, action?: string, reason?: string, skipped?: boolean}>}
 */
export async function verifyRecaptcha(token, expectedAction, minScore = 0.5) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    // No secret configured — verification is effectively disabled rather than
    // blocking every submission, so environments that haven't set this up yet
    // (e.g. local dev) keep working.
    console.warn('RECAPTCHA_SECRET_KEY not set — skipping server-side reCAPTCHA verification');
    return { success: true, skipped: true };
  }

  if (!token) {
    return { success: false, reason: 'missing_token' };
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: secretKey, response: token }).toString(),
    });

    const data = await response.json();

    if (!data.success) {
      return { success: false, reason: 'verification_failed', errors: data['error-codes'] };
    }

    // v2 keys and Google's published test keypair don't return `action` at all —
    // only enforce the match when the response actually includes one, otherwise
    // every submission would be rejected.
    if (expectedAction && data.action !== undefined && data.action !== expectedAction) {
      return { success: false, reason: 'action_mismatch', action: data.action };
    }

    if (typeof data.score === 'number' && data.score < minScore) {
      return { success: false, reason: 'low_score', score: data.score };
    }

    return { success: true, score: data.score, action: data.action };
  } catch (error) {
    console.error('reCAPTCHA verification request failed:', error);
    // Fail open on a transient error reaching Google's own service — reCAPTCHA is
    // one bot-mitigation signal among several (behavioral analysis, document/face
    // checks), not the sole gate, so an outage there shouldn't block submissions.
    return { success: true, skipped: true, reason: 'verification_error' };
  }
}
