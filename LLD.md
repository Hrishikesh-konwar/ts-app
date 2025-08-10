Low-Level Design (LLD) – Auth0 IAM with Custom IdP Integration


---

1. Overview

The IAM system uses Auth0 as the central identity broker that federates with multiple custom Identity Providers (IdPs) using SAML/OIDC protocols. Auth0 handles Universal Login, IdP federation, token issuance, session management, and provides JWT tokens for API authorization.


---

2. Tech Stack

Component	    Technology

Frontend App            >>>    Vite + React + Auth0 React SDK (@auth0/auth0-react)
Backend API             >>>    Node.js + Express.js
Identity Broker         >>>    Auth0 (Universal Login + Enterprise Connections)
Custom IdP Integration  >>>    SAML 2.0 / OIDC Enterprise Connections in Auth0
User Management	        >>>    Auth0 (user profiles, sessions, authentication)
Application Database    >>>    MongoDB (business data: groups, expenses, etc.)
Token Validation        >>>    Auth0 JWKS endpoint + jsonwebtoken library
API Authorization       >>>    JWT Bearer tokens (RS256 signature)
Certificate Management  >>>    SAML certificates for IdP trust relationships


---

3. Components and Responsibilities

  1. Frontend App (React + Auth0 SDK)
    Uses Auth0 React SDK for authentication.
    Calls loginWithRedirect({ connection: 'auth0_connection_name' }) for enterprise login.
    Automatically receives and stores JWT tokens.
    Sends Authorization: Bearer <access_token> in API requests.
    Handles logout via Auth0 SDK.

  2. Auth0 Universal Login
    Provides hosted login page with enterprise connection options.
    Handles SAML/OIDC federation with Custom IdPs.
    Issues signed JWT tokens (access_token, id_token).
    Manages user sessions and automatic token renewal.
    Provides JWKS endpoint for token validation.

  3. Auth0 Enterprise Connections
    SAML Connection: Federates with Custom IdP using SAML 2.0 protocol.
    OIDC Connection: Federates with Custom IdP using OpenID Connect.
    Validates SAML assertions and OIDC ID tokens from IdPs.
    Maps IdP attributes to Auth0 user profile.

  4. Custom IdP (Company IdPs)
    Handle employee authentication (username/password, MFA, etc.).
    Return signed SAML assertions or OIDC tokens to Auth0.
    Use SAML certificates for secure communication with Auth0.
    Implement SSO endpoints (/saml/sso, /oidc/authorize).

  5. Backend API (Node.js + Express)
    Validates JWT tokens using Auth0's JWKS endpoint.
    Extracts user information from validated JWT payload.
    Implements protected API endpoints with JWT middleware.
    Uses req.user populated by JWT validation middleware.

  6. Application Database (MongoDB)
    Stores business logic data ().
    Does NOT store user credentials or sessions (handled by Auth0).
    References users by Auth0 subject ID (sub claim) for data relationships.
    May store application-specific user preferences/settings only.

---

4. Detailed Flow (Auth0 Enterprise SAML)

  1. Login Initiation
    Frontend calls loginWithRedirect({ connection: 'acme-corp-saml' }).
    Auth0 SDK redirects to: https://YOUR_DOMAIN.auth0.com/authorize?
      client_id=YOUR_CLIENT_ID&
      redirect_uri=http://localhost:5173/callback&
      connection=acme-corp-saml&
      audience=https://splits-api

  2. Auth0 Enterprise Federation
    Auth0 identifies SAML connection for the request.
    Auth0 generates SAML AuthnRequest.
    Redirects user to Custom IdP SAML SSO endpoint.

  3. Authentication at Custom IdP
    Custom IdP presents company login page.
    Employee enters credentials (username/password/MFA).
    
    ** TWO-STEP PROCESS: **
    Step 1: Call login API to validate credentials (/api/authenticate)
    Step 2: Call endpoint or  to create response (/oidc/token or saml/generate-response )
    
    Custom IdP validates against company directory (AD/LDAP).
    Generates signed SAML Response with user attributes.

  4. SAML Response to Auth0
    Custom IdP POSTs SAML Response to Auth0 callback URL.
    Auth0 validates SAML signature using stored certificate.
    Auth0 extracts user attributes (email, name, groups).
    Auth0 creates/updates user profile.

  5. Token Generation
    Auth0 generates authorization code.
    Redirects to frontend callback with code.
    Auth0 SDK automatically exchanges code for tokens:
    {
      "access_token": "eyJhbGciOiJSUzI1NiIs...",
      "id_token": "eyJhbGciOiJSUzI1NiIs...",
      "token_type": "Bearer",
      "expires_in": 86400
    }

  6. API Access
    Frontend stores tokens in Auth0 SDK state.
    API calls include: Authorization: Bearer <access_token>
    Backend validates JWT using Auth0 JWKS endpoint.
    Backend extracts user info from JWT payload.

---

5. Database Schema Examples
Auth0 User Profile (Managed by Auth0)

{
  "sub": "saml|acme-corp-saml|john.doe@acmecorp.com",
  "email": "john.doe@acmecorp.com",
  "name": "John Doe",
  "groups": ["radiologist_admin"],
  "email_verified": true,
  "last_login": "2025-08-10T10:30:00Z"
}

JWT Token Structure (Issued by Auth0)
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "KEY_ID"
  },
  "payload": {
    "iss": "https://dev-xyz.us.auth0.com/",
    "sub": "saml|acme-corp-saml|john.doe@acmecorp.com",
    "aud": "https://splits-api",
    "iat": 1691576400,
    "exp": 1691662800,
    "azp": "YOUR_CLIENT_ID",
    "scope": "openid profile email"
  }
}

---

