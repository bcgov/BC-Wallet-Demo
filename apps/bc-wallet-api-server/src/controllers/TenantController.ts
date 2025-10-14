import {
  instanceOfTenantRequest,
  TenantRequest,
  TenantRequestToJSONTyped,
  TenantResponse,
  TenantResponseFromJSONTyped,
  TenantsResponse,
  TenantsResponseFromJSONTyped,
} from 'bc-wallet-openapi'
import {
  BadRequestError,
  Body,
  Delete,
  Get,
  HttpCode,
  JsonController,
  OnUndefined,
  Param,
  Post,
  Put,
} from 'routing-controllers'
import { Service } from 'typedi'

import TenantService from '../services/TenantService'
import { TenantType } from '../types'
import { RootTenantAuthorized, SoftTenantAuthorized } from '../utils/auth'
import { createRequestLogger } from '../utils/logger'

@JsonController('/tenants')
@Service()
class TenantController {
  private readonly logger = createRequestLogger('TenantController')

  public constructor(private tenantService: TenantService) {}

  @SoftTenantAuthorized()
  @Get('/')
  public async getAll(): Promise<TenantsResponse> {
    this.logger.info('Getting all tenants')
    try {
      const tenants = await this.tenantService.getTenants()
      this.logger.info({ count: tenants.length }, 'Successfully retrieved tenants')
      return TenantsResponseFromJSONTyped({ tenants }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e }, 'Failed to get all tenants')
      }
      return Promise.reject(e)
    }
  }

  @SoftTenantAuthorized()
  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<TenantResponse> {
    this.logger.info({ id }, 'Getting tenant by id')
    try {
      const tenant = await this.tenantService.getTenant(id)
      this.logger.info({ id, tenantType: tenant.tenantType }, 'Successfully retrieved tenant')
      return TenantResponseFromJSONTyped({ tenant }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to get tenant')
      }
      return Promise.reject(e)
    }
  }

  @RootTenantAuthorized()
  @HttpCode(201)
  @Post('/')
  public async post(@Body() tenantRequest: TenantRequest): Promise<TenantResponse> {
    this.logger.info({ tenantId: tenantRequest.id }, 'Creating new tenant')
    try {
      if (!instanceOfTenantRequest(tenantRequest)) {
        this.logger.warn('Invalid tenant request format')
        return Promise.reject(new BadRequestError())
      }
      const newTenant = TenantRequestToJSONTyped(tenantRequest)
      const tenant = await this.tenantService.createTenant({ ...newTenant, tenantType: TenantType.SHOWCASE }) // Do not allow ROOT tenant to be created externally
      this.logger.info({ tenantId: tenant.id }, 'Successfully created tenant')
      return TenantResponseFromJSONTyped({ tenant }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, tenantId: tenantRequest.id }, 'Failed to create tenant')
      }
      return Promise.reject(e)
    }
  }

  @RootTenantAuthorized()
  @Put('/:id')
  public async put(@Param('id') id: string, @Body() tenantRequest: TenantRequest): Promise<TenantResponse> {
    this.logger.info({ id }, 'Updating tenant')
    try {
      if (!instanceOfTenantRequest(tenantRequest)) {
        this.logger.warn({ id }, 'Invalid tenant request format for update')
        return Promise.reject(new BadRequestError())
      }
      const tenant = await this.tenantService.updateTenant(id, TenantRequestToJSONTyped(tenantRequest))
      this.logger.info({ id }, 'Successfully updated tenant')
      return TenantResponseFromJSONTyped({ tenant }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to update tenant')
      }
      return Promise.reject(e)
    }
  }

  @RootTenantAuthorized()
  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    this.logger.info({ id }, 'Deleting tenant')
    try {
      await this.tenantService.deleteTenant(id)
      this.logger.info({ id }, 'Successfully deleted tenant')
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, id }, 'Failed to delete tenant')
      }
      return Promise.reject(e)
    }
  }
}

export default TenantController
