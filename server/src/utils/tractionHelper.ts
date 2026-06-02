import type { AxiosRequestConfig, AxiosError } from 'axios'

import axios from 'axios'

import credentialsSeed from '../../scripts/values/credentials.json'
import { CredentialModel } from '../db/models/Credential'
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

export const tractionApiKeyUpdaterInit = async () => {
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

export const checkSeededSchemasExistOrCreate = async () => {
  try {
    // Iterate through seeded credentials and log their name and version
    const issuerDid = (await tractionRequest.get('/wallet/did/public')).data.result.did

    for (const credential of credentialsSeed) {
      logger.info(`Schema ${credential.name} v${credential.version} Checking seeded schema existence`)

      // First check if schema already exists in MongoDB
      const existingSchema = await SchemaModel.findOne({
        name: credential.name,
        version: credential.version,
      })

      if (existingSchema) {
        logger.info(`Schema ${credential.name} v${credential.version} Already exists in database`)
        continue
      }

      // Schema doesn't exist in MongoDB, make sure cred def is available in traction and create in MongoDB
      const schemas = (
        await tractionRequest.get('/anoncreds/schemas', {
          params: {
            schema_name: credential.name,
            schema_version: credential.version,
          },
        } as any)
      ).data.schema_ids

      if (schemas.length > 0) {
        logger.info(`Schema ${credential.name} v${credential.version} Seeded schema already exists`)
        try {
          const schemaId = schemas[0]
          // Try to find existing credential definition or create one
          const credDefs = (
            await tractionRequest.get('/anoncreds/credential-definitions', {
              params: {
                schema_id: schemaId,
              },
            } as any)
          ).data.credential_definition_ids

          let credDefId = credDefs?.[0]
          if (!credDefId) {
            logger.info(
              `Schema ${credential.name} v${credential.version} Creating credential definition for existing schema`,
            )
            credDefId = await createCredentialDefinition(issuerDid, schemaId, credential.name)
          }

          // Save schema to MongoDB
          await SchemaModel.updateOne(
            { _id: schemaId },
            {
              $set: {
                name: credential.name,
                version: credential.version,
                attrNames: credential.attributes.map((attr: any) => attr.name),
                credDefId,
              },
            },
            { upsert: true },
          )

          // Update Credential with schema_id and credDefId
          await CredentialModel.updateOne(
            { _id: credential._id },
            {
              $set: { schema_id: schemaId, cred_def_id: credDefId },
            },
            { upsert: false },
          )
          logger.info(`Schema ${credential.name} v${credential.version} Seeded schema synced to database`)
        } catch (err) {
          logger.error(
            safeAxiosError(err),
            `Schema ${credential.name} v${credential.version} Failed to sync existing schema to database`,
          )
        }
      } else {
        // Schema doesn't exist in Traction, create both schema and credential definition and add to MongoDB, also update Credential with schema_id and cred_def_id
        try {
          logger.info(`Schema ${credential.name} v${credential.version} Creating seeded schema`)
          const createSchemaPayload = {
            name: credential.name,
            version: credential.version,
            attrNames: credential.attributes.map((attr: any) => attr.name),
            issuerId: issuerDid,
          }
          logger.debug({ createSchemaPayload }, 'Creating schema with payload')
          const response = await tractionRequest.post('/anoncreds/schema', { schema: createSchemaPayload })

          // Wait briefly to allow schema to be fully available in Traction before creating credential definition
          await new Promise((r) => setTimeout(r, 2000))

          const schemaId = response.data.schema_state.schema_id
          const credDefId = await createCredentialDefinition(
            issuerDid,
            schemaId,
            response.data.schema_state.schema.name,
          )
          // Save schema to MongoDB
          await SchemaModel.updateOne(
            { _id: schemaId },
            {
              $set: {
                name: credential.name,
                version: credential.version,
                attrNames: credential.attributes.map((attr: any) => attr.name),
                credDefId,
              },
            },
            { upsert: true },
          )
          // Update Credential with schema_id and credDefId
          await CredentialModel.updateOne(
            { _id: credential._id },
            {
              $set: { schema_id: schemaId, cred_def_id: credDefId },
            },
            { upsert: false },
          )
          logger.info(`Schema ${credential.name} v${credential.version} Seeded schema created successfully`)
        } catch (err) {
          logger.error(
            safeAxiosError(err),
            `Schema ${credential.name} v${credential.version} Failed to create seeded schema or credential definition`,
          )
        }
      }
    }
  } catch (err) {
    logger.error(safeAxiosError(err), 'Failed to process seeded schemas')
  }
}
