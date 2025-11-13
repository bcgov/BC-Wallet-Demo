# BC Wallet Showcase - Architecture Overview

## Executive Summary

The **BC Wallet Showcase** is a multi-tenant platform that enables organizations to create interactive demonstrations of verifiable credential workflows. The system consists of two primary user experiences:

1. **Showcase Creator** - An authenticated web application where administrators build and manage credential showcases, personas, and scenarios
2. **Demo Wallet** - A public-facing web application where end users experience the credential issuance and verification workflows

The architecture follows a microservices pattern with technology-agnostic APIs, asynchronous credential processing via message broker, and pluggable adapters for different credential platforms (currently Hyperledger Aries/Traction).

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────┐      ┌──────────────────────────────┐    │
│  │  Showcase Creator (Next.js)  │      │   Demo Wallet Web (React)    │    │
│  │  Port: 3050 (5003)           │      │   Port: 3000 (5002)          │    │
│  ├──────────────────────────────┤      ├──────────────────────────────┤    │
│  │ • Next.js 15 + TypeScript    │      │ • React 18 + Redux Toolkit   │    │
│  │ • Shadcn/UI + Tailwind CSS   │      │ • Socket.IO Client           │    │
│  │ • Keycloak Authentication    │      │ • QR Code Generation         │    │
│  │ • i18n Support               │      │ • Framer Motion              │    │
│  │ • Zustand State Management   │      │ • React Router               │    │
│  │ • Drag & Drop (DnD Kit)      │      │ • Redux Persist              │    │
│  └──────────────┬───────────────┘      └──────────────┬───────────────┘    │
│                 │                                      │                     │
└─────────────────┼──────────────────────────────────────┼─────────────────────┘
                  │                                      │
                  │ HTTPS/REST                          │ HTTPS/REST + WebSocket
                  │                                      │
┌─────────────────┼──────────────────────────────────────┼─────────────────────┐
│                 │         APPLICATION LAYER            │                     │
├─────────────────┼──────────────────────────────────────┼─────────────────────┤
│                 ▼                                      ▼                     │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │              Showcase API Server (Express)                          │    │
│  │              Port: 5005                                             │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │ • RESTful API (routing-controllers)                                │    │
│  │ • Technology-Agnostic Data Model                                   │    │
│  │ • Multi-Tenant Support                                             │    │
│  │ • Keycloak Integration (root client)                               │    │
│  │ • TypeDI Dependency Injection                                      │    │
│  │ • Drizzle ORM                                                      │    │
│  │                                                                     │    │
│  │ Controllers:                                                        │    │
│  │ • ApprovalController       • PersonaController                     │    │
│  │ • AssetController          • PresentationScenarioController        │    │
│  │ • CredentialDefinitionCtrl • RelyingPartyController                │    │
│  │ • CredentialSchemaCtrl     • ShowcaseController                    │    │
│  │ • IssuanceScenarioCtrl     • TenantController                      │    │
│  │ • IssuerController         • JobStatusController                   │    │
│  └─────────────┬──────────────────────────────────────┬────────────────┘    │
│                │                                      │                     │
│                │ AMQP/RabbitMQ                        │                     │
│                │ (Async Messages)                     │ SQL Queries         │
│                │                                      │                     │
│                ▼                                      ▼                     │
│  ┌───────────────────────────┐          ┌──────────────────────────┐      │
│  │  Demo Server (Express)    │          │   PostgreSQL Database    │      │
│  │  Port: 5000 (5004)        │          │   Port: 5432             │      │
│  ├───────────────────────────┤          ├──────────────────────────┤      │
│  │ • Socket.IO Server        │          │ • Tenant Data            │      │
│  │ • Traction Webhooks       │          │ • Showcases              │      │
│  │ • CORS Enabled            │          │ • Scenarios              │      │
│  │ • TypeDI + Routing Ctrl   │          │ • Personas               │      │
│  │                           │          │ • Credential Schemas     │      │
│  └───────────┬───────────────┘          │ • Credential Definitions │      │
│              │                           │ • Issuers & Relying     │      │
│              │                           │   Parties                │      │
│              │                           │ • Approvals              │      │
│              │ Direct API Calls          │ • Assets                 │      │
│              │                           └──────────────────────────┘      │
│              ▼                                                              │
└──────────────┼──────────────────────────────────────────────────────────────┘
               │
