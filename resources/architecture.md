# System Architecture

 
# Components


UI Architecture

1. Tenant Management
The system follows a multi-tenant architecture where each organization (Tenant) operates as an isolated entity.
- 	Tenant Components:
- 	Unique organizational space:. ex. issuer.domain.com or domain.com/issuer
- 	User management system
- 	Scenario management capabilities

2. User Role System
A hierarchical role-based access control (RBAC) system manages user permissions:
-	Role Types:
-	Admin: Full system access and management capabilities
-	Editor: Can create and modify scenarios
-	User: Basic access with limited permissions, mainly READ permissions

3. Scenario Management
check Data model Scenarios
Scenarios are the core content units within the system:
- Scenario Features:
- Local saving capability (download and upload)
- Publishing workflow using the API
- Cloning/transfer functionality between tenants (future)

4. Workspace Integration
Workspaces serve as collaborative environments for scenario management:
- Workflow:
- Scenario creation and modification
- Approval process for publishing (if time permits)
- Integration with public version system (future)

5. Data Flow

Key Components:
- Authentication Module: Handles IDIR authentication with Keycloak via the SSO Pathfinder service
- Showcase Editor: Core editing interface for scenario creation
- Preview Mode: Real-time preview of showcase scenarios
- Asset Manager: Handles image and resource management

6. Keycloak integration
- Integrated keycloak for authentication

7.  Changes on the code structure:
Frontend:
- Next.js 15 (TypeScript) - React framework
- Tailwind CSS - Utility-first styling
- Shadcn/UI - Component library and design system
- Theme provider with dark mode support
Validation & Security
- Zod validation: Essential for showcase data integrity
- Secure state management with Zustand
Testing & Quality
- Jest testing suite: Required for production readiness
- Pino logging: Supports uptime monitoring requirement
- i18n support: Enables future localization
Other changes
- Migrated from CRA to Next.js
- Next.js convention-based routing
- Removed legacy React structure
- Updated dependencies
- Zustand micro-stores for state
- Internationalized routing
- Component-driven architecture deployment


8. Security Considerations
Key Security Features:
- Tenant isolation
- Role-based access control
- Approval workflows
- Secure scenario transfer mechanisms

9. System Integration Points
The architecture supports several integration points:
- Integration Capabilities:
- Inter-tenant scenario sharing
- Workspace collaboration features
- Public version management

