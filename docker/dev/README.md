# Credential Showcase Docker Build

This repository contains Docker configurations for the Credential Showcase system, which consists of an API server and a Traction adapter that communicate via RabbitMQ message broker.

## Components

- **bc-wallet-api-server**: Main API service that connects to PostgreSQL
- **bc-wallet-traction-adapter**: Adapter service that integrates with the Traction network
- **PostgreSQL**: Database for persistent storage
- **RabbitMQ**: Message broker for service communication

## Setup Instructions

### Prerequisites

- Docker and Docker Compose

### Configuration

1. Copy the example environment file to create your configuration:

```bash
cp .env.example .env
```

2. Modify the `.env` file with your desired configuration:

```
# Server Configuration
API_PORT=5002                   # Port for the API server

# Database Configuration
SHOWCASE_DB_HOST=postgres
SHOWCASE_DB_PORT=5232
SHOWCASE_DB_USERNAME=postgres
SHOWCASE_DB_PASSWORD=s3cH9KK1Lo0opzPo
SHOWCASE_DB_NAME=postgres

# RabbitMQ Configuration
AMQ_HOST=rabbitmq
AMQ_PORT=5672
RABBITMQ_MGMT_PORT=15672
AMQ_USERNAME=guest
AMQ_PASSWORD=guest
RABBITMQ_VHOST=/

# Application settings
LOG_LEVEL=info
```

## Building and Running

Build and start the services using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- The API server accessible on port defined in your `.env` file
- The Traction adapter service
- PostgreSQL database with persistent storage
- RabbitMQ with management interface

## Network Configuration

The system uses two isolated Docker networks:
- `messagebroker_net`: For RabbitMQ communication
- `db_net`: For database access

## Volumes

- `postgres_data`: Persistent volume for PostgreSQL data

## Pushing Images to Registry

### Prerequisites for Image Push

- Bash shell
- jq utility installed
- Access to the target Docker registry

### Push Process

To push the images to a Docker registry:

1. Ensure you have proper credentials and access to the registry
2. Run the push script:

```bash
./push.sh
```

The script:
- Checks that API server and Traction adapter versions match
- Tags images with the appropriate version number from package.json
- Pushes images to the configured registry (default: sphereonregistry.azurecr.io)

## Development Notes

- The Dockerfiles use a multi-stage build process for optimized image size
- The system uses pnpm for package management
- Environment variables control most aspects of the configuration

## Troubleshooting

- Check container logs: `docker-compose logs [service-name]`
- Verify network connectivity between services
- Ensure RabbitMQ credentials are correct
- Check PostgreSQL connection parameters
- If push script fails, verify your Docker registry credentials and connection