┌──────────────┼──────────────────────────────────────────────────────────────┐
│              │           INTEGRATION LAYER                                  │
├──────────────┼──────────────────────────────────────────────────────────────┤
│              │                                                               │
│              ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │           Traction Adapter (Express)                              │      │
│  │           Port: 3000                                              │      │
│  ├──────────────────────────────────────────────────────────────────┤      │
│  │ • Event-Driven Architecture                                       │      │
│  │ • AMQP Consumer (rhea/rhea-promise)                              │      │
│  │ • Credential Technology Translation                               │      │
│  │ • Asynchronous Message Processing                                 │      │
│  │ • TypeDI Dependency Injection                                     │      │
│  │                                                                    │      │
│  │ Message Types:                                                     │      │
│  │ • CredentialDefinition.Create                                     │      │
│  │ • CredentialDefinition.Status                                     │      │
│  │ • Scenario.Approval                                               │      │
│  └─────────────┬────────────────────────────────────────────────────┘      │
│                │                                                             │
│                │ Consumes from Topic                                        │
│                ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │           RabbitMQ (Message Broker)                               │      │
│  │           Port: 5672 (AMQP), 15672 (Management UI)               │      │
│  ├──────────────────────────────────────────────────────────────────┤      │
│  │ • Topic: TRACTION_ADAPTER_MESSAGE_TOPIC                          │      │
│  │ • Durable Messaging                                               │      │
│  │ • Message Persistence                                             │      │
│  │ • Retry Logic                                                     │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       │ HTTPS API Calls
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────┐      ┌──────────────────────────────┐    │
│  │  Traction/ACA-Py             │      │   Keycloak (SSO)             │    │
│  │  (Hyperledger Aries)         │      │   Authentication Server      │    │
│  ├──────────────────────────────┤      ├──────────────────────────────┤    │
│  │ • Tenant Management          │      │ • IDIR Integration           │    │
│  │ • Wallet Management          │      │ • OIDC Protocol              │    │
│  │ • Credential Issuance        │      │ • Multi-Tenant Support       │    │
│  │ • Credential Verification    │      │ • Role-Based Access Control  │    │
│  │ • DIDComm Protocol           │      │ • Root Client                │    │
│  │ • Webhook Notifications      │      │ • Realm: BC                  │    │
│  └──────────────────────────────┘      └──────────────────────────────┘    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

---

## Feature Capabilities (Code-Based)

### **Showcase Creator Application**

**Route Structure:** `/:locale/:tenant/*` (protected routes require authentication)

**Key Features:**
- **Dashboard** (`/[tenant]/`) - Landing page with showcase overview
- **Showcase Management** (`/[tenant]/showcases`)
  - List all showcases for the tenant
  - Create new showcases (`/showcases/create`)
  - Edit existing showcases (`/showcases/[slug]`)
  - Multi-step wizard:
    - Onboarding (basic info, description, banner)
    - Characters/Personas management
    - Scenarios creation and ordering
    - Publish/Approval workflow
- **Credential Management** (`/[tenant]/credentials`)
  - Create/import credential schemas
  - Define credential definitions
  - Manage credential attributes
  - Approval workflow for credential definitions
- **Developer Tools** (`/[tenant]/developer`)
  - API documentation
  - Testing utilities
- **Download/Upload**
  - Export showcase as JSON file
  - Import showcase from JSON file
- **Asset Management**
  - Upload images for banners, icons
  - Stored as binary data in PostgreSQL

### **Demo Wallet Application**

**Route Structure:** `/[basePath]/[tenant]/*` (public access)

