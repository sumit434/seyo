# SEYO — Authentication & Auth0 Abstraction Layer

## 1. Architectural Strategy

Customer authentication in SEYO is structured behind an abstraction layer (`useAuthMode` on the client, `CustomerAuthService` and `customerAuthMiddleware` on the backend).

This design ensures:
1. **Zero Vendor Lock-In:** The underlying identity provider (Auth0 Passwordless, Twilio Verify, or custom inline OTP) can be toggled without rewriting the customer journey, wheel UI, or loyalty trackers.
2. **Frictionless Development with Soft-Bypass:** In local development and automated testing, live Auth0 API calls and token verification checks can be muted or bypassed gracefully without deleting code or failing builds.
3. **Preserved Production Structures:** All Auth0 service classes, endpoints, and types remain 100% intact in the repository.

---

## 2. Configuration & Activation

Control Auth0 live verification using the single environment variable in `.env`:

```env
# Set to "true" to activate live Auth0 calls against your tenant
# Defaults to "false" (muted/bypass mode) for effortless local testing
ENABLE_AUTH0="false"

AUTH0_DOMAIN="your-tenant.us.auth0.com"
AUTH0_CLIENT_ID="your_auth0_client_id"
AUTH0_CLIENT_SECRET="your_auth0_client_secret"
AUTH0_AUDIENCE="https://api.seyo.io"
```

---

## 3. Bypass & Mute Mechanism

### Backend Middleware (`customerAuthMiddleware.ts`)
* **When `ENABLE_AUTH0 === 'true'`:**
  - Extracts Bearer JWT from `Authorization` header.
  - Queries Auth0 `/userinfo` / JWKS for signature and claim validation.
  - Attaches validated `req.auth0User` or returns `401 AUTH0_INVALID_TOKEN`.
* **When `ENABLE_AUTH0 !== 'true'` (Soft-Bypass Mode):**
  - Gracefully accepts requests even if tokens are mock or omitted.
  - Automatically attaches `DEFAULT_MOCK_AUTH0_USER`:
    ```json
    {
      "sub": "auth0|mock-dev-customer-001",
      "name": "Dev Guest",
      "email": "dev@seyo.local",
      "phone_number": "+15551234567"
    }
    ```
  - Execution continues unimpeded.

### Passwordless Service (`auth0Service.ts`)
* Calls to `startPasswordless()` and `verifyPasswordlessOtp()` are wrapped in conditional blocks:
  ```ts
  if (authConfig.enableAuth0) {
    // Live call to https://{domain}/passwordless/start or /oauth/token
  } else {
    // Soft-bypass: Simulated job and mock token generation
  }
  ```

---

## 4. Frontend Abstraction (`useAuthMode.ts`)

The client components interact with customer authentication through the hook:

```tsx
import { useAuthMode } from '../hooks/useAuthMode';

export const MyComponent = () => {
  const { sendOtp, verifyOtp, quickMockLogin, isAuth0Bypassed } = useAuthMode();
  // ...
};
```
