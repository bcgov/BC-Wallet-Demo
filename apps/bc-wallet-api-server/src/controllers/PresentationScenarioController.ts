import {
  instanceOfPresentationScenarioRequest,
  instanceOfStepActionRequest,
  instanceOfStepRequest,
  PresentationScenarioRequest,
  PresentationScenarioRequestToJSONTyped,
  PresentationScenarioResponse,
  PresentationScenarioResponseFromJSONTyped,
  PresentationScenariosResponse,
  PresentationScenariosResponseFromJSONTyped,
  StepActionRequest,
  StepActionRequestToJSONTyped,
  StepActionResponse,
  StepActionResponseFromJSONTyped,
  StepActionsResponse,
  StepActionsResponseFromJSONTyped,
  StepRequest,
  StepRequestToJSONTyped,
  StepResponse,
  StepResponseFromJSONTyped,
  StepsResponse,
  StepsResponseFromJSONTyped,
} from 'bc-wallet-openapi'
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
  Put,
} from 'routing-controllers'
import { Service } from 'typedi'

import ScenarioService from '../services/ScenarioService'
import { PresentationScenario, ScenarioType } from '../types'
import { getBasePath } from '../utils/auth'
import { createRequestLogger } from '../utils/logger'
import { presentationScenarioDTOFrom, stepDTOFrom } from '../utils/mappers'

@JsonController(getBasePath('/scenarios/presentations'))
@Service()
class PresentationScenarioController {
  private readonly logger = createRequestLogger('PresentationScenarioController')
  
  public constructor(private scenarioService: ScenarioService) {}