**User Flow:**
1. **Landing Page** (`/[tenant]/`) - Browse available showcases for tenant
2. **Onboarding Page** (`/[tenant]/:slug`) - Select persona for chosen showcase
3. **Dashboard** (`/[tenant]/:slug/:personaSlug/presentations`) - View available scenarios
4. **Use Case Page** (`/[tenant]/:slug/:personaSlug/presentations/:scenarioSlug`) - Interactive scenario execution

**Key Features:**
- **Connection Management**
  - Establish connection with Traction agent via QR code or deep link
  - Track connection state
  - Automatic garbage collection of expired connections
- **Credential Issuance**
  - Step-by-step flow defined in scenarios
  - Real-time updates via WebSocket
  - Support for multiple credential types (AnonCreds, W3C)
- **Credential Presentation**
  - Present credentials to relying parties
  - Selective disclosure support
  - Proof request handling
- **Mobile Integration**
  - QR code generation for BC Wallet mobile app
  - Deep linking support
  - App store redirects based on device type

### **API Capabilities**

**Base Routes:** `/:tenantId/*` (tenant-scoped endpoints)

**Showcase Management:**
- `GET /showcases` - List all showcases
- `GET /showcases/:slug` - Get showcase by slug
- `POST /showcases` - Create showcase (requires auth)
- `PUT /showcases/:slug` - Update showcase (requires auth)
- `DELETE /showcases/:slug` - Delete showcase (requires auth)

**Persona Management:**
- `GET /personas` - List personas
- `POST /personas` - Create persona (requires auth)
- `PUT /personas/:id` - Update persona (requires auth)
- `DELETE /personas/:id` - Delete persona (requires auth)

**Scenario Management:**
- `GET /scenarios/issuance` - List issuance scenarios
- `GET /scenarios/presentation` - List presentation scenarios
- `POST /scenarios/issuance` - Create issuance scenario (requires auth)
- `POST /scenarios/presentation` - Create presentation scenario (requires auth)
- `PUT /scenarios/:id` - Update scenario (requires auth)
- `DELETE /scenarios/:id` - Delete scenario (requires auth)

**Credential Schema/Definition:**
- `GET /credential-schemas` - List schemas
- `POST /credential-schemas` - Create/import schema (requires auth)
- `GET /credential-definitions` - List definitions
- `POST /credential-definitions` - Create definition (requires auth)
- `PUT /credential-definitions/:id` - Update definition (requires auth)

**Issuer/Relying Party:**
- `GET /roles/issuers` - List issuers
- `POST /roles/issuers` - Create issuer (requires auth)
- `GET /roles/relying-parties` - List relying parties
- `POST /roles/relying-parties` - Create relying party (requires auth)

**Asset Management:**
- `POST /assets` - Upload asset (requires auth)
- `GET /assets/:id` - Download asset

**Approval Workflow:**
- `GET /approvals` - List pending approvals
- `POST /approvals/:id/approve` - Approve credential definition (requires auth)

**Job Status:**
- `GET /job-status/:id` - Check async job status

**Tenant Management (Root Tenant Only):**
- `POST /tenants` - Create new tenant (root auth)
- `GET /tenants/:id` - Get tenant config

---

## Component Interactions

### 1. **Showcase Creation Flow**

```
User → Showcase Creator → Showcase API → PostgreSQL
                            ↓
                    (On Approval) → RabbitMQ → Traction Adapter → Traction/ACA-Py
                                                                    ↓
                                     PostgreSQL ← Showcase API ← (Callback/Status Update)
```

**Steps:**
1. User authenticates via Keycloak
2. User creates/edits showcases, scenarios, personas, and credential definitions in the **Showcase Creator**
3. **Showcase Creator** sends REST API calls to **Showcase API Server**
4. **Showcase API Server** persists data to **PostgreSQL**
5. When a credential definition is approved, **Showcase API** publishes a message to **RabbitMQ**
6. **Traction Adapter** consumes the message and translates it to **Traction/ACA-Py** API calls
7. **Traction Adapter** updates job status back to **Showcase API**

