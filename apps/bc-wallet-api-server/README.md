# bc-wallet-api-server

## Environment variables

Please see [.env.example](.env.example) for a list and explanation of all the environment variables.

## Database

There are several environment variables for connecting to a postgres database. A connection url can be used or individual options can be set to connect.
If a connection url is set than this will be favored.

> **_NOTE:_** Currently only PostgreSQL support is available

### Migrations

We generate database migrations using [Drizzle kit](https://orm.drizzle.team/docs/kit-overview), which manages and versions database schema changes. These can be found at `./src/database/migrations`.

#### Generate migrations

Migrations can be generated using the following command

```shell
pnpm migration:generate
```

## Installation

```shell
pnpm install bc-wallet-api-server
```

## Build

```shell
pnpm build
```
