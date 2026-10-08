import dotenv from 'dotenv';
dotenv.config();

export interface Auth0Config {
  enableAuth0: boolean;
  domain: string;
  clientId: string;
  clientSecret: string;
  audience: string;
}

export const authConfig: Auth0Config = {
  // Flag controls whether live Auth0 API calls/verification run, or bypass in dev mode
  enableAuth0: process.env.ENABLE_AUTH0 === 'true',
  domain: process.env.AUTH0_DOMAIN || 'demo.us.auth0.com',
  clientId: process.env.AUTH0_CLIENT_ID || 'mock_client_id_seyo',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || 'mock_client_secret_seyo',
  audience: process.env.AUTH0_AUDIENCE || 'https://api.seyo.io',
};

// Fallback mock customer user used when Auth0 is in muted/bypass mode
export const DEFAULT_MOCK_AUTH0_USER = {
  sub: 'auth0|mock-dev-customer-001',
  name: 'Dev Guest',
  email: 'dev@seyo.local',
  phone_number: '+15551234567',
  phone_number_verified: true,
  updated_at: new Date().toISOString(),
};
