import { IssuanceScenario, PresentationScenario, Showcase } from "bc-wallet-openapi"

export const presentationScenarioFixture = {
  "id": "c1242480-090c-4c11-b57e-e9974f95d0d3",
  "name": "Add your student exam results",
  "slug": "add-your-student-exam-results-GBQZXG",
  "description": "Presentation scenario for first persona",
  "type": "PRESENTATION",
  "steps": [
    {
      "id": "15d6437c-1d27-404c-86bf-d05ad3649309",
      "title": "Scan the QR code to start sharing",
      "description": "Open the BC Wallet app and scan the QR code on the College website to start sharing your teacher credential with College Test.",
      "order": 0,
      "type": "HUMAN_TASK",
      "actions": [
        {
          "id": "22292f1b-00cf-4ba9-9aee-98f8be305662",
          "actionType": "ARIES_OOB",
          "title": "example_title",
          "text": "example_text",
          "createdAt": "2025-05-06T06:58:59.401Z",
          "updatedAt": "2025-05-06T06:58:59.401Z",
          "proofRequest": {
            "attributes": {},
            "predicates": {},
            "createdAt": "2025-05-06T06:58:59.401Z",
            "updatedAt": "2025-05-06T06:58:59.401Z"
          },
          "credentialDefinitionId": ""
        }
      ],
      "asset": {
        "id": "17341f2d-4fc6-4e76-b915-138821d123b4",
        "mediaType": "image/png",
        "content": "",
        "fileName": "1_ana_body.png",
        "createdAt": "2025-05-06T06:58:33.756Z",
        "updatedAt": "2025-05-06T06:58:33.756Z"
      },
      "createdAt": "2025-05-06T06:58:59.401Z",
      "updatedAt": "2025-05-06T06:58:59.401Z"
    },
    {
      "id": "12f1aa93-8aaa-4a86-bf48-24b0be2beeef",
      "title": "Confirm the information to send",
      "description": "BC Wallet will now ask you to confirm what to send. Notice how it will only share if the credential has not expired, not even the expiry date itself gets shared. You don't have to share anything else for it to be trustable.",
      "order": 1,
      "type": "SERVICE",
      "actions": [
        {
          "id": "4a3da9e2-9356-415e-9963-f1c709e97504",
          "actionType": "ARIES_OOB",
          "title": "example_title",
          "text": "example_text",
          "createdAt": "2025-05-06T06:58:59.401Z",
          "updatedAt": "2025-05-06T06:58:59.401Z",
          "proofRequest": {
            "attributes": {},
            "predicates": {},
            "createdAt": "2025-05-06T06:58:59.401Z",
            "updatedAt": "2025-05-06T06:58:59.401Z"
          },
          "credentialDefinitionId": "dcaa2da9-428c-4202-9ce0-02264b92b34e"
        }
      ],
      "asset": {
        "id": "82a4803f-7cc8-457f-8a0f-ddfa6bf3b50e",
        "mediaType": "image/png",
        "content": "",
        "fileName": "4_app-store-screenshots.png",
        "createdAt": "2025-05-06T06:58:37.978Z",
        "updatedAt": "2025-05-06T06:58:37.978Z"
      },
      "createdAt": "2025-05-06T06:58:59.401Z",
      "updatedAt": "2025-05-06T06:58:59.401Z"
    },
    {
      "id": "774a113b-f2e6-4437-b2df-b81fce4d41be",
      "title": "You are done!",
      "description": "You proved that you're a student, and you can now pass this online exam. It only took a few seconds, you revealed minimal information, and Test College could easily and automatically trust what you sent.",
      "order": 2,
      "type": "HUMAN_TASK",
      "actions": [
        {
          "id": "9adf3678-0279-4ad4-8336-cf83630f2c47",
          "actionType": "ARIES_OOB",
          "title": "example_title",
          "text": "example_text",
          "createdAt": "2025-05-06T06:58:59.401Z",
          "updatedAt": "2025-05-06T06:58:59.401Z",
          "proofRequest": {
            "attributes": {},
            "predicates": {},
            "createdAt": "2025-05-06T06:58:59.401Z",
            "updatedAt": "2025-05-06T06:58:59.401Z"
          },
          "credentialDefinitionId": ""
        }
      ],
      "asset": {
        "id": "62752cba-9d4a-44be-b13b-f81f207ba108",
        "mediaType": "image/png",
        "content": "",
        "fileName": "3_getStarted.png",
        "createdAt": "2025-05-06T06:58:52.230Z",
        "updatedAt": "2025-05-06T06:58:52.230Z"
      },
      "createdAt": "2025-05-06T06:58:59.401Z",
      "updatedAt": "2025-05-06T06:58:59.401Z"
    }
  ],
  "personas": [
    {
      "id": "47a457be-49ec-477f-8c35-7768e0c851b1",
      "name": "first persona",
      "slug": "first-persona",
      "role": "Student",
      "description": "first persona description",
      "headshotImage": {
        "id": "d1981e1f-d937-4ab5-8d24-4ba741391896",
        "mediaType": "image/jpeg",
        "content": "",
        "fileName": "Headshot.jpg",
        "description": "A headshot image",
        "createdAt": "2025-05-06T05:55:44.621Z",
        "updatedAt": "2025-05-06T05:55:44.621Z"
      },
      "bodyImage": {
        "id": "d4e68042-69c3-4132-840d-e1182d16ae00",
        "mediaType": "image/jpeg",
        "content": "",
        "fileName": "Body.jpg",
        "description": "A full-body image",
        "createdAt": "2025-05-06T05:55:44.720Z",
        "updatedAt": "2025-05-06T05:55:44.720Z"
      },
      "hidden": false,
      "createdAt": "2025-05-06T05:55:44.863Z",
      "updatedAt": "2025-05-06T05:55:44.863Z"
    }
  ],
  "hidden": false,
  "createdAt": "2025-05-06T06:58:59.401Z",
  "updatedAt": "2025-05-06T06:58:59.401Z",
  "relyingParty": {
    "id": "a9c43078-19b2-4c2f-917c-f0ae2c7af963",
    "name": "bc gov relying party",
    "description": "bc gov relying party created by showcase creator",
    "type": "ARIES",
    "credentialDefinitions": [
      {
        "id": "dcaa2da9-428c-4202-9ce0-02264b92b34e",
        "name": "teacher",
        "credentialSchema": {
          "id": "e5d2c7b1-26f9-45d4-be92-fe971da3fd79",
          "name": "teacher",
          "version": "v1.0.1",
          "identifierType": "DID",
          "source": "CREATED",
          "attributes": [
            {
              "id": "fb8d0ab5-d814-4a5b-a4b9-fa93d9c99227",
              "name": "awdaw",
              "value": "1",
              "type": "STRING",
              "createdAt": "2025-05-05T20:32:54.032Z",
              "updatedAt": "2025-05-05T20:32:54.032Z"
            }
          ],
          "createdAt": "2025-05-05T10:59:11.823Z",
          "updatedAt": "2025-05-05T20:32:54.033Z"
        },
        "version": "v1.0.1",
        "type": "ANONCRED",
        "source": "CREATED",
        "representations": [],
        "icon": {
          "id": "88f09784-29e6-43a4-b37d-4585c33c7d2d",
          "mediaType": "image/jpeg",
          "content": "",
          "fileName": "example.jpg",
          "description": "Example asset",
          "createdAt": "2025-05-05T10:59:11.943Z",
          "updatedAt": "2025-05-05T10:59:11.943Z"
        },
        "createdAt": "2025-05-05T10:59:12.159Z",
        "updatedAt": "2025-05-05T10:59:15.221Z",
        "approvedBy": {},
        "approvedAt": "2025-05-05T10:59:15.221Z"
      }
    ],
    "createdAt": "2025-05-05T10:59:12.635Z",
    "updatedAt": "2025-05-05T10:59:12.635Z"
  }
} as unknown as PresentationScenario

