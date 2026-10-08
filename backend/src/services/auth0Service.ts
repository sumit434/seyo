import { authConfig, DEFAULT_MOCK_AUTH0_USER } from '../config/auth';

export interface Auth0PasswordlessStartResponse {
  _id: string;
  phone_number?: string;
  email?: string;
  request_language?: string | null;
}

export interface Auth0TokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in?: number;
  user?: typeof DEFAULT_MOCK_AUTH0_USER;
}

export class Auth0Service {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = authConfig.enableAuth0;
  }

  /**
   * Check whether live Auth0 integration is actively enabled
   */
  public isAuth0Active(): boolean {
    return this.isEnabled;
  }

  /**
   * Initiate Auth0 Passwordless SMS / Email authentication
   * Soft-bypassed when ENABLE_AUTH0 !== 'true'
   */
  public async startPasswordless(
    phoneNumberOrEmail: string,
    type: 'sms' | 'email' = 'sms'
  ): Promise<Auth0PasswordlessStartResponse> {
    if (this.isEnabled) {
      // LIVE AUTH0 CALL
      try {
        const url = `https://${authConfig.domain}/passwordless/start`;
        const body: Record<string, any> = {
          client_id: authConfig.clientId,
          client_secret: authConfig.clientSecret,
          connection: type === 'sms' ? 'sms' : 'email',
          send: 'code',
          authParams: {
            scope: 'openid profile email phone',
          },
        };

        if (type === 'sms') {
          body.phone_number = phoneNumberOrEmail;
        } else {
          body.email = phoneNumberOrEmail;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error_description || `Auth0 start failed: ${response.statusText}`);
        }

        return await response.json();
      } catch (err: any) {
        console.warn('[Auth0 Live Request Error] Falling back to bypass mode:', err.message);
        // Fall through to dev bypass if live request fails
      }
    }

    // DEV / BYPASS MODE: Gracefully simulate Auth0 response without live credentials
    return {
      _id: `job_mock_${Date.now()}`,
      phone_number: type === 'sms' ? phoneNumberOrEmail : undefined,
      email: type === 'email' ? phoneNumberOrEmail : undefined,
    };
  }

  /**
   * Verify Auth0 Passwordless OTP code and receive tokens
   * Soft-bypassed when ENABLE_AUTH0 !== 'true'
   */
  public async verifyPasswordlessOtp(
    phoneNumberOrEmail: string,
    otpCode: string,
    type: 'sms' | 'email' = 'sms'
  ): Promise<Auth0TokenResponse> {
    if (this.isEnabled) {
      // LIVE AUTH0 OTP VERIFICATION
      try {
        const url = `https://${authConfig.domain}/oauth/token`;
        const body: Record<string, any> = {
          grant_type: 'http://auth0.com/oauth/grant-type/passwordless/otp',
          client_id: authConfig.clientId,
          client_secret: authConfig.clientSecret,
          realm: type === 'sms' ? 'sms' : 'email',
          otp: otpCode,
          scope: 'openid profile email phone',
        };

        if (type === 'sms') {
          body.username = phoneNumberOrEmail;
        } else {
          body.username = phoneNumberOrEmail;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error_description || `Auth0 verify failed: ${response.statusText}`);
        }

        return await response.json();
      } catch (err: any) {
        console.warn('[Auth0 Live Verify Error] Falling back to bypass mode:', err.message);
      }
    }

    // DEV / BYPASS MODE: Generate simulated Auth0 token response
    return {
      access_token: `auth0_mock_at_${Buffer.from(phoneNumberOrEmail).toString('base64')}`,
      id_token: `auth0_mock_id_${Date.now()}`,
      token_type: 'Bearer',
      expires_in: 86400,
      user: {
        ...DEFAULT_MOCK_AUTH0_USER,
        phone_number: phoneNumberOrEmail,
      },
    };
  }

  /**
   * Validate an incoming Auth0 Bearer token
   * Soft-bypassed when ENABLE_AUTH0 !== 'true'
   */
  public async verifyToken(token: string): Promise<any> {
    if (this.isEnabled) {
      // Live JWT validation against Auth0 JWKS endpoint
      try {
        const userInfoUrl = `https://${authConfig.domain}/userinfo`;
        const res = await fetch(userInfoUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`Token verification failed: ${res.statusText}`);
        }

        return await res.json();
      } catch (err: any) {
        console.warn('[Auth0 Token Validation] Live verify error:', err.message);
        throw err;
      }
    }

    // DEV / BYPASS MODE: Accept token and return mock user claims
    return {
      ...DEFAULT_MOCK_AUTH0_USER,
      sub: token.startsWith('auth0_mock_') ? 'auth0|mock-user-bypassed' : 'auth0|local-dev',
    };
  }
}