6. Security
  All communications use HTTPS/TLS 1.2+.
  Auth0 handles PKCE for SPA security.
  SAML assertions are signed and validated.
  JWT tokens use RS256 signature (Auth0 managed keys).
  Access tokens have configurable expiry (default 24h).
  Auth0 rotates signing keys automatically (JWKS endpoint).
  Custom IdP certificates must be securely managed and rotated.

---

7. Sequence Diagram (Auth0 Flow)
  1. Frontend App → Auth0 Universal Login (loginWithRedirect)
  2. Auth0 → Custom IdP SAML SSO (AuthnRequest)
  3. Custom IdP → Employee Authentication
  4. Custom IdP → Auth0 (SAML Response)
  5. Auth0 → Frontend (Authorization Code)
  6. Frontend → Auth0 (Token Exchange)
  7. Auth0 → Frontend (JWT Tokens)
  8. Frontend → Backend API (Bearer Token)
  9. Backend → Auth0 JWKS (Token Validation)
  10. Backend → Frontend (API Response)

  flowchart LR
    A[Frontend App] --> B[Auth0 Universal Login - loginWithRedirect]
    B --> C[Custom IdP SAML SSO - SAML AuthnRequest]
    C --> D[Employee Authentication]
    D --> E[Auth0 - SAML Response]
    E --> F[Frontend App - Authorization Code]
    F --> G[Auth0 - Token Exchange]
    G --> H[Frontend App - JWT Tokens]
    H --> I[Backend API - Bearer Token]
    I --> J[Auth0 JWKS - Token Validation]
    J --> K[Frontend App - API Response]


---

8. Key Differences from Custom IAM

✅ What Auth0 Handles:
  - OAuth/OIDC/SAML protocol implementations
  - Token signing and validation infrastructure
  - Session management and renewal
  - User profile storage and management
  - Security updates and compliance
  - Multi-factor authentication
  - Social login integrations

✅ Things to Build:
  - Custom Identity Provider (company login page)
  - Frontend application (React + Auth0 SDK)
  - Database for application data
  - SAML certificate generation and management
  - Backend Apis 
    1.  api/authenticate
    2.  oidc/token
    3.  saml/generate-response

✅ Benefits of Auth0 Architecture:
  - Reduced development time (no auth infrastructure)
  - Enterprise-grade security out of the box
  - Scalability and reliability (Auth0's infrastructure)
  - Compliance and audit features
  - Easy integration with multiple IdPs
  - Automatic security updates

---

Sample Frontend :

// Frontend login form submission
const response = await fetch('/api/authenticate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

if (response.ok) {
  // Redirect to SAML generation
  window.location.href = '/saml/generate-response';
}

------------------------

Sample Backend Apis :

app.post('/api/authenticate', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });   
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    req.session.authenticatedUser = user;
    res.json({ 
      success: true, 
      user: user
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

------------------------

app.get('/oidc/token', (req, res) => {
  const user = req.session.authenticatedUser;
  
  if (!user) {
    return res.redirect('/login?error=not_authenticated');
  }
  
  // Generate OIDC ID Token (JWT)
  const idToken = jwt.sign({
    sub: user.email,
    email: user.email,
    name: user.name,
    groups: user.groups,
    iss: 'https://login.acmecorp.com',
    aud: 'auth0-client-id'
  }, privateKey, { algorithm: 'RS256' });
  
  // Redirect back to Auth0 with code/token
  const auth0CallbackUrl = req.session.auth0CallbackUrl;
  res.redirect(`${auth0CallbackUrl}?code=${authorizationCode}&state=${state}`);
});

------------------------

// GET /saml/generate-response - Generate SAML response for Auth0
app.get('/saml/generate-response', (req, res) => {
  const user = req.session.authenticatedUser;
  
  if (!user) {
    return res.redirect('/login?error=not_authenticated');
  }
  try {    
    const samlResponse = Buffer.from(samlResponseXml).toString('base64');
    
    const auth0CallbackUrl = "https://YOUR_AUTH0_DOMAIN.auth0.com/login/callback";
    
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head><title>SAML Response</title></head>
      <body>
        <form method="POST" action="${auth0CallbackUrl}" id="samlForm">
          <input type="hidden" name="SAMLResponse" value="${samlResponse}">
        </form>
        <script>document.getElementById('samlForm').submit();</script>
      </body>
      </html>
    `;
    
    res.send(htmlResponse);
    
  } catch (error) {
    console.error('SAML generation error:', error);
    res.status(500).send('Error generating SAML response');
  }
});


Sample SAML :

    const samlResponseXml = `
      <samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
                      xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                      ID="_${generateId()}" 
                      Version="2.0" 
                      IssueInstant="${new Date().toISOString()}"
                      Destination="https://YOUR_AUTH0_DOMAIN.auth0.com/login/callback">
        
        <saml:Issuer>https://login.acmecorp.com</saml:Issuer>
        
        <samlp:Status>
          <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
        </samlp:Status>
        
        <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" 
                        ID="_${generateId()}" 
                        Version="2.0" 
                        IssueInstant="${new Date().toISOString()}">
          
          <saml:Issuer>https://login.acmecorp.com</saml:Issuer>
          
          <saml:Subject>
            <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">
              ${user.email}
            </saml:NameID>
          </saml:Subject>
          
          <saml:AttributeStatement>
            <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress">
              <saml:AttributeValue>${user.email}</saml:AttributeValue>
            </saml:Attribute>
            <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name">
              <saml:AttributeValue>${user.name}</saml:AttributeValue>
            </saml:Attribute>
          </saml:AttributeStatement>
          
        </saml:Assertion>
      </samlp:Response>
    `;


------------------------

//To get access token
const { getAccessTokenSilently  } = useAuth0();
const accessToken = await getAccessTokenSilently({ audience: 'https://splits-api' });
