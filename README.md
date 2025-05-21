[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Lifecycle:Maturing](https://img.shields.io/badge/Lifecycle-Maturing-007EC6)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)

# BC Wallet Demo

## Overview

This application provides a showcase for the BC Wallet to illustrate the use cases for verifiable credentials. This application will take users through multiple steps to demonstrate how verifiable credentials are issued and verified using the BC Wallet.

## Running 
### Copy env files
For each of the apps under the apps/ directory, you'll need to create a .env file from the corresponding .env.example template. This ensures all environment variables are set up correctly before running the applications.

```
cp apps/bc-wallet-api-server/.env.example apps/bc-wallet-api-server/.env
cp apps/bc-wallet-demo-server/.env.example apps/bc-wallet-demo-server/.env
cp apps/bc-wallet-demo-web/.env.example apps/bc-wallet-demo-web/.env
cp apps/bc-wallet-showcase-creator/.env.example apps/bc-wallet-showcase-creator/.env
cp apps/bc-wallet-traction-adapter/.env.example apps/bc-wallet-traction-adapter/.env
```


>📌 Make sure to review each .env file after copying to update any required values based on your local or deployment environment.
  

### Option 1 - Native
Please make sure you have a recent version of node, npm, and pnpm installed
These steps are executed from the root folder of the project:
  
#### Install Dependencies
> pnpm install  

#### Generate Modals
> pnpm generate:models
  
#### Run the Project
> pnpm dev  
  
#### 🚀 Local Development URLs

After starting the apps, you can access them at the following local addresses:

- API Server: http://localhost:5005

- Demo Web: http://localhost:3000/digital-trust/showcase (container port 5002 → local port 3000)

- Demo Server: http://localhost:5000

- Showcase Creator: http://localhost:3050

- Traction Adapter: Runs on port 5001 (or other internal port; not exposed via browser)

### 🐳 Option 2 - Docker

You can run all apps using Docker. These steps assume that Docker and Docker Compose are installed on your machine.

```
docker compose up -d
```
This will build and start all services in detached mode.

To stop and remove all running containers and associated volumes, run:
```
docker compose down -v
```

>⚠️ Make sure your .env files are properly copied from docker/dev/.env.example 

## Contributing

**Pull requests are always welcome!**

Please see the [Contributions Guide](CONTRIBUTING.md) for the repo.

Before contributing please run `pnpm lint --fix` and fix any linter warnings in your code contribution.

You may also create an issue if you would like to suggest additional resources to include in this repository.