---

### 2. **Demo Wallet Flow**

```
User → Demo Wallet Web → Demo Server → Traction/ACA-Py
                      ↓
                  Showcase API → PostgreSQL
                      ↑
         (Real-time updates via WebSocket)
```

**Steps:**
1. User accesses **Demo Wallet Web** (React frontend)
2. **Demo Wallet Web** fetches showcases and scenarios from **Showcase API**
3. User interacts with a scenario (e.g., request credential)
4. **Demo Server** handles the credential issuance/verification via **Traction/ACA-Py**
5. **Demo Server** sends webhook notifications back to **Demo Wallet Web** via **Socket.IO**
6. Real-time updates displayed in the UI

---

### 3. **Authentication Flow**

```
User → Frontend (Creator/Wallet) → Keycloak (OIDC)
                                      ↓
                                  JWT Token
                                      ↓
                          Backend APIs (Validate Token)
```

**Steps:**
1. User initiates login from **Showcase Creator** or **Demo Wallet Web**
2. Frontend redirects to **Keycloak** for authentication (IDIR/OIDC)
3. **Keycloak** returns JWT token
4. Frontend includes token in API requests
5. **Showcase API Server** validates token with Keycloak
6. Access granted based on tenant and role

---

### 4. **Asynchronous Credential Processing**

```
Showcase API → RabbitMQ (Publish Message) → Traction Adapter
                                                ↓
                                          Traction/ACA-Py
                                                ↓
                                          Credential Created
                                                ↓
Showcase API ← (Status Update via API) ← Traction Adapter
```

**Benefits:**
- **Decoupling:** API server doesn't directly call Traction
- **Resilience:** Messages persist in RabbitMQ if adapter is down
- **Scalability:** Multiple adapter instances can consume messages
- **Technology Agnostic:** Easy to add adapters for other credential technologies (e.g., SD-JWT, W3C VC)

---

## Technology Stack

### **Frontend**

| Component | Technology | Key Libraries |
|-----------|-----------|---------------|
| **Showcase Creator** | Next.js 15, TypeScript | Shadcn/UI, Tailwind CSS, Zustand, React Hook Form, Zod, i18next, DnD Kit |
| **Demo Wallet Web** | React 18, TypeScript | Redux Toolkit, Framer Motion, Socket.IO Client, QR Code React |

### **Backend**

| Component | Technology | Key Libraries |
|-----------|-----------|---------------|
| **Showcase API Server** | Node.js, Express, TypeScript | routing-controllers, TypeDI, Drizzle ORM, rhea/rhea-promise |
| **Demo Server** | Node.js, Express, TypeScript | routing-controllers, TypeDI, Socket.IO, Axios |
| **Traction Adapter** | Node.js, Express, TypeScript | rhea/rhea-promise, TypeDI, Axios |

### **Infrastructure**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | PostgreSQL 16 | Data persistence |
| **Message Broker** | RabbitMQ 4 | Asynchronous messaging |
| **Authentication** | Keycloak | OIDC/IDIR authentication |
| **Credential Platform** | Traction/ACA-Py | Hyperledger Aries credential issuance/verification |
| **Orchestration** | Docker Compose, Kubernetes (Helm) | Container orchestration |

---

## Network Architecture

The system uses isolated Docker networks for security:

