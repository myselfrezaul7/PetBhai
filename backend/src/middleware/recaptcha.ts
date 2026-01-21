import { Request, Response, NextFunction } from 'express';
import { securityLog } from './logger';

// reCAPTCHA Secret Key - stored in environment variable for security
const RECAPTCHA_SECRET_KEY =
  process.env.RECAPTCHA_SECRET_KEY || '6LdkHlIsAAAAAJvhJTawpqTK9FW4x7HwiqnFMZ15';

interface RecaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  score?: number; // For reCAPTCHA v3
  action?: string; // For reCAPTCHA v3
}

/**
 * Verify reCAPTCHA token with Google's API
 */
export const verifyRecaptchaToken = async (token: string): Promise<RecaptchaVerifyResponse> => {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(RECAPTCHA_SECRET_KEY)}&response=${encodeURIComponent(token)}`,
    });

    if (!response.ok) {
      throw new Error(`reCAPTCHA verification failed with status: ${response.status}`);
    }

    const data: RecaptchaVerifyResponse = await response.json();
    return data;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return {
      success: false,
      'error-codes': ['network-error'],
    };
  }
};

/**
 * reCAPTCHA verification middleware
 * Use this middleware on routes that need bot protection
 */
export const recaptchaMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip reCAPTCHA in development/testing if configured
  if (process.env.SKIP_RECAPTCHA === 'true' && process.env.NODE_ENV !== 'production') {
    return next();
  }

  const recaptchaToken = req.body?.recaptchaToken || req.headers['x-recaptcha-token'];

  if (!recaptchaToken) {
    securityLog('MISSING_RECAPTCHA', req);
    res.status(400).json({
      error: 'reCAPTCHA verification required',
      message: 'Please complete the reCAPTCHA challenge',
    });
    return;
  }

  try {
    const verificationResult = await verifyRecaptchaToken(recaptchaToken);

    if (!verificationResult.success) {
      securityLog('RECAPTCHA_FAILED', req, {
        errors: verificationResult['error-codes'],
      });

      // Provide user-friendly error messages
      let errorMessage = 'reCAPTCHA verification failed';
      const errorCodes = verificationResult['error-codes'] || [];

      if (errorCodes.includes('timeout-or-duplicate')) {
        errorMessage = 'reCAPTCHA expired. Please try again.';
      } else if (errorCodes.includes('invalid-input-response')) {
        errorMessage = 'Invalid reCAPTCHA. Please refresh and try again.';
      }

      res.status(400).json({
        error: 'reCAPTCHA verification failed',
        message: errorMessage,
      });
      return;
    }

    // Log successful verification
    securityLog('RECAPTCHA_VERIFIED', req, {
      hostname: verificationResult.hostname,
      timestamp: verificationResult.challenge_ts,
    });

    // Remove recaptchaToken from body to avoid passing to handlers
    if (req.body?.recaptchaToken) {
      delete req.body.recaptchaToken;
    }

    next();
  } catch (error) {
    console.error('reCAPTCHA middleware error:', error);
    securityLog('RECAPTCHA_ERROR', req, { error: String(error) });

    // In production, fail open to avoid blocking legitimate users
    // In a stricter setup, you might want to fail closed
    if (process.env.NODE_ENV === 'production') {
      next();
    } else {
      res.status(500).json({
        error: 'reCAPTCHA verification error',
        message: 'Unable to verify reCAPTCHA. Please try again.',
      });
    }
  }
};

/**
 * Optional reCAPTCHA middleware - verifies if token present, skips if not
 * Use this for routes where reCAPTCHA is optional
 */
export const optionalRecaptchaMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const recaptchaToken = req.body?.recaptchaToken || req.headers['x-recaptcha-token'];

  // If no token, skip verification
  if (!recaptchaToken) {
    return next();
  }

  // If token present, verify it
  return recaptchaMiddleware(req, res, next);
};

export default recaptchaMiddleware;
