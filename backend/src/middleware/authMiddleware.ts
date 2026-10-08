import { Request, Response, NextFunction } from 'express';
import { Auth0Service } from '../services/auth0Service';
import { authConfig, DEFAULT_MOCK_AUTH0_USER } from '../config/auth';

export interface AuthenticatedCustomerRequest extends Request {
  auth0User?: any;
  isAuth0Bypassed?: boolean;
}

const auth0Service = new Auth0Service();

/**
 * Customer Authentication Middleware with Auth0 soft-bypass
 * When ENABLE_AUTH0 !== 'true', missing or mock tokens are accepted gracefully,
 * falling back to DEFAULT_MOCK_AUTH0_USER so local testing is never blocked.
 */
export async function customerAuthMiddleware(
  req: AuthenticatedCustomerRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // 1. If Auth0 is actively enabled, perform strict token verification
  if (authConfig.enableAuth0) {
    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'AUTH0_TOKEN_REQUIRED',
        message: 'Authorization Bearer token required by Auth0',
      });
    }

    try {
      const user = await auth0Service.verifyToken(token);
      req.auth0User = user;
      req.isAuth0Bypassed = false;
      return next();
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        code: 'AUTH0_INVALID_TOKEN',
        message: err.message || 'Invalid or expired Auth0 token',
      });
    }
  }

  // 2. Auth0 is Muted / Bypassed (ENABLE_AUTH0 !== 'true')
  // Gracefully attach mock user or decode token without failing
  req.auth0User = {
    ...DEFAULT_MOCK_AUTH0_USER,
    tokenProvided: !!token,
  };
  req.isAuth0Bypassed = true;

  return next();
}