```
┌──────────────────────────────────────────────────────────────────┐
│                         public_net                                │
│  • Showcase Creator                                              │
│  • Demo Wallet Web                                               │
│  • Demo Server                                                   │
│  • Showcase API Server                                           │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       messagebroker_net                           │
│  • Showcase API Server                                           │
│  • Traction Adapter                                              │
│  • RabbitMQ                                                      │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                          api_net                                  │
│  • Showcase API Server                                           │
│  • Traction Adapter                                              │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                          db_net                                   │
│  • Showcase API Server                                           │
│  • PostgreSQL                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Model Overview

### **Core Entities** (From Database Schema)

```
Tenant (tenants table)
  ├── id: text (primary key, used as Keycloak client ID)
  ├── tenantType: enum (STANDARD, ROOT)
  ├── oidcIssuer: text (Keycloak issuer URL)
  ├── tractionTenantId: uuid
  ├── tractionWalletId: uuid
  ├── tractionApiUrl: text
  ├── tractionApiKey: text (encrypted)
  └── Relations:
      ├── showcases (1-to-many)
      ├── users (many-to-many via tenantsToUsers)
      ├── issuers (1-to-many)
      └── relyingParties (1-to-many)

Showcase (showcase table)
  ├── id: uuid
  ├── tenantId: text (FK to tenant)
  ├── name: text
  ├── slug: text (unique per tenant)
  ├── description: text
  ├── completionMessage: text
  ├── status: enum (DRAFT, PUBLISHED)
  ├── hidden: boolean
  ├── bannerImage: uuid (FK to asset)
  ├── approvedBy/approvedAt: audit fields
  └── Relations:
      ├── scenarios (many-to-many via showcasesToScenarios)
      ├── personas (many-to-many via showcasesToPersonas)
      └── credentialDefinitions (many-to-many via showcasesToCredentialDefinitions)

Scenario (scenario table)
  ├── id: uuid
  ├── name: text
  ├── slug: text (unique)
  ├── description: text
  ├── scenarioType: enum (ISSUANCE, PRESENTATION)
  ├── issuer: uuid (FK, for ISSUANCE type)
  ├── relyingParty: uuid (FK, for PRESENTATION type)
  ├── hidden: boolean
  ├── bannerImage: uuid (FK to asset)
  └── Relations:
      ├── steps (1-to-many) - ordered workflow steps
      └── personas (many-to-many via scenariosToPersonas)

Step (step table)
  ├── id: uuid
  ├── scenarioId: uuid (FK to scenario)
  ├── order: integer
  ├── stepType: enum (INFORMATION, ACTION)
  ├── stepAction: enum (OFFER_CREDENTIAL, REQUEST_PROOF, etc.)
  ├── content: text
  ├── buttonLabel: text
  └── Relations:
      └── scenario (many-to-one)

Persona (persona table)
  ├── id: uuid
  ├── name: text
  ├── slug: text (unique)
  ├── role: text (e.g., "Student", "Employer")
  ├── description: text
  ├── icon: uuid (FK to asset)
  └── Relations:
      ├── scenarios (many-to-many)
      └── showcases (many-to-many)

CredentialSchema (credentialSchema table)
  ├── id: uuid
  ├── tenantId: text (FK to tenant)
  ├── name: text
  ├── version: text
  ├── identifier: text (schema ID on ledger)
  ├── identifierType: enum (DID, SCHEMA_ID)
  └── Relations:
      ├── attributes (1-to-many credentialAttribute)
      └── credentialDefinitions (1-to-many)

CredentialDefinition (credentialDefinition table)
  ├── id: uuid
  ├── tenantId: text (FK to tenant)
  ├── name: text
  ├── version: text
  ├── identifier: text (cred def ID on ledger)
  ├── identifierType: enum (DID, CRED_DEF_ID)
  ├── credentialSchema: uuid (FK to credentialSchema)
  ├── type: enum (ANONCREDS, W3C)
  ├── source: enum (CREATED, IMPORTED)
  ├── icon: uuid (FK to asset)
  ├── approvedBy/approvedAt: audit fields
  └── Relations:
      ├── credentialSchema (many-to-one)
      ├── showcases (many-to-many)
      ├── issuers (many-to-many via issuersToCredentialDefinitions)
      ├── relyingParties (many-to-many via relyingPartiesToCredentialDefinitions)
      └── revocationInfo (1-to-1)

