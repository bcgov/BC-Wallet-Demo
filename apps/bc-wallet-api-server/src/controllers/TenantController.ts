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
import { getBasePath, RootTenantAuthorized } from '../utils/auth'

@JsonController(getBasePath('/tenants'))
@Service()
class TenantController {
  public constructor(private tenantService: TenantService) {}

  @RootTenantAuthorized()
  @Get('/')
  public async getAll(): Promise<TenantsResponse> {
    try {
      const tenants = await this.tenantService.getTenants()
      return TenantsResponseFromJSONTyped({ tenants }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Get all tenants failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @RootTenantAuthorized()
  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<TenantResponse> {
    try {
      const tenant = await this.tenantService.getTenant(id)
      return TenantResponseFromJSONTyped({ tenant }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Get tenant id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @RootTenantAuthorized()
  @HttpCode(201)
  @Post('/')
  public async post(@Body() tenantRequest: TenantRequest): Promise<TenantResponse> {
    try {
      if (!instanceOfTenantRequest(tenantRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const newTenant = TenantRequestToJSONTyped(tenantRequest)
      const tenant = await this.tenantService.createTenant({ ...newTenant, tenantType: TenantType.SHOWCASE }) // Do not allow ROOT tenant to be created externally
      return TenantResponseFromJSONTyped({ tenant }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Create tenant failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @RootTenantAuthorized()
  @Put('/:id')
  public async put(@Param('id') id: string, @Body() tenantRequest: TenantRequest): Promise<TenantResponse> {
    try {
      if (!instanceOfTenantRequest(tenantRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const tenant = await this.tenantService.updateTenant(id, TenantRequestToJSONTyped(tenantRequest))
      return TenantResponseFromJSONTyped({ tenant }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Update tenant id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @RootTenantAuthorized()
  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    try {
      return await this.tenantService.deleteTenant(id)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Delete tenant id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }
}

export default TenantController
