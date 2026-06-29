import type { Credential } from '../content/types'
import type { AxiosRequestConfig, AxiosError } from 'axios'

import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

import credentialsSeed from '../../migrations/values/credentials.json'
import { CredentialModel } from '../db/models/Credential'
import { DidModel } from '../db/models/Did'
import { SchemaModel } from '../db/models/Schema'

import logger from './logger'

const safeAxiosError = (err: unknown) => {
  const e = err as AxiosError
  return {
    message: e.message,
    status: e.response?.status,
    url: e.config?.url,
  }
}

const olderThanHours = (dateStr: string, hours: number) =>
  (Date.now() - new Date(dateStr).getTime()) / 3_600_000 >= hours

const retryWithExponentialBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000,
): Promise<T> => {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt)
        logger.warn(
          { attempt: attempt + 1, maxRetries, delayMs, error: lastError.message },
          'Operation failed, retrying with exponential backoff',
        )
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError || new Error('Operation failed after retries')
}

export { retryWithExponentialBackoff }

export let agentKey = ''

export const tractionBaseUrl = process.env.TRACTION_URL ?? ''

export const tractionApiKeyUpdaterInit = async (failOnError: boolean = false) => {
  const tractionBaseUrl = process.env.TRACTION_URL ?? ''
  const tenantId = process.env.TRACTION_TENANT_ID ?? ''
  const apiKey = process.env.TRACTION_TENANT_API_KEY ?? ''
  logger.info({ tractionBaseUrl, tenantId }, 'Initializing Traction API key')
  try {
    agentKey =
      (await axios.post(`${tractionBaseUrl}/multitenancy/tenant/${tenantId}/token`, { api_key: apiKey })).data?.token ??
      agentKey
    logger.info('Traction API key initialized successfully')
  } catch (err) {
    if (failOnError) {
      throw err
    }
    logger.warn(safeAxiosError(err), 'Failed to initialize Traction API key; server will start without a valid token')
  }
  // refresh agent key every hour
  setInterval(async () => {
    logger.debug('Refreshing Traction API key')
    try {
      agentKey =
        (await axios.post(`${tractionBaseUrl}/multitenancy/tenant/${tenantId}/token`, { api_key: apiKey })).data
          ?.token ?? agentKey
      logger.debug('Traction API key refreshed')
    } catch (err) {
      logger.warn(safeAxiosError(err), 'Failed to refresh Traction API key; retaining previous token')
    }
  }, 3600000)
}

export const tractionRequest = {
  get: (url: string, config?: AxiosRequestConfig<any>) => {
    return axios.get(`${process.env.TRACTION_URL}${url}`, {
      ...config,
      timeout: 80000,
      headers: { ...config?.headers, Authorization: `Bearer ${agentKey}` },
    })
  },
  delete: (url: string, config?: AxiosRequestConfig<any>) => {
    return axios.delete(`${process.env.TRACTION_URL}${url}`, {
      ...config,
      timeout: 80000,
      headers: { ...config?.headers, Authorization: `Bearer ${agentKey}` },
    })
  },
  post: (url: string, data: any, config?: AxiosRequestConfig<any>) => {
    return axios.post(`${process.env.TRACTION_URL}${url}`, data, {
      ...config,
      timeout: 80000,
      headers: { ...config?.headers, Authorization: `Bearer ${agentKey}` },
    })
  },
}

const createCredentialDefinition = async (issuerDid: string, schemaId: string, tag: string): Promise<string> => {
  const credDefResponse = await retryWithExponentialBackoff(
    () =>
      tractionRequest.post('/anoncreds/credential-definition', {
        credential_definition: {
          issuerId: issuerDid,
          schemaId: schemaId,
          tag: tag,
        },
        options: {
          support_revocation: true,
          revocation_registry_size: 3000,
        },
      }),
    3,
    1000,
  )
  return credDefResponse.data.credential_definition_state.credential_definition_id
}

