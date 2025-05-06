import { IssuanceScenario } from 'bc-wallet-openapi'
import { actionToStepRequestAction, issuanceScenarioToIssuanceScenarioRequest, stepToStepRequest } from './parsers'

const issuanceScenario = {
  id: '694c68bf-4d42-4f14-89ac-9e31eaf9dce7',
  name: 'Get your student credential',
  slug: 'get-your-student-credential-cJrVyX',
  description: 'Issuance scenario for first persona',
  type: 'ISSUANCE',
  steps: [
    {
      id: 'b0dba2f3-76e2-4104-a2c1-4cc97677bfc5',
      title: 'Meet first persona',
      description: "Welcome to this showcase. Here you'll learn about digital credentials with first persona.",
      order: 0,
      type: 'HUMAN_TASK',
      actions: [],
      asset: {
        id: '1841adf2-7a1e-4fa7-97f5-2c4cea850585',
        mediaType: 'image/png',
        content: '',
        fileName: '1_ana_body.png',
        createdAt: '2025-05-06T05:56:40.300Z',
        updatedAt: '2025-05-06T05:56:40.300Z',
      },
      createdAt: '2025-05-06T05:56:49.543Z',
      updatedAt: '2025-05-06T05:56:49.543Z',
    },
    {
      id: '7abe76b3-8e6f-48f0-929b-23488baba06d',
      title: "Let's get started!",
      description:
        'BC Wallet is a new app for storing and using credentials on your smartphone. Credentials are things like IDs, licenses and diplomas. Using your BC Wallet is fast and simple. In the future it can be used online and in person. You approve every use, and share only what is needed. In this demo, you will use two credentials to prove who you are and access court materials online instead of in-person.',
      order: 1,
      type: 'HUMAN_TASK',
      actions: [],
      asset: {
        id: '85a4a45b-195c-4be2-ada2-e3b5b2d61826',
        mediaType: 'image/png',
        content: '',
        fileName: '2.new-step.png',
        createdAt: '2025-05-06T05:56:43.629Z',
        updatedAt: '2025-05-06T05:56:43.629Z',
      },
      createdAt: '2025-05-06T05:56:49.543Z',
      updatedAt: '2025-05-06T05:56:49.543Z',
    },
    {
      id: '2ebe245b-1dd1-44dd-a9ed-6c23b1b6b713',
      title: 'Install BC Wallet',
      description:
        'First, install the BC Wallet app onto your smartphone. Select the button below for instructions and the next step.',
      order: 2,
      type: 'HUMAN_TASK',
      actions: [
        {
          id: 'e50b6baa-d9e2-47f7-b973-c07cf59ef17e',
          actionType: 'CHOOSE_WALLET',
          title: 'example_title',
          text: 'example_text',
          createdAt: '2025-05-06T05:56:49.543Z',
          updatedAt: '2025-05-06T05:56:49.543Z',
        },
      ],
      createdAt: '2025-05-06T05:56:49.543Z',
      updatedAt: '2025-05-06T05:56:49.543Z',
    },
    {
      id: '58b89d01-c5c7-49c8-aaf1-b34e5b946ac5',
      title: 'Connect with BC College',
      description:
        'Imagine, as first persona, you are logged into the BestBC College website (see below). They want to offer you a Digital Student Card. Use your BC Wallet to scan the QR code from the website.',
      order: 3,
      type: 'HUMAN_TASK',
      actions: [
        {
          id: 'eb32afa6-ba9e-4727-9d8f-271b264c7976',
          actionType: 'SETUP_CONNECTION',
          title: 'Download BC Wallet on your phone',
          text: "To download, scan this QR code with your phone or select the app store icon below. You can also search for BC Wallet in your phone's app store.",
          createdAt: '2025-05-06T05:56:49.543Z',
          updatedAt: '2025-05-06T05:56:49.543Z',
        },
      ],
      createdAt: '2025-05-06T05:56:49.543Z',
      updatedAt: '2025-05-06T05:56:49.543Z',
    },
    {
      id: 'b7de8529-b9a1-4021-a8fe-c1c2f397e017',
      title: 'Accept your student card',
      description:
        "Your wallet now has a secure and private connection with BestBC College. You should have received an offer in BC Wallet for a Student Card.\nReview what they are sending, and choose 'Accept offer'.",
      order: 4,
      type: 'SERVICE',
      actions: [
        {
          id: '71c5df36-eea7-44d6-a215-c356bd153506',
          actionType: 'ACCEPT_CREDENTIAL',
          title: 'Download BC Wallet on your phone',
          text: "To download, scan this QR code with your phone or select the app store icon below. You can also search for BC Wallet in your phone's app store.",
          createdAt: '2025-05-06T05:56:49.543Z',
          updatedAt: '2025-05-06T05:56:49.543Z',
          credentialDefinitionId: 'dcaa2da9-428c-4202-9ce0-02264b92b34e',
        },
      ],
      asset: {
        id: '1841adf2-7a1e-4fa7-97f5-2c4cea850585',
        mediaType: 'image/png',
        content: '',
        fileName: '1_ana_body.png',
        createdAt: '2025-05-06T05:56:40.300Z',
        updatedAt: '2025-05-06T05:56:40.300Z',
      },
      createdAt: '2025-05-06T05:56:49.543Z',
      updatedAt: '2025-05-06T05:56:49.543Z',
    },
    {
      id: '302ccebd-8bde-490c-837b-7a017f0733e5',
      title: "You're all set!",
      description:
        "Congratulations, you've just received your first digital credentials. They are safely stored in your wallet and ready to be used. So, what are you waiting for? Let's go! We're done with this step. Next, we'll explore ways you can use your credentials.",
      order: 5,
      type: 'HUMAN_TASK',
      actions: [],
      createdAt: '2025-05-06T05:56:49.543Z',
      updatedAt: '2025-05-06T05:56:49.543Z',
    },
  ],
  personas: [
    {
      id: '47a457be-49ec-477f-8c35-7768e0c851b1',
      name: 'first persona',
      slug: 'first-persona',
      role: 'Student',
      description: 'first persona description',
      headshotImage: {
        id: 'd1981e1f-d937-4ab5-8d24-4ba741391896',
        mediaType: 'image/jpeg',
        content: '',
        fileName: 'Headshot.jpg',
        description: 'A headshot image',
        createdAt: '2025-05-06T05:55:44.621Z',
        updatedAt: '2025-05-06T05:55:44.621Z',
      },
      bodyImage: {
        id: 'd4e68042-69c3-4132-840d-e1182d16ae00',
        mediaType: 'image/jpeg',
        content: '',
        fileName: 'Body.jpg',
        description: 'A full-body image',
        createdAt: '2025-05-06T05:55:44.720Z',
        updatedAt: '2025-05-06T05:55:44.720Z',
      },
      hidden: false,
      createdAt: '2025-05-06T05:55:44.863Z',
      updatedAt: '2025-05-06T05:55:44.863Z',
    },
  ],
  hidden: false,
  createdAt: '2025-05-06T05:56:49.543Z',
  updatedAt: '2025-05-06T05:56:49.543Z',
  issuer: {
    id: '8740067c-a83d-4928-b3bd-e06f359089ab',
    name: 'bc gov issuer',
    description: 'bc gov issuer created by showcase creator',
    type: 'ARIES',
    credentialDefinitions: [
      {
        id: 'dcaa2da9-428c-4202-9ce0-02264b92b34e',
        name: 'teacher',
        credentialSchema: {
          id: 'e5d2c7b1-26f9-45d4-be92-fe971da3fd79',
          name: 'teacher',
          version: 'v1.0.1',
          identifierType: 'DID',
          source: 'CREATED',
          attributes: [
            {
              id: 'fb8d0ab5-d814-4a5b-a4b9-fa93d9c99227',
              name: 'awdaw',
              value: '1',
              type: 'STRING',
              createdAt: '2025-05-05T20:32:54.032Z',
              updatedAt: '2025-05-05T20:32:54.032Z',
            },
          ],
          createdAt: '2025-05-05T10:59:11.823Z',
          updatedAt: '2025-05-05T20:32:54.033Z',
        },
        version: 'v1.0.1',
        type: 'ANONCRED',
        source: 'CREATED',
        representations: [],
        icon: {
          id: '88f09784-29e6-43a4-b37d-4585c33c7d2d',
          mediaType: 'image/jpeg',
          content: '',
          fileName: 'example.jpg',
          description: 'Example asset',
          createdAt: '2025-05-05T10:59:11.943Z',
          updatedAt: '2025-05-05T10:59:11.943Z',
        },
        createdAt: '2025-05-05T10:59:12.159Z',
        updatedAt: '2025-05-05T10:59:15.221Z',
        approvedBy: {},
        approvedAt: '2025-05-05T10:59:15.221Z',
      },
    ],
    credentialSchemas: [
      {
        id: 'e5d2c7b1-26f9-45d4-be92-fe971da3fd79',
        name: 'teacher',
        version: 'v1.0.1',
        identifierType: 'DID',
        source: 'CREATED',
        attributes: [
          {
            id: 'fb8d0ab5-d814-4a5b-a4b9-fa93d9c99227',
            name: 'awdaw',
            value: '1',
            type: 'STRING',
            createdAt: '2025-05-05T20:32:54.032Z',
            updatedAt: '2025-05-05T20:32:54.032Z',
          },
        ],
        createdAt: '2025-05-05T10:59:11.823Z',
        updatedAt: '2025-05-05T20:32:54.033Z',
      },
    ],
    createdAt: '2025-05-05T10:59:12.369Z',
    updatedAt: '2025-05-05T10:59:15.436Z',
  },
} as unknown as IssuanceScenario
describe('issuanceScenarioToIssuanceScenarioRequest', () => {
  it('should convert an issuance scenario to an issuance scenario request', () => {
    const result = issuanceScenarioToIssuanceScenarioRequest(issuanceScenario)
    expect(result.issuer).toStrictEqual(issuanceScenario.issuer?.id)
    expect(result.personas).toStrictEqual(issuanceScenario.personas.map((persona) => persona.id))
    expect(result.slug).toStrictEqual(issuanceScenario.slug)
    expect(result.name).toStrictEqual(issuanceScenario.name)
    expect(result.description).toStrictEqual(issuanceScenario.description)
  })

  it('should convert an issuance step to an issuance step request', () => {
    const result = stepToStepRequest(issuanceScenario.steps[4])

    expect(result.asset).toStrictEqual(issuanceScenario.steps[4].asset?.id)
    expect(result.description).toStrictEqual(issuanceScenario.steps[4].description)
    expect(result.order).toStrictEqual(issuanceScenario.steps[4].order)
    expect(result.title).toStrictEqual(issuanceScenario.steps[4].title)
    expect(result.type).toStrictEqual(issuanceScenario.steps[4].type)
  })

  it('should convert an issuance action to an issuance action request', () => {
    // @ts-expect-error: issuanceScenario.steps[4].actions[0] cannot be undefined
    const result = actionToStepRequestAction(issuanceScenario.steps[4].actions[0])
    // @ts-expect-error: issuanceScenario.steps[4].actions[0] cannot be undefined
    expect(result.actionType).toStrictEqual(issuanceScenario.steps[4].actions[0].actionType)
    // @ts-expect-error: issuanceScenario.steps[4].actions[0] cannot be undefined
    expect(result.title).toStrictEqual(issuanceScenario.steps[4].actions[0].title)
    // @ts-expect-error: issuanceScenario.steps[4].actions[0] cannot be undefined
    expect(result.text).toStrictEqual(issuanceScenario.steps[4].actions[0].text)

    // @ts-expect-error: issuanceScenario.steps[4].actions[0] cannot be undefined
    expect(result.credentialDefinitionId).toStrictEqual(issuanceScenario.steps[4].actions[0].credentialDefinitionId)
    // @ts-expect-error: issuanceScenario.steps[4].actions[0] cannot be undefined
    expect(result.connectionId).toStrictEqual(issuanceScenario.steps[4].actions[0].connectionId)
    // @ts-expect-error: issuanceScenario.steps[4].actions[0] cannot be undefined
    expect(result.goToStep).toStrictEqual(issuanceScenario.steps[4].actions[0].goToStep)
  })
})
