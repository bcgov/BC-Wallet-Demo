# BC Wallet Demo Docker Development Environment

This guide provides instructions for setting up and running the BC Wallet Demo system locally using Docker.

## Table of Contents

1. [Overview](#overview)
2. [Components](#components)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
    - [Setting Up Environment Variables](#setting-up-environment-variables)
    - [Building and Starting Services](#building-and-starting-services)
5. [Accessing Services](#accessing-services)
6. [Configuration Options](#configuration-options)
    - [Port Configuration](#port-configuration)
    - [Database Configuration](#database-configuration)
    - [RabbitMQ Configuration](#rabbitmq-configuration)
    - [Authentication Configuration](#authentication-configuration)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting](#troubleshooting)

## Overview

The BC Wallet Demo system is a comprehensive digital credential showcase platform that consists of multiple microservices communicating via a message broker. This Docker setup allows you to run the entire system locally for development and testing purposes.


For more info on the devops setup there is [devops.md](../../resources/DEVOPS/devops.md) in the resources/DEVOPS folder in the root.

## Components

The system consists of the following components:

- **bc-wallet-api-server**: Core API service that manages credential data and business logic
- **bc-wallet-demo-server**: Demo API server that interfaces with Traction
- **bc-wallet-traction-adapter**: Adapter service that integrates with the Traction network
- **bc-wallet-showcase-creator**: Web application for creating and managing showcases
- **bc-wallet-demo-web**: Frontend web application for the demo experience
- **PostgreSQL**: Database for persistent storage
- **RabbitMQ**: Message broker for service communication

## Prerequisites

Before you begin, ensure you have the following installed:

- Docker and Docker Compose (latest version recommended)
- Git (to clone the repository)
- Bash shell (for running scripts)
- A text editor for modifying configuration files

## Installation

### Setting Up Environment Variables

1. Clone the repository and navigate to the docker development directory:

```bash
git clone https://github.com/bcgov/BC-Wallet-Demo.git
cd BC-Wallet-Demo/docker/dev
```

2. Create your environment file by copying the example:

```bash
cp .env.example .env
```

3. Edit the `.env` file with your desired configuration. At minimum, you'll need to set:

```
# Required environment variables
ENCRYPTION_KEY=your_32_byte_base58_encoded_key
TRACTION_DEFAULT_TENANT_ID=your_traction_tenant_id
TRACTION_DEFAULT_WALLET_ID=your_traction_wallet_id
TRACTION_DEFAULT_API_KEY=your_traction_api_key
TRACTION_API_URL=https://traction-api-url/tenant/
TRACTION_WEBHOOK_SECRET=your_webhook_secret

# Optional: OIDC configuration (if using authentication)
OIDC_REALM=your_realm
OIDC_CLIENT_ID=your_client_id
OIDC_CLIENT_SECRET=your_client_secret
OIDC_ISSUER_URL=https://your-keycloak-server/auth/realms/your_realm
```

### Building and Starting Services

Build and start all services using Docker Compose:

```bash
docker-compose up -d
```

This command will:
1. Build all service images from source code
2. Create necessary Docker networks
3. Start all containers in detached mode
4. Set up persistent volumes for data storage

To view logs from all services:

```bash
docker-compose logs -f
```

To view logs from a specific service:

```bash
docker-compose logs -f bc-wallet-api-server
```

## Accessing Services

Once the services are running, you can access them at the following default URLs:

- **Demo Web UI**: http://localhost:5002
- **Showcase Creator**: http://localhost:5003
- **Demo API Server**: http://localhost:5004
- **API Server**: http://localhost:5005
- **RabbitMQ Management**: http://localhost:15672 (default credentials: guest/guest)
- **PostgreSQL**: localhost:5232 (use a database client to connect)

## Configuration Options

### Port Configuration

You can customize the exposed ports by setting these variables in your `.env` file:

```
PORT_DEMO_WEB=5002           # BC Wallet Demo Web UI port
PORT_SHOWCASE_CREATOR=5003   # Showcase Creator UI port
PORT_DEMO_API=5004           # Demo API Server port
PORT_SHOWCASE_API=5005       # API Server port
RABBITMQ_EXPOSED_PORT=5672   # RabbitMQ main port
RABBITMQ_MGMT_EXPOSED_PORT=15672  # RabbitMQ management interface port
SHOWCASE_DB_EXPOSED_PORT=5232     # PostgreSQL exposed port (The default 5432 is often occupied by other Postgres instances)
```

### Database Configuration

Configure the PostgreSQL database with these variables:

```
SHOWCASE_DB_HOST=postgres
SHOWCASE_DB_PORT=5432
SHOWCASE_DB_USERNAME=postgres
SHOWCASE_DB_PASSWORD=your_secure_password
SHOWCASE_DB_NAME=postgres
```

### RabbitMQ Configuration

Configure RabbitMQ with these variables:

```
AMQ_HOST=rabbitmq
AMQ_PORT=5672
AMQ_USERNAME=guest
AMQ_PASSWORD=guest
AMQ_TRANSPORT=tcp
TRACTION_ADAPTER_MESSAGE_TOPIC=traction-adapter-messages
```

### Authentication Configuration

The system uses OpenID Connect (OIDC) for authentication with separate configurations for the root tenant and showcase creator:

#### Root Tenant Authentication
```
OIDC_ROOT_ISSUER_URL=https://auth-server/auth/realms/BC
OIDC_ROOT_CLIENT_ID=showcase-root
OIDC_ROOT_CLIENT_SECRET=your_keycloak_root_client_secret
```

#### Showcase Creator Authentication
OIDC_AUTH_URL=http://localhost:5003
OIDC_DEFAULT_TENANT=showcase-tenantA # optional, but tenant should be in URL when not set
OIDC_TRUST_HOST=true
NEXT_AUTH_SECRET=your_secure_secret

The `OIDC_DEFAULT_TENANT` setting is optional, but if not set, the tenant should be included in the URL. The `NEXT_AUTH_SECRET` is required for securing session cookies and tokens.


### Traction Configuration
These variables provide further configuration for the interaction with the Traction tenant, primarily used by the `bc-wallet-traction-adapter`.
```
TRACTION_API_URL=https://your-traction-host # Base URL for the Traction tenant API
TRACTION_WEBHOOK_SECRET=secret # Secret used to validate incoming webhooks from Traction
TRACTION_ADAPTER_MESSAGE_TOPIC=your_traction_topic # Optional: Custom topic name for RabbitMQ messages (default is traction-adapter-messages) 
```

#### Fixed tenant configuration (Note: intended to move to a dynamic tenant record later)
```
TRACTION_DEFAULT_TENANT_ID=your_traction_tenant_id # The specific Traction tenant ID to use
TRACTION_DEFAULT_WALLET_ID=your_traction_wallet_id # The specific Traction wallet ID within the tenant
TRACTION_DEFAULT_API_KEY=your_traction_api_key # API key for authenticating with the Traction tenant API
TRACTION_FIXED_SHOWCASE_API_URL=http://your-api-server:5005 # URL the traction adapter uses to reach the bc-wallet-api-server (must be reachable from the adapter's perspective)
```

### Shared Configuration Options
These settings are used by multiple services in the stack.

#### Logging
Configure the log output level for various services
```
LOG_LEVEL=debug # Logging level (e.g., info, debug, error) used by several backend services
```


#### CORS (Cross-Origin Resource Sharing)
Control how APIs respond to requests from different origins (e.g., the frontend web applications). These are primarily used by `bc-wallet-api-server` and `bc-wallet-demo-server`.
```
CORS_DISABLED=false # Set to true to disable CORS checks entirely (use with caution)
CORS_ALLOW_ORIGINS=* # Defines allowed origins (use specific domains in production, e.g., http://localhost:5002,http://localhost:5003)
CORS_ALLOW_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE # Allowed HTTP methods
CORS_ALLOW_HEADERS=* # Allowed request headers
CORS_ALLOW_CREDENTIALS=true # Whether to allow credentials (cookies, authorization headers)
```


## Development Workflow

1. **Making code changes**: Edit the source code in the appropriate application directory.
2. **Rebuilding services**: After making changes, rebuild and restart the affected service:
   ```bash
   docker-compose up -d --build bc-wallet-api-server
   ```
3. **Viewing logs**: Monitor service logs to debug issues:
   ```bash
   docker-compose logs -f bc-wallet-api-server
   ```
4. **Stopping services**: To stop all services without removing containers:
   ```bash
   docker-compose stop
   ```
5. **Cleaning up**: To stop and remove all containers, networks, and volumes:
   ```bash
   docker-compose down -v
   ```

## Troubleshooting

### Common Issues

1. **Services fail to start**:
    - Check container logs: `docker-compose logs [service-name]`
    - Verify environment variables are set correctly in `.env`
    - Ensure required ports are not already in use on your host machine

2. **Database connection issues**:
    - Verify PostgreSQL is running: `docker-compose ps postgres`
    - Check database credentials in `.env` match what's in `docker-compose.yml`
    - Try connecting manually: `docker exec -it bc-wallet-demo_postgres_1 psql -U postgres`

3. **RabbitMQ connection issues**:
    - Verify RabbitMQ is running: `docker-compose ps rabbitmq`
    - Check RabbitMQ management interface at http://localhost:15672
    - Verify credentials in `.env` match what's in `docker-compose.yml`

4. **Network connectivity between services**:
    - Ensure all Docker networks are created: `docker network ls`
    - Check that services are on the correct networks: `docker inspect [container_name]`

5. **Permission issues with volumes**:
    - Check volume permissions: `docker volume inspect postgres_data`
    - Try recreating volumes: `docker-compose down -v && docker-compose up -d`

### Resetting the Environment

If you need a fresh start:

```bash
# Stop all containers and remove volumes
docker-compose down -v

# Remove all built images
docker rmi $(docker images -q bc-wallet-*)

# Start from scratch
cp .env.example .env

# Edit .env with your configuration
docker-compose up -d
```