  @Get('/')
  public async getAllPresentationScenarios(): Promise<PresentationScenariosResponse> {
    this.logger.info('Getting all presentation scenarios')
    try {
      const result = (await this.scenarioService.getScenarios({
        filter: { scenarioType: ScenarioType.PRESENTATION },
      })) as PresentationScenario[]
      const presentationScenarios = result.map((presentationScenario) =>
        presentationScenarioDTOFrom(presentationScenario),
      )
      this.logger.info({ count: presentationScenarios.length }, 'Successfully retrieved presentation scenarios')
      return PresentationScenariosResponseFromJSONTyped({ presentationScenarios }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e }, 'Get all presentation scenarios failed')
      }
      return Promise.reject(e)
    }
  }

  @Get('/:slug')
  public async getOnePresentationScenario(@Param('slug') slug: string): Promise<PresentationScenarioResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      const result = (await this.scenarioService.getScenario(presentationScenarioId)) as PresentationScenario
      return PresentationScenarioResponseFromJSONTyped(
        { presentationScenario: presentationScenarioDTOFrom(result) },
        false,
      )
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, presentationScenarioId }, `Get presentation scenario id=${presentationScenarioId} failed`)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/')
  public async postPresentationScenario(
    @Body() presentationScenarioRequest: PresentationScenarioRequest,
  ): Promise<PresentationScenarioResponse> {
    try {
      if (!instanceOfPresentationScenarioRequest(presentationScenarioRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = (await this.scenarioService.createScenario(
        PresentationScenarioRequestToJSONTyped(presentationScenarioRequest),
      )) as PresentationScenario
      return PresentationScenarioResponseFromJSONTyped(
        { presentationScenario: presentationScenarioDTOFrom(result) },
        false,
      )
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, presentationScenarioRequest }, 'Create presentation scenario failed')
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Put('/:slug')
  public async putPresentationScenario(
    @Param('slug') slug: string,
    @Body() presentationScenarioRequest: PresentationScenarioRequest,
  ): Promise<PresentationScenarioResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      if (!instanceOfPresentationScenarioRequest(presentationScenarioRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = (await this.scenarioService.updateScenario(
        presentationScenarioId,
        PresentationScenarioRequestToJSONTyped(presentationScenarioRequest),
      )) as PresentationScenario
      return PresentationScenarioResponseFromJSONTyped(
        { presentationScenario: presentationScenarioDTOFrom(result) },
        false,
      )
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, presentationScenarioId, presentationScenarioRequest }, `Update presentation scenario id=${presentationScenarioId} failed`)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:slug')
  public async deletePresentationScenario(@Param('slug') slug: string): Promise<void> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      return await this.scenarioService.deleteScenario(presentationScenarioId)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, presentationScenarioId }, `Delete presentation scenario id=${presentationScenarioId} failed`)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:slug/steps')
  public async getAllSteps(@Param('slug') slug: string): Promise<StepsResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      const result = await this.scenarioService.getScenarioSteps(presentationScenarioId)
      const steps = result.map((step) => stepDTOFrom(step))
      return StepsResponseFromJSONTyped({ steps }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, presentationScenarioId }, `Get all steps for presentation scenario id=${presentationScenarioId} failed`)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:slug/steps/:stepId')
  public async getOnePresentationScenarioStep(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
  ): Promise<StepResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      const result = await this.scenarioService.getScenarioStep(presentationScenarioId, stepId)
      return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, stepId, presentationScenarioId }, `Get step id=${stepId} for presentation scenario id=${presentationScenarioId} failed`)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/:slug/steps')
  public async postPresentationScenarioStep(
    @Param('slug') slug: string,
    @Body() stepRequest: StepRequest,
  ): Promise<StepResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      if (!instanceOfStepRequest(stepRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.scenarioService.createScenarioStep(
        presentationScenarioId,
        StepRequestToJSONTyped(stepRequest),
      )
      return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, presentationScenarioId, stepRequest }, `Create step for presentation scenario id=${presentationScenarioId} failed`)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Put('/:slug/steps/:stepId')
  public async putPresentationScenarioStep(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Body() stepRequest: StepRequest,
  ): Promise<StepResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      if (!instanceOfStepRequest(stepRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.scenarioService.updateScenarioStep(
        presentationScenarioId,
        stepId,
        StepRequestToJSONTyped(stepRequest),
      )
      return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, stepId, presentationScenarioId, stepRequest }, `Update step id=${stepId} for presentation scenario id=${presentationScenarioId} failed`)
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:slug/steps/:stepId')
  public async deletePresentationScenarioStep(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
  ): Promise<void> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      return this.scenarioService.deleteScenarioStep(presentationScenarioId, stepId)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error({ error: e, stepId, presentationScenarioId }, `Delete step id=${stepId} for presentation scenario id=${presentationScenarioId} failed`)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:slug/steps/:stepId/actions')
  public async getAllPresentationScenarioStepActions(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
  ): Promise<StepActionsResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      const result = await this.scenarioService.getScenarioStepActions(presentationScenarioId, stepId)
      const actions = result.map((action) => action)
      return StepActionsResponseFromJSONTyped({ actions }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error(
          { error: e, stepId, presentationScenarioId },
          `Get all actions for step id=${stepId}, presentation scenario id=${presentationScenarioId} failed`,
        )
      }
      return Promise.reject(e)
    }
  }

  @Get('/:slug/steps/:stepId/actions/:actionId')
  public async getOnePresentationScenarioStepAction(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
  ): Promise<StepActionResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      const result = await this.scenarioService.getScenarioStepAction(presentationScenarioId, stepId, actionId)
      return StepActionResponseFromJSONTyped({ action: result }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error(
          { error: e, actionId, stepId, presentationScenarioId },
          `Get action id=${actionId} for step id=${stepId}, presentation scenario id=${presentationScenarioId} failed`,
        )
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @HttpCode(201)
  @Post('/:slug/steps/:stepId/actions')
  public async postPresentationScenarioStepAction(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Body() actionRequest: StepActionRequest,
  ): Promise<StepActionResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      if (!instanceOfStepActionRequest(actionRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.scenarioService.createScenarioStepAction(
        presentationScenarioId,
        stepId,
        StepActionRequestToJSONTyped(actionRequest),
      )
      return StepActionResponseFromJSONTyped({ action: result }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error(
          { error: e, stepId, presentationScenarioId, actionRequest },
          `Create action for step id=${stepId}, presentation scenario id=${presentationScenarioId} failed`,
        )
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @Put('/:slug/steps/:stepId/actions/:actionId')
  public async putPresentationScenarioStepAction(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
    @Body() actionRequest: StepActionRequest,
  ): Promise<StepActionResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      if (!instanceOfStepActionRequest(actionRequest)) {
        return Promise.reject(new BadRequestError())
      }
      const result = await this.scenarioService.updateScenarioStepAction(
        presentationScenarioId,
        stepId,
        actionId,
        StepActionRequestToJSONTyped(actionRequest),
      )
      return StepActionResponseFromJSONTyped({ action: result }, false)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error(
          { error: e, actionId, stepId, presentationScenarioId, actionRequest },
          `Update action id=${actionId} for step id=${stepId}, presentation scenario id=${presentationScenarioId} failed`,
        )
      }
      return Promise.reject(e)
    }
  }

  @Authorized()
  @OnUndefined(204)
  @Delete('/:slug/steps/:stepId/actions/:actionId')
  public async deletePresentationScenarioStepAction(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
  ): Promise<void> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    try {
      return this.scenarioService.deleteScenarioStepAction(presentationScenarioId, stepId, actionId)
    } catch (e) {
      if (e.httpCode !== 404) {
        this.logger.error(
          { error: e, actionId, stepId, presentationScenarioId },
          `Delete action id=${actionId} for step id=${stepId}, presentation scenario id=${presentationScenarioId} failed`,
        )
      }
      return Promise.reject(e)
    }
  }
}

export default PresentationScenarioController