export const tractionGarbageCollection = async () => {
  // delete all connections that are older than one day
  const cleanupConnections = async () => {
    try {
      const connections: any[] = (await tractionRequest.get('/connections')).data.results
      const stale = connections.filter(
        (conn) =>
          olderThanHours(conn.created_at, 12) && conn.alias !== 'endorser' && conn.alias !== 'bcovrin-test-endorser',
      )
      logger.info({ count: stale.length }, 'Garbage collection: deleting stale connections')
      await Promise.all(stale.map((conn) => tractionRequest.delete(`/connections/${conn.connection_id}`)))
    } catch (err) {
      logger.warn(safeAxiosError(err), 'Garbage collection: failed to clean up connections')
    }
  }
  const cleanupExchangeRecords = async () => {
    try {
      const records: any[] = (await tractionRequest.get('/issue-credential-2.0/records')).data.results
      const stale = records.filter((record) => olderThanHours(record.created_at, 12))
      logger.info({ count: stale.length }, 'Garbage collection: deleting stale credential exchange records')
      await Promise.all(
        stale.map((record) => tractionRequest.delete(`/issue-credential-2.0/records/${record.cred_ex_id}`)),
      )
    } catch (err) {
      logger.warn(safeAxiosError(err), 'Garbage collection: failed to clean up credential exchange records')
    }
  }
  const cleanupProofRecords = async () => {
    try {
      const proofs: any[] = (await tractionRequest.get('/present-proof-2.0/records')).data.results
      const stale = proofs.filter((proof) => olderThanHours(proof.created_at, 12))
      logger.info({ count: stale.length }, 'Garbage collection: deleting stale proof records')
      await Promise.all(stale.map((proof) => tractionRequest.delete(`/present-proof-2.0/records/${proof.pres_ex_id}`)))
    } catch (err) {
      logger.warn(safeAxiosError(err), 'Garbage collection: failed to clean up proof records')
    }
  }
  cleanupConnections()
  cleanupExchangeRecords()
  cleanupProofRecords()
  setInterval(
    async () => {
      logger.debug('Running scheduled garbage collection')
      cleanupConnections()
      cleanupExchangeRecords()
      cleanupProofRecords()
    },
    6 * 60 * 60 * 1000,
  )
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface SeedCredential {
  _id: string
  name: string
  version: string
  attributes: SeedCredentialAttribute[]
  // populated later
  schema_id?: string
  cred_def_id?: string
}

export interface SeedCredentialAttribute {
  name: string
}

export async function getOrCreateIndyDid(): Promise<string> {
  const results = (
    await tractionRequest.get('/wallet/did', {
      params: {
        method: 'sov',
        posture: 'posted',
      },
    })
  ).data.results

  if (results?.length) {
    return results[0].did
  }

  logger.info('No posted Indy DID found, creating one')

  return (
    await tractionRequest.post('/wallet/did/create', {
      method: 'sov',
    })
  ).data.result.did
}

export async function getOrCreateWebvhDid(): Promise<string | null> {
  const results = (
    await tractionRequest.get('/wallet/did', {
      params: {
        method: 'webvh',
        posture: 'posted',
      },
    })
  ).data.results

  if (results?.length) {
    return results[0].did
  }

  let configResponse
  try {
    configResponse = await tractionRequest.get('/did/webvh/config')
  } catch (err) {
    const status = (err as AxiosError).response?.status
    if (status === 404) {
      logger.warn('WebVH not available on Traction tenant; skipping WebVH DID setup')
      return null
    }
    throw err
  }

  if (!configResponse.data?.server_url) {
    logger.warn('WebVH config missing server_url; skipping WebVH DID setup')
    return null
  }

  return (
    await tractionRequest.post('/did/webvh/create', {
      options: {
        server_url: configResponse.data.server_url,
        namespace: 'showcase',
        identifier: uuidv4(),
      },
    })
  ).data.state.id
}

export async function ensureDidInDatabase(did: string, method: 'indy' | 'webvh'): Promise<void> {
  await DidModel.updateOne(
    { _id: did },
    {
      $setOnInsert: {
        did,
        method,
      },
    },
    { upsert: true },
  )
}

export async function findSchemaInTraction(name: string, version: string): Promise<string | null> {
  const schemaIds = (
    await tractionRequest.get('/anoncreds/schemas', {
      params: {
        schema_name: name,
        schema_version: version,
      },
    })
  ).data.schema_ids

  return schemaIds[0] ?? null
}

export async function getOrCreateCredDef(issuerDid: string, schemaId: string, schemaName: string): Promise<string> {
  const credDefs = (
    await tractionRequest.get('/anoncreds/credential-definitions', {
      params: {
        schema_id: schemaId,
      },
    })
  ).data.credential_definition_ids

  if (credDefs?.length) {
    return credDefs[0]
  }

  return createCredentialDefinition(issuerDid, schemaId, schemaName)
}

export async function syncSchemaToDatabase(credential: SeedCredential, schemaId: string, credDefId: string) {
  await SchemaModel.updateOne(
    { _id: schemaId },
    {
      $set: {
        name: credential.name,
        version: credential.version,
        attrNames: credential.attributes.map((a) => a.name),
        credDefId,
      },
    },
    { upsert: true },
  )

  await CredentialModel.updateOne(
    { _id: credential._id },
    {
      $set: {
        schema_id: schemaId,
        cred_def_id: credDefId,
      },
    },
  )
}

export async function createSchema(credential: SeedCredential, issuerDid: string): Promise<string> {
  const response = await tractionRequest.post('/anoncreds/schema', {
    schema: {
      name: credential.name,
      version: credential.version,
      attrNames: credential.attributes.map((a) => a.name),
      issuerId: issuerDid,
    },
  })

  await new Promise((resolve) => setTimeout(resolve, 2000))

  return response.data.schema_state.schema_id
}

async function ensureSchema(credential: SeedCredential, issuerDid: string, maxAttempts = 10): Promise<string> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    logger.info({ attempt }, `Ensuring schema ${credential.name} v${credential.version}`)

    // 1. Check Traction first (source of truth)
    let schemaId = await findSchemaInTraction(credential.name, credential.version)

    // 2. If missing, create it
    if (!schemaId) {
      logger.info('Schema missing in Traction, creating')
      schemaId = await createSchema(credential, issuerDid)
    }

    // 3. Verify it is actually usable (important part)
    const verified = await findSchemaInTraction(credential.name, credential.version)

    if (verified) {
      return verified
    }

    logger.warn(`Schema not ready yet (attempt ${attempt}/${maxAttempts}), retrying...`)

    await delay(1000 * attempt) // linear or exponential backoff
  }

  throw new Error(`Failed to ensure schema ${credential.name} v${credential.version}`)
}