export const issuanceScenarioFixture = {
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

export const showcaseFixture = {
  "id": "1ed7c687-9625-4815-b8ea-6d9e1067bfa4",
  "tenantId": "tenant-bs599ndpygc",
  "name": "new shwocase",
  "slug": "new-shwocase",
  "description": "new shwocase 23 123",
  "status": "ARCHIVED",
  "completionMessage": "new shwocase 23 123",
  "hidden": true,
  "scenarios": [
    {
      "id": "1123e5bc-2719-4684-90e6-6443e3bd97d1",
      "name": "example_name",
      "slug": "example-name",
      "description": "example_description",
      "type": "ISSUANCE",
      "steps": [
        {
          "id": "2dfe53ba-8e52-4bde-835b-99e8cc5f143e",
          "title": "Meet dwadwadwa",
          "description": "Welcome to this showcase. Here you'll learn about digital credentials with dwadwadwa.",
          "order": 0,
          "type": "HUMAN_TASK",
          "actions": [],
          "createdAt": "2025-04-25T12:11:17.190Z",
          "updatedAt": "2025-04-25T12:11:17.190Z"
        },
        {
          "id": "2c173e8c-521c-4740-94d6-dc2bd6a278c7",
          "title": "Let's get started!",
          "description": "BC Wallet is a new app for storing and using credentials on your smartphone. Credentials are things like IDs, licenses and diplomas. Using your BC Wallet is fast and simple. In the future it can be used online and in person. You approve every use, and share only what is needed. In this demo, you will use two credentials to prove who you are and access court materials online instead of in-person.",
          "order": 1,
          "type": "HUMAN_TASK",
          "actions": [],
          "createdAt": "2025-04-25T12:11:17.190Z",
          "updatedAt": "2025-04-25T12:11:17.190Z"
        },
        {
          "id": "f3460ff2-12ed-4e36-b90e-25f9dc746c48",
          "title": "Install BC Wallet",
          "description": "First, install the BC Wallet app onto your smartphone. Select the button below for instructions and the next step.",
          "order": 2,
          "type": "HUMAN_TASK",
          "actions": [
            {
              "id": "bbd7cc6e-28a5-46f8-bc12-794c4cf6007f",
              "actionType": "CHOOSE_WALLET",
              "title": "example_title",
              "text": "example_text",
              "createdAt": "2025-04-25T12:11:17.190Z",
              "updatedAt": "2025-04-25T12:11:17.190Z"
            }
          ],
          "createdAt": "2025-04-25T12:11:17.190Z",
          "updatedAt": "2025-04-25T12:11:17.190Z"
        },
        {
          "id": "5d8a08d6-2490-4331-9e56-7fe670d685ca",
          "title": "Connect with BC College",
          "description": "Imagine, as dwadwadwa, you are logged into the BestBC College website (see below). They want to offer you a Digital Student Card. Use your BC Wallet to scan the QR code from the website.",
          "order": 3,
          "type": "HUMAN_TASK",
          "actions": [
            {
              "id": "afc2f8e8-094a-4fec-bc19-400aed79bf15",
              "actionType": "SETUP_CONNECTION",
              "title": "Download BC Wallet on your phone",
              "text": "To download, scan this QR code with your phone or select the app store icon below. You can also search for BC Wallet in your phone's app store.",
              "createdAt": "2025-04-25T12:11:17.190Z",
              "updatedAt": "2025-04-25T12:11:17.190Z"
            }
          ],
          "createdAt": "2025-04-25T12:11:17.190Z",
          "updatedAt": "2025-04-25T12:11:17.190Z"
        },
        {
          "id": "a306c392-ad0d-4a50-915f-2e0b82c451c2",
          "title": "Accept your student card",
          "description": "Your wallet now has a secure and private connection with BestBC College. You should have received an offer in BC Wallet for a Student Card.\nReview what they are sending, and choose 'Accept offer'.",
          "order": 4,
          "type": "SERVICE",
          "actions": [
            {
              "id": "371ebe86-b2d8-4e24-b1b0-ceb6563247db",
              "actionType": "ACCEPT_CREDENTIAL",
              "title": "Download BC Wallet on your phone",
              "text": "To download, scan this QR code with your phone or select the app store icon below. You can also search for BC Wallet in your phone's app store.",
              "createdAt": "2025-04-25T12:11:17.190Z",
              "updatedAt": "2025-04-25T12:11:17.190Z",
              "credentialDefinitionId": "a210c172-beb9-4bfa-a865-981014c4e3bc"
            }
          ],
          "createdAt": "2025-04-25T12:11:17.190Z",
          "updatedAt": "2025-04-25T12:11:17.190Z"
        },
        {
          "id": "a34af202-97ea-4d54-991a-b8d0f8c479f9",
          "title": "You're all set!",
          "description": "Congratulations, you've just received your first digital credentials. They are safely stored in your wallet and ready to be used. So, what are you waiting for? Let's go! We're done with this step. Next, we'll explore ways you can use your credentials.",
          "order": 5,
          "type": "HUMAN_TASK",
          "actions": [],
          "createdAt": "2025-04-25T12:11:17.190Z",
          "updatedAt": "2025-04-25T12:11:17.190Z"
        }
      ],
      "personas": [
        {
          "id": "1538c102-7044-44a6-856c-56d3d255ee3f",
          "name": "Ana",
          "slug": "ana-LBCyb8",
          "role": "Student",
          "description": "dwadwa",
          "headshotImage": {
            "id": "0049ffd8-a4c2-4012-8e00-c0cebb8e1ac6",
            "mediaType": "image/jpeg",
            "content": "base-64 image",
            "fileName": "Headshot.jpg",
            "description": "A headshot image",
            "createdAt": "2025-04-25T12:23:25.186Z",
            "updatedAt": "2025-04-25T12:23:25.186Z"
          },
          "bodyImage": {
            "id": "6f147ef9-d27c-4947-a735-48a0675ac987",
            "mediaType": "image/jpeg",
            "content": "base-64 image",
            "fileName": "Body.jpg",
            "description": "A full-body image",
            "createdAt": "2025-04-25T12:23:25.245Z",
            "updatedAt": "2025-04-25T12:23:25.245Z"
          },
          "hidden": false,
          "createdAt": "2025-04-25T12:11:01.471Z",
          "updatedAt": "2025-04-25T14:53:29.277Z"
        }
      ],
      "hidden": false,
      "createdAt": "2025-04-25T12:11:17.190Z",
      "updatedAt": "2025-04-25T12:11:17.190Z",
      "issuer": {
        "id": "fd673f9f-0872-46ae-90c9-45392db18e64",
        "name": "bc gov issuer",
        "description": "bc gov issuer created by showcase creator",
        "type": "ARIES",
        "credentialDefinitions": [
          {
            "id": "a210c172-beb9-4bfa-a865-981014c4e3bc",
            "name": "cred",
            "credentialSchema": {
              "createdAt": null,
              "updatedAt": null
            },
            "version": "1",
            "type": "ANONCRED",
            "representations": [],
            "icon": {
              "id": "e7908184-c07c-448f-8e4d-218b500bb5d2",
              "mediaType": "image/jpeg",
              "content": "base-64 image",
              "fileName": "example.jpg",
              "description": "Example asset",
              "createdAt": "2025-04-25T12:09:51.036Z",
              "updatedAt": "2025-04-25T12:09:51.036Z"
            },
            "createdAt": "2025-04-25T12:09:51.107Z",
            "updatedAt": "2025-04-25T12:10:04.267Z",
            "approvedBy": {},
            "approvedAt": "2025-04-25T12:10:04.267Z"
          }
        ],
        "credentialSchemas": [
          {
            "id": "20ce0e9d-dce6-4509-9b90-0c012e7fd2b9",
            "name": "cred",
            "version": "1",
            "identifierType": "DID",
            "source": "CREATED",
            "attributes": [
              {
                "id": "cd3de881-3777-4be9-af90-f57b75550361",
                "name": "name",
                "value": "ana",
                "type": "STRING",
                "createdAt": "2025-04-25T12:11:16.160Z",
                "updatedAt": "2025-04-25T12:11:16.160Z"
              }
            ],
            "createdAt": "2025-04-25T12:09:50.958Z",
            "updatedAt": "2025-04-25T12:11:16.161Z"
          }
        ],
        "createdAt": "2025-04-25T12:09:51.176Z",
        "updatedAt": "2025-04-25T12:10:04.347Z"
      }
    }
  ],
  "personas": [
    {
      "id": "1538c102-7044-44a6-856c-56d3d255ee3f",
      "name": "Ana",
      "slug": "ana-LBCyb8",
      "role": "Student",
      "description": "dwadwa",
      "headshotImage": {
        "id": "0049ffd8-a4c2-4012-8e00-c0cebb8e1ac6",
        "mediaType": "image/jpeg",
        "content": "base-64 image",
        "fileName": "Headshot.jpg",
        "description": "A headshot image",
        "createdAt": "2025-04-25T12:23:25.186Z",
        "updatedAt": "2025-04-25T12:23:25.186Z"
      },
      "bodyImage": {
        "id": "6f147ef9-d27c-4947-a735-48a0675ac987",
        "mediaType": "image/jpeg",
        "content": "base-64 image",
        "fileName": "Body.jpg",
        "description": "A full-body image",
        "createdAt": "2025-04-25T12:23:25.245Z",
        "updatedAt": "2025-04-25T12:23:25.245Z"
      },
      "hidden": false,
      "createdAt": "2025-04-25T12:11:01.471Z",
      "updatedAt": "2025-04-25T14:53:29.277Z"
    }
  ],
  "bannerImage": {
    "id": "19f0df95-152e-4dca-aa8e-f3b8603a7e6f",
    "mediaType": "image/jpeg",
    "content": "base-64 image",
    "createdAt": "2025-04-25T12:10:47.735Z",
    "updatedAt": "2025-04-25T12:10:47.735Z"
  },
  "createdAt": "2025-04-25T12:10:49.290Z",
  "updatedAt": "2025-04-25T13:17:18.649Z"
} as unknown as Showcase