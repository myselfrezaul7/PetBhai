import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { securityLog } from './logger';

// reCAPTCHA v2 Secret Key - stored in environment variable for security
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '';

interface RecaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

interface MathFallbackPayload {
  type: 'math-v1';
  challengeId: string;
  answer: number;
}

const mathChallengeStore = new Map<string, { answer: number; expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [id, challenge] of mathChallengeStore.entries()) {
    if (now > challenge.expiresAt) {
      mathChallengeStore.delete(id);
    }
  }
}, 60 * 1000); // Check every minute

export const getMathChallengeHandler = (req: Request, res: Response) => {
  const left = Math.floor(Math.random() * 20) + 1;
  const right = Math.floor(Math.random() * 20) + 1;
  const operator = Math.random() > 0.5 ? '+' : '-';
  const answer = operator === '+' ? left + right : left - right;
  
  const challengeId = randomUUID();
  mathChallengeStore.set(challengeId, {
    answer,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes TTL
  });
  
  res.json({
    challengeId,
    question: `${left} ${operator} ${right}`
  });
};

const isValidMathFallback = (payload: unknown): payload is MathFallbackPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<MathFallbackPayload>;
  if (candidate.type !== 'math-v1' || typeof candidate.challengeId !== 'string' || typeof candidate.answer !== 'number') {
    return false;
  }

  const challenge = mathChallengeStore.get(candidate.challengeId);
  if (!challenge) {
    return false;
  }

  // Always invalidate the challenge on verification attempt to prevent brute-force attacks
  mathChallengeStore.delete(candidate.challengeId);

  if (Date.now() > challenge.expiresAt) {
    return false;
  }

  return challenge.answer === candidate.answer;
};

/**
 * Verify reCAPTCHA v2 token with Google's siteverify API
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

    const data = (await response.json()) as RecaptchaVerifyResponse;
    return data;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    throw error;
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
  const captchaFallback = req.body?.captchaFallback;

  if (!recaptchaToken) {
    if (isValidMathFallback(captchaFallback)) {
      securityLog('MATH_CAPTCHA_VERIFIED', req, {
        method: req.method,
        path: req.originalUrl || req.url,
      });

      if (req.body?.captchaFallback) {
        delete req.body.captchaFallback;
      }

      next();
      return;
    }

    securityLog('MISSING_RECAPTCHA', req);
    res.status(400).json({
      error: 'reCAPTCHA verification required',
      message: 'Please complete the reCAPTCHA challenge',
      reqId: (req as any).reqId || 'unknown'
    });
    return;
  }

  try {
    const verificationResult = await verifyRecaptchaToken(recaptchaToken);

    if (!verificationResult.success) {
      if (isValidMathFallback(captchaFallback)) {
        securityLog('RECAPTCHA_FAILED_MATH_FALLBACK_VERIFIED', req, {
          method: req.method,
          path: req.originalUrl || req.url,
          errors: verificationResult['error-codes'],
        });

        if (req.body?.captchaFallback) {
          delete req.body.captchaFallback;
        }

        next();
        return;
      }

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
        reqId: (req as any).reqId || 'unknown'
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

    const allowFailOpen =
      process.env.NODE_ENV !== 'production' || process.env.RECAPTCHA_FAIL_OPEN === 'true';

    if (allowFailOpen) {
      next();
    } else {
      res.status(503).json({
        error: 'reCAPTCHA verification error',
        message: 'Unable to verify reCAPTCHA. Please try again.',
        reqId: (req as any).reqId || 'unknown'
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
