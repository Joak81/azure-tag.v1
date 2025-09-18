import { Request, Response, NextFunction } from 'express';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { unauthorized, APIError } from './errorHandler';
import { winstonLogger } from './logger';

// Extend Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name?: string;
        email?: string;
        tenantId: string;
        roles?: string[];
      };
      accessToken?: string;
    }
  }
}

// MSAL configuration for server-side token validation
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID || 'placeholder',
    clientSecret: process.env.AZURE_CLIENT_SECRET || 'placeholder',
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}`,
  },
};

// Only create MSAL instance if we have valid credentials
export const msalInstance = process.env.AZURE_CLIENT_SECRET
  ? new ConfidentialClientApplication(msalConfig)
  : null;

/**
 * Middleware to authenticate requests using Azure AD tokens
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw unauthorized('Access token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate the token with Microsoft Graph
    const userInfo = await validateToken(token);

    if (!userInfo) {
      throw unauthorized('Invalid or expired token');
    }

    // Add user info to request object
    req.user = userInfo;
    req.accessToken = token;

    winstonLogger.info('User authenticated', {
      userId: userInfo.id,
      email: userInfo.email,
      tenantId: userInfo.tenantId,
    });

    next();
  } catch (error) {
    if (error instanceof APIError) {
      next(error);
    } else {
      winstonLogger.error('Authentication error', { error: error.message });
      next(unauthorized('Authentication failed'));
    }
  }
};

/**
 * Validate Azure AD access token and extract user information
 */
async function validateToken(token: string): Promise<{
  id: string;
  name?: string;
  email?: string;
  tenantId: string;
  roles?: string[];
} | null> {
  try {
    // In a real implementation, you would:
    // 1. Validate the token signature using Azure AD public keys
    // 2. Check token expiration
    // 3. Verify the audience and issuer
    // 4. Extract claims from the token

    // For now, we'll make a simple call to Microsoft Graph to validate the token
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const userProfile = await response.json();

    return {
      id: userProfile.id,
      name: userProfile.displayName,
      email: userProfile.mail || userProfile.userPrincipalName,
      tenantId: process.env.AZURE_TENANT_ID!,
      roles: [], // Could be extracted from token claims or Azure AD
    };
  } catch (error) {
    winstonLogger.error('Token validation error', { error: error.message });
    return null;
  }
}

/**
 * Middleware to check if user has required Azure roles/permissions
 */
export const requireRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(unauthorized('Authentication required'));
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole && requiredRoles.length > 0) {
      winstonLogger.warn('Access denied - insufficient permissions', {
        userId: req.user.id,
        requiredRoles,
        userRoles,
      });
      return next(new APIError('Insufficient permissions', 403));
    }

    next();
  };
};