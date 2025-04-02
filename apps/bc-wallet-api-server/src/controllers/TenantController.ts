import { BadRequestError, Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import TenantService from '../services/TenantService'
import { TenantRequest, TenantResponse, TenantsResponse } from 'bc-wallet-openapi'
import { tenantDTOFrom } from '../utils/mappers'

@JsonController('/tenants')
@Service()
class TenantController {
  constructor(private tenantService: TenantService) {}

  @Get('/')
  public async getAll(): Promise<TenantsResponse> {
    try {
      const result = await this.tenantService.getTenants()
     const tenants = result.map(tenantDTOFrom)
      return { tenants }
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
     return { tenant: tenantDTOFrom(result) }
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
      if (!tenantRequest.id) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.tenantService.createTenant({ id: tenantRequest.id })
     return { tenant: tenantDTOFrom(result) }
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
      if (!tenantRequest.id) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.tenantService.updateTenant(id, { id: tenantRequest.id })
     return { tenant: tenantDTOFrom(result) }
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