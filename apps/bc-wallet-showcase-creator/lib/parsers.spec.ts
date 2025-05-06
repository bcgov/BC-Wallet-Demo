import { IssuanceScenario } from 'bc-wallet-openapi'
import { actionToStepRequestAction, issuanceScenarioToIssuanceScenarioRequest, presentationScenarioToPresentationScenarioRequest, stepToStepRequest } from './parsers'
import { issuanceScenarioFixture, presentationScenarioFixture } from './fixtures'

describe('issuanceScenarioToIssuanceScenarioRequest', () => {
  it('should convert an issuance scenario to an issuance scenario request', () => {
    const result = issuanceScenarioToIssuanceScenarioRequest(issuanceScenarioFixture)
    expect(result.issuer).toStrictEqual(issuanceScenarioFixture.issuer?.id)
    expect(result.personas).toStrictEqual(issuanceScenarioFixture.personas.map((persona) => persona.id))
    expect(result.slug).toStrictEqual(issuanceScenarioFixture.slug)
    expect(result.name).toStrictEqual(issuanceScenarioFixture.name)
    expect(result.description).toStrictEqual(issuanceScenarioFixture.description)
  })

  it('should convert an issuance step to an issuance step request', () => {
    const result = stepToStepRequest(issuanceScenarioFixture.steps[4])

    expect(result.asset).toStrictEqual(issuanceScenarioFixture.steps[4].asset?.id)
    expect(result.description).toStrictEqual(issuanceScenarioFixture.steps[4].description)
    expect(result.order).toStrictEqual(issuanceScenarioFixture.steps[4].order)
    expect(result.title).toStrictEqual(issuanceScenarioFixture.steps[4].title)
    expect(result.type).toStrictEqual(issuanceScenarioFixture.steps[4].type)
  })

  it('should convert an issuance action to an issuance action request', () => {
    // @ts-expect-error: issuanceScenarioFixture.steps[4].actions[0] cannot be undefined
    const result = actionToStepRequestAction(issuanceScenarioFixture.steps[4].actions[0])
    // @ts-expect-error: issuanceScenarioFixture.steps[4].actions[0] cannot be undefined
    expect(result.actionType).toStrictEqual(issuanceScenarioFixture.steps[4].actions[0].actionType)
    // @ts-expect-error: issuanceScenarioFixture.steps[4].actions[0] cannot be undefined
    expect(result.title).toStrictEqual(issuanceScenarioFixture.steps[4].actions[0].title)
    // @ts-expect-error: issuanceScenarioFixture.steps[4].actions[0] cannot be undefined
    expect(result.text).toStrictEqual(issuanceScenarioFixture.steps[4].actions[0].text)

    // @ts-expect-error: issuanceScenarioFixture.steps[4].actions[0] cannot be undefined
    expect(result.credentialDefinitionId).toStrictEqual(issuanceScenarioFixture.steps[4].actions[0].credentialDefinitionId)
    // @ts-expect-error: issuanceScenarioFixture.steps[4].actions[0] cannot be undefined
    expect(result.connectionId).toStrictEqual(issuanceScenarioFixture.steps[4].actions[0].connectionId)
    // @ts-expect-error: issuanceScenarioFixture.steps[4].actions[0] cannot be undefined
    expect(result.goToStep).toStrictEqual(issuanceScenarioFixture.steps[4].actions[0].goToStep)
  })
})

describe('presentationScenarioToPresentationScenarioRequest', () => {
  it('should convert an presentation scenario to an presentation scenario request', () => {
    const result = presentationScenarioToPresentationScenarioRequest(presentationScenarioFixture)
    expect(result.relyingParty).toStrictEqual(presentationScenarioFixture.relyingParty?.id)
    expect(result.personas).toStrictEqual(presentationScenarioFixture.personas.map((persona) => persona.id))
    expect(result.slug).toStrictEqual(presentationScenarioFixture.slug)
    expect(result.name).toStrictEqual(presentationScenarioFixture.name)
    expect(result.description).toStrictEqual(presentationScenarioFixture.description)
  })

  it('should convert an presentation step to an presentation step request', () => {
    const result = stepToStepRequest(presentationScenarioFixture.steps[1])
    console.log('stepToStepRequest', result)
    expect(result.asset).toStrictEqual(presentationScenarioFixture.steps[1].asset?.id)
    expect(result.description).toStrictEqual(presentationScenarioFixture.steps[1].description)
    expect(result.order).toStrictEqual(presentationScenarioFixture.steps[1].order)
    expect(result.title).toStrictEqual(presentationScenarioFixture.steps[1].title)
    expect(result.type).toStrictEqual(presentationScenarioFixture.steps[1].type)
  })

  it('should convert an presentation action to an presentation action request', () => {
    // @ts-expect-error: presentationScenarioFixture.steps[1].actions[0] cannot be undefined
    const result = actionToStepRequestAction(presentationScenarioFixture.steps[1].actions[0])
    // @ts-expect-error: presentationScenarioFixture.steps[1].actions[0] cannot be undefined
    expect(result.actionType).toStrictEqual(presentationScenarioFixture.steps[1].actions[0].actionType)
    // @ts-expect-error: presentationScenarioFixture.steps[1].actions[0] cannot be undefined
    expect(result.title).toStrictEqual(presentationScenarioFixture.steps[1].actions[0].title)
    // @ts-expect-error: presentationScenarioFixture.steps[1].actions[0] cannot be undefined
    expect(result.text).toStrictEqual(presentationScenarioFixture.steps[1].actions[0].text)

    // @ts-expect-error: presentationScenarioFixture.steps[1].actions[0] cannot be undefined
    expect(result.credentialDefinitionId).toStrictEqual(presentationScenarioFixture.steps[1].actions[0].credentialDefinitionId)
    // @ts-expect-error: presentationScenarioFixture.steps[1].actions[0] cannot be undefined
    expect(result.connectionId).toStrictEqual(presentationScenarioFixture.steps[1].actions[0].connectionId)
    // @ts-expect-error: presentationScenarioFixture.steps[1].actions[0] cannot be undefined
    expect(result.goToStep).toStrictEqual(presentationScenarioFixture.steps[1].actions[0].goToStep)
  })
})
