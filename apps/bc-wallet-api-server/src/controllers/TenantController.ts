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
import {
  instanceOfTenant,
  TenantRequest,
  TenantResponse,
  TenantResponseFromJSONTyped,
  TenantsResponse,
  TenantsResponseFromJSONTyped,
  TenantToJSONTyped,
} from 'bc-wallet-openapi'

@JsonController('/tenants')
@Service()
class TenantController {
  constructor(private tenantService: TenantService) {}

  @Get('/')
  public async getAll(): Promise<TenantsResponse> {
    try {
      const result = await this.tenantService.getTenants()
      return TenantsResponseFromJSONTyped({ result }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Get all tenants failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<TenantResponse> {
    try {
      const result = await this.tenantService.getTenant(id)
      return TenantResponseFromJSONTyped({ result }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Get tenant id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @HttpCode(201)
  @Post('/')
  public async post(@Body() tenantRequest: TenantRequest): Promise<TenantResponse> {
    try {
      if (!instanceOfTenant(tenantRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.tenantService.createTenant(TenantToJSONTyped(tenantRequest))
      return TenantResponseFromJSONTyped({ result }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Create tenant failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Put('/:id')
  public async put(@Param('id') id: string, @Body() tenantRequest: TenantRequest): Promise<TenantResponse> {
    try {
      if (!instanceOfTenant(tenantRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.tenantService.updateTenant(id, TenantToJSONTyped(tenantRequest))
      return TenantResponseFromJSONTyped({ result }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Update tenant id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

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