Issuer (issuer table)
  ├── id: uuid
  ├── tenantId: text (FK to tenant)
  ├── name: text
  ├── issuerType: enum (ORGANIZATION, GOVERNMENT, INDIVIDUAL)
  ├── icon: uuid (FK to asset)
  └── Relations:
      ├── credentialDefinitions (many-to-many)
      └── scenarios (1-to-many, for ISSUANCE scenarios)

RelyingParty (relyingParty table)
  ├── id: uuid
  ├── tenantId: text (FK to tenant)
  ├── name: text
  ├── relyingPartyType: enum (EMPLOYER, SERVICE_PROVIDER, etc.)
  ├── icon: uuid (FK to asset)
  └── Relations:
      ├── credentialDefinitions (many-to-many)
      └── scenarios (1-to-many, for PRESENTATION scenarios)

User (user table)
  ├── id: uuid
  ├── username: text (from Keycloak preferred_username)
  └── Relations:
      └── tenants (many-to-many via tenantsToUsers)

Asset (asset table)
  ├── id: uuid
  ├── filename: text
  ├── mimetype: text
  ├── data: bytea (binary image data)
  └── createdAt: timestamp

JobStatus (jobStatus table)
  ├── id: uuid
  ├── jobType: enum (CREDENTIAL_DEFINITION_CREATION, etc.)
  ├── status: enum (PENDING, IN_PROGRESS, COMPLETED, FAILED)
  ├── entityId: uuid (reference to related entity)
  ├── entityType: enum (CREDENTIAL_DEFINITION, etc.)
  ├── errorMessage: text
  └── audit timestamps
