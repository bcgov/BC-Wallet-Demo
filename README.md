[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Lifecycle:Maturing](https://img.shields.io/badge/Lifecycle-Maturing-007EC6)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)

# BC Wallet Showcase

**Version:** 0.1.0  
**License:** Apache-2.0

## 📝 Module Overview

The **Wallet Showcase** project bring an **Interactive Digital Credential Showcase Builder** allowing less technically inclined people to create showcases and demo scenarios with
verifiable credentials. The showcases then are automatically made available on a **Demo wallet** that can be used to run the scenario's. It serves as a tool to quickly create
demo's showing the power of verifiable credential technology in different use cases.

### 💡 Purpose

- Easily create demo's for different use cases of Verifiable Credentials.
- Allow experimentation and rapid setup for people new to Verifiable Credential technology.

### ⚙️ Core Functionalities

- **Showcase Builder:** An Interactive User Interface to build showcases containing personas, scenarios and steps, as well as creating credential definitions, without the need of
  much technical knowledge.
- **Demo Wallet:** The Demo wallet acts as the Issuer and Relying party frontend, showing the showcases, personas, scenarios and steps. This is what an end-user will see after
  showcases have been created by the Showcase builder.
- **Showcase API** The Showcase API is a REST API that serves as the technology neutral data storage between different components, of which the wallet and builder are the most
  noticeable components. The API is credential technology neutral. It has no direct integrations with any credential platform/library.
- **Traction Adapter** This is an adapter that translates the neutral API into AcaPY/Traction specific credential actions. It serves is the first of potentially many different
  integrations points with future credential technologies.

### 🏆 Key Benefits
- **Easy of use:** The showcase builder is designed to be used by less technically inclined users, allowing them to experiment with different showcases
- **Rapid prototyping:** The showcase builder allows you to rapidly create an entire new showcase, or add new scenarios to existing showcases. This allows for rapid experimentation and customization
- **Multi-tenant:** The showcase builder, API and wallet are designed as multi-tenant solutions, allowing to make the tool available to different departments, or even external customers
- **Flexibility:** Adapters can be swapped or extended to support different credential formats (e.g., SD-JWT, OID4VCI) and wallets in the future.
- **Resilience:** Durable messaging to handle temporary outages without data loss.

## 📁 Project Structure

```
apps/
├── bc-wallet-api-server/        # This is the Showcase REST API providing the credential agnostic data model
├── bc-wallet-demo-server/       # The server/backend of the web wallet delegating to AcaPy and Traction
├── bc-wallet-demo-web/          # The frontend of the web wallet showing the actual showcases, personas and scenarios
├── bc-wallet-showcase-creator/  # The frontend to design and manage showcases, scenarios, credential definitions and personas
charts/                          # Helm charts for deployment to Kubernetes
packages/
├── bc-wallet-openapi/           # The Showcase OpenAPI definition for the REST API and models
├── bc-wallet-traction-adapter   # The AcaPY/Traction integration (asynchronous using a message broker)
resources/                       # Documentation resources
├── DEVELOPER                    # Developer docs
├── DEVOPS/                      # DevOps docs
└── README.md                    # Project documentation (this file)
```
## 📦 Package Management

This project uses **pnpm** and **turbo** for monorepo and package management.

### Make sure pnpm is installed

````shell
npm -g install pnpm
````

### Install Dependencies

```bash
pnpm install
```

### Build the Project

```bash
pnpm build
```

### Run Tests

```bash
pnpm test
```

For CI/CD pipelines:

```bash
pnpm test:ci
```

### Start the Project

```bash
pnpm start
```

## 🧪 Testing

A temporary test for RabbitMQ is located at:

```
packages/bc-wallet-traction-adapter/src/__tests__/rabbit-mq.test.ts
```

We use **Jest** with **Testcontainers** to spin up RabbitMQ containers.

---

## 🏷️ License

This project is licensed under the **Apache-2.0** license.


## Contributing

**Pull requests are always welcome!**

Please see the [Contributions Guide](CONTRIBUTING.md) for the repo.

Before contributing please run `yarn lint --fix` and fix any linter warnings in your code contribution.

You may also create an issue if you would like to suggest additional resources to include in this repository.

All contrbutions to this repository should adhere to our [Code of Conduct](./CODE_OF_CONDUCT).