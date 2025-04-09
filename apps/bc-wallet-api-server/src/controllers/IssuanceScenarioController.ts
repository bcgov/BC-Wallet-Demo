import {
  Authorized,
  BadRequestError,
  Body,
  Delete,
  Get,
  HttpCode,
  JsonController,
  OnUndefined,
  Param,
  Post,
  Put
} from 'routing-controllers'
import { Service } from 'typedi'
import ScenarioService from '../services/ScenarioService'
import {
  IssuanceScenarioResponse,
  IssuanceScenarioResponseFromJSONTyped,
  IssuanceScenariosResponse,
  IssuanceScenariosResponseFromJSONTyped,
  StepsResponse,
  StepsResponseFromJSONTyped,
  StepResponse,
  StepResponseFromJSONTyped,
  StepRequest,
  StepRequestToJSONTyped,
  StepActionsResponse,
  StepActionsResponseFromJSONTyped,
  StepActionResponse,
  StepActionResponseFromJSONTyped,
  StepActionRequest,
  StepActionRequestToJSONTyped,
  IssuanceScenarioRequest,
  IssuanceScenarioRequestToJSONTyped,
  instanceOfIssuanceScenarioRequest,
  instanceOfStepRequest,
  instanceOfStepActionRequest,
} from 'bc-wallet-openapi'
import { issuanceScenarioDTOFrom, stepDTOFrom } from '../utils/mappers'
import { IssuanceScenario, ScenarioType } from '../types'

@JsonController('/scenarios/issuances')
@Service()
class IssuanceScenarioController {
  constructor(private scenarioService: ScenarioService) {}

