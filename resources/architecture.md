# System Architecture

 
# Components


UI Architecture
There were errors rendering macro:
•	An unknown error occurred.
1. Tenant Management
The system follows a multi-tenant architecture where each organization (Tenant) operates as an isolated entity.
•	Tenant Components:
o	Unique organizational space:. ex. issuer.domain.com or domain.com/issuer
o	User management system
o	Scenario management capabilities
There were errors rendering macro:
•	An unknown error occurred.
2. User Role System
A hierarchical role-based access control (RBAC) system manages user permissions:
•	Role Types:
o	Admin: Full system access and management capabilities
o	Editor: Can create and modify scenarios
o	User: Basic access with limited permissions, mainly READ permissions
3. Scenario Management
check Data model Scenarios
Scenarios are the core content units within the system:
•	Scenario Features:
o	Local saving capability (download and upload)
o	Publishing workflow using the API
o	Cloning/transfer functionality between tenants (future)
4. Workspace Integration
Workspaces serve as collaborative environments for scenario management:
•	Workflow:
o	Scenario creation and modification
o	Approval process for publishing (if time permits)
o	Integration with public version system (future)


5. Data Flow
There were errors rendering macro:
•	An unknown error occurred.
Key Components:
•	Authentication Module: Handles IDIR authentication with Keycloak via the SSO Pathfinder service
•	Showcase Editor: Core editing interface for scenario creation
•	Preview Mode: Real-time preview of showcase scenarios
•	Asset Manager: Handles image and resource management
OCA Integration
Keycloak integration
X. Changes on the code structure:
Frontend:
•	Next.js 15 (TypeScript) - React framework
•	Tailwind CSS - Utility-first styling
•	Shadcn/UI - Component library and design system
•	Theme provider with dark mode support
Validation & Security
•	Zod validation: Essential for showcase data integrity
•	Secure state management with Zustand
Testing & Quality
•	Jest testing suite: Required for production readiness
•	Pino logging: Supports uptime monitoring requirement
•	i18n support: Enables future localization
Other changes
•	Migrated from CRA to Next.js
•	Next.js convention-based routing
•	Removed legacy React structure
•	Updated dependencies
•	Zustand micro-stores for state
•	Internationalized routing
•	Component-driven architecture
Deployment
There were errors rendering macro:
•	An unknown error occurred.
6. Security Considerations
•	Key Security Features:
o	Tenant isolation
o	Role-based access control
o	Approval workflows
o	Secure scenario transfer mechanisms
7. System Integration Points
The architecture supports several integration points:
•	Integration Capabilities:
o	Inter-tenant scenario sharing
o	Workspace collaboration features
o	Public version management
Potential blockers?
•	
Action Items
