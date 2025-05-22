# BC Wallet Showcase Demo

## Overview

This application provides a showcase for the BC Wallet to illustrate the use cases for verifiable credentials. This application will take users through multiple steps to demonstrate how verifiable credentials are issued and verified using the BC Wallet.

## Running
### Copy env files
Copy the files server/.env.example  and client/.env.example to server/.env  and client/.env  
Edit the .env files to match your project needs


### Option 1 - Native
Please make sure you have a recent version of node, npm, and pnpm installed
These steps are executed from the root folder of the project:

> pnpm install

> pnpm dev

The application will now be running at  http://localhost:5002/digital-trust/showcase

### Option 2 - Docker
> These steps assume that you have docker installed


Build the demo wallet:

>These steps are executed from the apps/bc-wallet-demo-web folder of the project:

```bash
docker compose up -d bc-wallet-demo-web
```

Build the demo server:

>These steps are executed from the apps/bc-wallet-demo-server folder of the project:

```bash
docker compose up -d bc-wallet-demo-server
```

## Contributing

**Pull requests are always welcome!**

Please see the [Contributions Guide](CONTRIBUTING.md) for the repo.

Before contributing please run `pnpm lint --fix` and fix any linter warnings in your code contribution.

You may also create an issue if you would like to suggest additional resources to include in this repository.

All contributions to this repository should adhere to our [Code of Conduct](./CODE_OF_CONDUCT).