async function ensureCredentialDefinition(
  issuerDid: string,
  schemaId: string,
  schemaName: string,
  maxAttempts = 10,
): Promise<string> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const credDefs = await tractionRequest.get('/anoncreds/credential-definitions', { params: { schema_id: schemaId } })

    if (credDefs.data?.credential_definition_ids?.length) {
      return credDefs.data.credential_definition_ids[0]
    }

    logger.info({ attempt }, `Cred def missing, creating (attempt ${attempt})`)

    await createCredentialDefinition(issuerDid, schemaId, schemaName)

    // verify it exists before continuing
    const verify = await tractionRequest.get('/anoncreds/credential-definitions', { params: { schema_id: schemaId } })

    if (verify.data?.credential_definition_ids?.length) {
      return verify.data.credential_definition_ids[0]
    }

    await delay(1000 * attempt)
  }

  throw new Error(`Failed to ensure credential definition`)
}

export async function processSeededCredential(credential: SeedCredential, issuerDid: string) {
  const existing = await SchemaModel.findOne({
    name: credential.name,
    version: credential.version,
  })

  if (existing?.credDefId && existing?.did) {
    logger.info(`Already seeded: ${credential.name}`)
    return
  }

  const schemaId = await ensureSchema(credential, issuerDid)
  const credDefId = await ensureCredentialDefinition(issuerDid, schemaId, credential.name)

  await syncSchemaToDatabase(credential, schemaId, credDefId)
}

export async function populateMissingSchemaDids(issuerDid: string) {
  // Add the indy issuer DID to any schemas in the database that are missing a DID,
  // to ensure all schemas have an associated issuer DID for credential issuance
  const allSchemas = await SchemaModel.find()
  for (const schema of allSchemas) {
    if (!schema.did) {
      logger.info(`Schema ${schema.name} v${schema.version} has no DID, adding issuer DID`)
      await SchemaModel.updateOne(
        { _id: schema._id },
        {
          $set: {
            did: issuerDid,
          },
        },
        { upsert: true },
      )
    }
  }
}

// This requires that the endorsement connections have been set up for the traction tenant beforehand,
// and that the tenant has permissions to create schemas and credential definitions.
// It will check for the existence of the seeded schemas in Traction and MongoDB,
// and create any that are missing from either place, ensuring that the seeded schemas are available for issuance and listed in the admin UI.
export const checkSeededSchemasExistOrCreate = async (failOnError: boolean = false) => {
  try {
    logger.info('Checking seeded schemas')

    const indyDid = await getOrCreateIndyDid()
    const webvhDid = await getOrCreateWebvhDid()

    await ensureDidInDatabase(indyDid, 'indy')
    if (webvhDid) {
      await ensureDidInDatabase(webvhDid, 'webvh')
    }

    for (const credential of credentialsSeed as (Omit<Credential, 'id'> & { _id: string })[]) {
      try {
        await processSeededCredential(credential, indyDid)
      } catch (err) {
        logger.error(safeAxiosError(err), `Failed processing ${credential.name}`)
        if (failOnError) {
          throw err
        }
      }
    }

    await populateMissingSchemaDids(indyDid)
  } catch (err) {
    logger.error(safeAxiosError(err), 'Failed to process seeded schemas')
    if (failOnError) {
      throw err
    }
  }
}