```

### **Key Relationships and Constraints**

- **Tenant Isolation:** All major entities have `tenantId` foreign key with cascade delete
- **Unique Slugs:** Showcases have unique slugs per tenant; scenarios and personas have globally unique slugs
- **Scenario Types:** Database constraint ensures ISSUANCE scenarios have an issuer, PRESENTATION scenarios have a relyingParty
- **Approval Workflow:** Showcases and CredentialDefinitions track approval status with `approvedBy` and `approvedAt` fields
- **Asset Management:** Images stored as binary data in database with MIME type tracking

---

## Security Features

### **Multi-Tenancy**

- Tenant isolation at the database level
- Tenant-specific authentication via Keycloak realms
- API-level tenant validation

### **Authentication & Authorization**

- **Keycloak OIDC** integration
- **IDIR** support for BC Government employees
- **Role-Based Access Control (RBAC):**
  - **Admin role required** for Showcase Creator access (realm or client-specific)
  - Roles extracted from JWT token (`realm_access.roles` and `resource_access[client].roles`)
  - Middleware enforces role checks on all protected routes
  - Extensible design for future roles (editor, viewer, approver)
- **Access model:**
  - **Authenticated users with admin role:** Full write/edit/delete access to showcases within their tenant
  - **Authenticated users without admin role:** Redirected to unauthorized page
  - **Unauthenticated users:** Redirected to login page or read-only Demo Wallet access
- JWT token validation and introspection
- Tenant-level access control (users authenticated in one tenant cannot access another tenant's data)

### **Network Security**
- Isolated Docker networks
- Internal services not exposed to public network
- CORS configuration for allowed origins

### **Data Protection**
- Encrypted sensitive credentials (Traction API keys)
- Environment-based configuration
- Secret management via Kubernetes secrets

---

## Deployment Architecture

### **Development (Docker Compose)**
- All services run as Docker containers
- Shared volumes for data persistence
- Port mapping for local access
- Hot-reload for development

### **Production (Kubernetes + Helm)**
- Helm charts for deployment (`charts/bc-wallet/`)
- ConfigMaps for configuration
- Secrets for sensitive data
- Service accounts with RBAC
- Horizontal Pod Autoscaling (HPA) support
- Ingress for external access

### **CI/CD (GitHub Actions)**
- Build Docker images on PR
- Run tests and linters
- Push to GitHub Container Registry (ghcr.io)
- Deploy to OpenShift (Kubernetes)
- Trivy security scanning

---

## Key Design Patterns

### **1. Hexagonal Architecture (Ports & Adapters)**
- **Core:** Showcase API (technology-agnostic)
- **Adapters:** Traction Adapter (Hyperledger Aries), Future: SD-JWT Adapter, W3C VC Adapter

### **2. Event-Driven Architecture**
- Asynchronous messaging via RabbitMQ
- Loose coupling between API and credential platforms
- Retry and error handling

### **3. Repository Pattern**
- Drizzle ORM abstracts database operations
- Easy to switch databases (currently PostgreSQL)

### **4. Dependency Injection**
- TypeDI for IoC container
- Easier testing and maintainability

### **5. API-First Design**
- OpenAPI specifications (`packages/bc-wallet-openapi/`)
- Auto-generated clients for frontend

---

## Scalability Considerations

### **Horizontal Scaling**
- Stateless services (API, adapter, demo server)
- RabbitMQ message distribution across adapter instances
- PostgreSQL read replicas for read-heavy workloads

### **Vertical Scaling**
- Resource limits/requests in Kubernetes
- Database connection pooling

### **Caching**
- Axios cache interceptor in frontend
- Redis (future) for API response caching

---

## Future Enhancements

### **Multi-Credential Format Support**
- SD-JWT (Selective Disclosure JWT)
- W3C Verifiable Credentials
- mDL (mobile Driver's License)

### **Advanced Features**
- Workspace collaboration with approval workflows
- Public showcase marketplace
- Cross-tenant scenario sharing
- Advanced analytics and monitoring

### **Performance**
- Redis caching layer
- GraphQL API (alternative to REST)
- CDN for static assets

### **Testing**
- E2E tests with Cypress
- Load testing with k6
- Contract testing with Pact

---

## Monitoring & Observability

### **Logging**
- **Pino** for structured logging
- Centralized log aggregation (future: ELK stack)

### **Metrics**
- Application metrics (future: Prometheus)
- Business metrics (showcases created, credentials issued)

### **Tracing**
- Distributed tracing (future: OpenTelemetry)

### **Uptime Monitoring**
- Health check endpoints
- Kubernetes liveness/readiness probes

---

## Conclusion

The BC Wallet Showcase is a well-architected platform for demonstrating verifiable credential workflows. Through code analysis, the following architectural strengths are evident:

**Core Architecture:**
- **Technology-agnostic API layer** with Drizzle ORM and PostgreSQL for flexible data management
- **Event-driven integration** via RabbitMQ enables resilient, asynchronous credential operations
- **Multi-tenant design** with complete data isolation and per-tenant Keycloak authentication
- **Pluggable adapter pattern** currently supporting Hyperledger Aries/Traction, extensible to other platforms

**User Experience:**
- **Showcase Creator**: Modern Next.js 15 application with intuitive wizard-based UI for non-technical users
- **Demo Wallet**: React-based public interface with real-time WebSocket updates and mobile integration
- **Download/Upload**: JSON-based showcase portability for easy sharing and version control

**Developer Experience:**
- **TypeScript throughout** with comprehensive type safety
- **OpenAPI-first** with generated client libraries
- **Dependency injection** via TypeDI for maintainable services
- **Docker Compose** for streamlined local development

**Production Ready:**
- **Kubernetes/Helm** deployment with full cloud-native support
- **Job status tracking** for async operations visibility
- **Comprehensive logging** with request correlation
- **Health checks** and readiness probes
- **CI/CD pipeline** with automated testing and security scanning

The system successfully balances ease of use for content creators with technical robustness for production deployments, making it an effective platform for organizations to demonstrate and educate stakeholders about verifiable credentials technology.

---

**Document Version:** 1.1 (Code-Based Analysis)  
**Last Updated:** November 12, 2025  
**Analysis Method:** Direct code review of implementation  
**Maintained by:** BC Government Digital Trust Team
