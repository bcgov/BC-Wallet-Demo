# Credential Showcase OpenAPI

**Version:** 0.1.0  
**License:** Apache-2.0  
**Author:** 4Sure Technology Solutions Inc.

## 📝 Module Overview

The **Credential Showcase OpenAPI** describes the API endpoints and models that are shared between the **Interactive Digital Credential Showcase Builder**, the **Traction adapter**
and the **Demo wallet**, in a technology-agnostic way.

### 💡 Purpose

The API and its models are served by the **[bc-wallet-api-server](../../apps/bc-wallet-api-server)** as REST APIs. They are also imported in the Wallet and Showcase builder to have
shared models keeping the interfaces in sync to:

- Manage data related to a showcase, like persona's, scenarios, onboarding, credentials definitions and steps
- Acting as a shared store between creator and wallets
- Decouple the credential technology and wallet technology, future-proofing for multiple adapter implementations.

### ⚙️ Core Functionalities

- **API Contract:** Ensure the API Server, Traction adapter, Showcase Creator and Demo wallet can all talk in credential agnostic terms.
- **External integrations:** The OpenAPI file allows external developers to also hook into the API

## 📁 Project Structure

```
bc-wallet-openapi/
├── openapi/
│   └── openapi.yaml      # The OpenAPI/Swagger file for the models and endpoints
├── docs/
│   └── diagram.md        # The class diagram in mermaid form, exported as shown below
├── docs/                 # Documentation
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
├── pom.xml               # Maven/Java project descriptor needed to build the models
└── README.md             # This document
```

## 🛠️ Tech Stack

- **Language:** TypeScript, Java
- **Framework:** Maven

## 📦 Package Management

This project uses **pnpm** for package management and **java with maven** for model generation

### Install Dependencies

Make sure pnpm is installed first

````shell
npmg -g install pnpm
````

### Environment setup

Make sure following software is installed on your PC.

- [OpenJDK 17](https://jdk.java.net/java-se-ri/17).
- [Maven 3.8.1](https://maven.apache.org/download.cgi) or later.

### Generate API/Models

The following command will generate the models in `src/models`.

```
mvn -U clean install
```

**Profile id defaults to typescript-fetch-models and may be ignored at the moment**

### Using the models

The models will be generated in `src/models`, therefore, they may be imported into another submodule as a workspace dependency by:

adding the lines below to the respective files

###### package.json

```json
{
  "dependencies": {
    "bc-wallet-openapi": "workspace:*"
  }
}
```

###### tsconfig.json

```json
{
  "references": [
    {
      "path": "../bc-wallet-openapi"
    }
  ]
}
```

running the command below from the root project

```shell
pnpm install
```

And importing them as any other package

```typescript
import { Asset } from 'bc-wallet-openapi'

const asset: Asset = {}
```

---

## 📖 Documentation

More details on flows, data models, and API usage can be found in the main **Interactive Digital Credential Showcase Builder** documentation, including the proposed architecture
and design strategies for multi-tenant, multi-credential environments.

## 🏷️ License

This project is licensed under the **Apache-2.0** license.