  @Get('/')
  public async getAllIssuanceScenarios(): Promise<IssuanceScenariosResponse> {
    try {
      const result = await this.scenarioService.getScenarios({ filter: { scenarioType: ScenarioType.ISSUANCE } }) as IssuanceScenario[]
      const issuanceScenarios = result.map((issuanceScenario) => issuanceScenarioDTOFrom(issuanceScenario))
      return IssuanceScenariosResponseFromJSONTyped({ issuanceScenarios }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Get all issuance scenarios failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:slug')
  public async getOneIssuanceScenario(@Param('slug') slug: string): Promise<IssuanceScenarioResponse> {
    const issuanceScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      const result = await this.scenarioService.getScenario(issuanceScenarioId) as IssuanceScenario
      return IssuanceScenarioResponseFromJSONTyped({ issuanceScenario: issuanceScenarioDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Get issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

//  @Authorized()
  @HttpCode(201)
  @Post('/')
  public async postIssuanceScenario(@Body() issuanceScenarioRequest: IssuanceScenarioRequest): Promise<IssuanceScenarioResponse> {
    try {
      if (!instanceOfIssuanceScenarioRequest(issuanceScenarioRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.scenarioService.createScenario(IssuanceScenarioRequestToJSONTyped(issuanceScenarioRequest)) as IssuanceScenario
      return IssuanceScenarioResponseFromJSONTyped({ issuanceScenario: issuanceScenarioDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Create issuance scenario failed:`, e)
      }
      return Promise.reject(e)
    }
  }

//  @Authorized()
  @Put('/:slug')
  public async putIssuanceScenario(
    @Param('slug') slug: string,
    @Body() issuanceScenarioRequest: IssuanceScenarioRequest,
  ): Promise<IssuanceScenarioResponse> {
    const issuanceScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      if (!instanceOfIssuanceScenarioRequest(issuanceScenarioRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.scenarioService.updateScenario(issuanceScenarioId, IssuanceScenarioRequestToJSONTyped(issuanceScenarioRequest)) as IssuanceScenario
      return IssuanceScenarioResponseFromJSONTyped({ issuanceScenario: issuanceScenarioDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Update issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

//  @Authorized()
  @OnUndefined(204)
  @Delete('/:slug')
  public async deleteIssuanceScenario(@Param('slug') slug: string): Promise<void> {
    const issuanceScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      return await this.scenarioService.deleteScenario(issuanceScenarioId)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Delete issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:slug/steps')
  public async getAllSteps(@Param('slug') slug: string): Promise<StepsResponse> {
    const issuanceScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      const result = await this.scenarioService.getScenarioSteps(issuanceScenarioId)
      const steps = result.map((step) => stepDTOFrom(step))
      return StepsResponseFromJSONTyped({ steps }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Get all steps for issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:slug/steps/:stepId')
  public async getOneIssuanceScenarioStep(@Param('slug') slug: string, @Param('stepId') stepId: string): Promise<StepResponse> {
    const issuanceScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      const result = await this.scenarioService.getScenarioStep(issuanceScenarioId, stepId)
      return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Get step id=${stepId} for issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

//  @Authorized()
  @HttpCode(201)
  @Post('/:slug/steps')
  public async postIssuanceScenarioStep(@Param('slug') slug: string, @Body() stepRequest: StepRequest): Promise<StepResponse> {
    const issuanceScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      if (!instanceOfStepRequest(stepRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.scenarioService.createScenarioStep(issuanceScenarioId, StepRequestToJSONTyped(stepRequest))
      return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Create step for issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

//  @Authorized()
  @Put('/:slug/steps/:stepId')
  public async putIssuanceScenarioStep(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Body() stepRequest: StepRequest,
  ): Promise<StepResponse> {
    const issuanceScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      if (!instanceOfStepRequest(stepRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.scenarioService.updateScenarioStep(issuanceScenarioId, stepId, StepRequestToJSONTyped(stepRequest))
      return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Update step id=${stepId} for issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

//  @Authorized()
  @OnUndefined(204)
  @Delete('/:slug/steps/:stepId')
  public async deleteIssuanceScenarioStep(@Param('slug') slug: string, @Param('stepId') stepId: string): Promise<void> {
    const issuanceScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      return this.scenarioService.deleteScenarioStep(issuanceScenarioId, stepId)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Delete step id=${stepId} for issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:slug/steps/:stepId/actions')
  public async getAllIssuanceScenarioStepActions(@Param('slug') slug: string, @Param('stepId') stepId: string): Promise<StepActionsResponse> {
    const issuanceScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      const result = await this.scenarioService.getScenarioStepActions(issuanceScenarioId, stepId)
      const actions = result.map((action) => action)
      return StepActionsResponseFromJSONTyped({ actions }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Get all actions for step id=${stepId}, issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:slug/steps/:stepId/actions/:actionId')
  public async getOneIssuanceScenarioStepAction(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
  ): Promise<StepActionResponse> {
    const issuanceScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      const result = await this.scenarioService.getScenarioStepAction(issuanceScenarioId, stepId, actionId)
      return StepActionResponseFromJSONTyped({ action: result }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Get action id=${actionId} for step id=${stepId}, issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

//  @Authorized()
  @HttpCode(201)
  @Post('/:slug/steps/:stepId/actions')
  public async postIssuanceScenarioStepAction(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Body() actionRequest: StepActionRequest,
  ): Promise<StepActionResponse> {
    const issuanceScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      if (!instanceOfStepActionRequest(actionRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.scenarioService.createScenarioStepAction(issuanceScenarioId, stepId, StepActionRequestToJSONTyped(actionRequest))
      return StepActionResponseFromJSONTyped({ action: result }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Create action for step id=${stepId}, issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

//  @Authorized()
  @Put('/:slug/steps/:stepId/actions/:actionId')
  public async putIssuanceScenarioStepAction(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
    @Body() actionRequest: StepActionRequest,
  ): Promise<StepActionResponse> {
    const issuanceScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      if (!instanceOfStepActionRequest(actionRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.scenarioService.updateScenarioStepAction(
        issuanceScenarioId,
        stepId,
        actionId,
        StepActionRequestToJSONTyped(actionRequest),
      )
      return StepActionResponseFromJSONTyped({ action: result }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Update action id=${actionId} for step id=${stepId}, issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

//  @Authorized()
  @OnUndefined(204)
  @Delete('/:slug/steps/:stepId/actions/:actionId')
  public async deleteIssuanceScenarioStepAction(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
  ): Promise<void> {
    const issuanceScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      return this.scenarioService.deleteScenarioStepAction(issuanceScenarioId, stepId, actionId)
    } catch (e) {
      if (e.httpCode !== 404) {
        console.error(`Delete action id=${actionId} for step id=${stepId}, issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }
}

export default IssuanceScenarioController
