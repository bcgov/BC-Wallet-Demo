# Credential Showcase Traction Adapter

**Version:** 0.1.0  
**License:** Apache-2.0  
**Author:** 4Sure

## 📝 Module Overview

The **Credential Showcase Traction Adapter** bridges the **Interactive Digital Credential Showcase Builder** with **Traction/ACA-Py**, providing a scalable, asynchronous integration between technology-agnostic data models and credential-specific implementations.

### 💡 Purpose

- Translate data model actions (e.g., credential definitions, flows) into **Traction/ACA-Py** operations.
- Decouple the builder’s core REST API from credential technology details, future-proofing for multiple adapter implementations.

### ⚙️ Core Functionalities

- **Asynchronous Messaging:** Uses a message broker (e.g., RabbitMQ) to handle data exchange, improving fault tolerance.
- **Credential Definition Synchronization:** Converts scenario approvals in the Showcase Builder into the creation of credential definitions in Traction/ACA-Py.
- **Event-Driven Architecture:** Processes only the messages it can handle, simplifying horizontal scaling and maintainability.
- **Error Handling & Consistency:** Ensures durable message delivery and logs all failures for quick resolution.

### 🏆 Key Benefits

- **Flexibility:** Adapters can be swapped or extended to support different credential formats (e.g., SD-JWT, OID4VCI).
- **Scalability:** Asynchronous flow decouples the builder from real-time dependencies.
- **Resilience:** Durable messaging to handle temporary outages without data loss.

## 📁 Project Structure

```
bc-wallet-traction-adapter/
├── src/
│   └── index.ts          # Main entry point
├── __tests__/
│   └── rabbit-mq.test.ts # Temporary test for RabbitMQ
├── dist/                 # Compiled output
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## 🛠️ Tech Stack

- **Language:** TypeScript
- **Framework:** Express
- **Messaging:** rhea, rhea-promise
- **Dependency Injection:** typedi
- **Testing:** Jest, Testcontainers (@testcontainers/rabbitmq)

## 📦 Package Management

This project uses **pnpm** and **turbo** for monorepo and package management.

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

## 🔬 Advanced Topics

### Decoupling & Multiple Adapters

This adapter design enables multiple credential technologies by decoupling the core REST API from specific implementations. Messages describe high-level actions (like issuing or verifying), and this adapter listens for any it can handle (currently Traction/ACA-Py). Future adapters for different transport or credential formats could subscribe to the same broker with minimal changes.

### Synchronization

The adapter mostly handles one-way provisioning of scenarios and credential definitions into Traction/ACA-Py. If messages cannot be delivered or processed, the system logs the failures and retains the messages until they can be retried. Two-way sync is not yet in scope, but could be added later by incorporating callback messages into the builder’s REST API.

### Error Handling

Durable messaging ensures errors do not cause data loss. When the adapter encounters issues (e.g., invalid payloads or unavailable Traction APIs), it immediately throws errors and logs them for administrators. Because the process is asynchronous, the REST API remains responsive. Operators can replay messages or fix data if needed.

### Eventual Consistency

Since communication between the Showcase Builder and this adapter is asynchronous, the system is eventually consistent rather than transactionally consistent. Flows and credential definitions remain in a “pending” state until the adapter successfully updates the Traction/ACA-Py layer. We do not rely on XA transactions; instead, we rely on a robust queueing mechanism, clear error reporting, and possible replay of failed messages to ensure data eventually aligns across services.

---

## 📖 Documentation

More details on flows, data models, and API usage can be found in the main **Interactive Digital Credential Showcase Builder** documentation, including the proposed architecture and design strategies for multi-tenant, multi-credential environments.

## 🏷️ License

This project is licensed under the **Apache-2.0** license.
