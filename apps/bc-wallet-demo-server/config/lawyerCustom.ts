import type { CustomCharacter } from '../src/content/types'
import { getDateInt } from '../src/utils/dateint'

const now = () => Math.floor(new Date().getTime() / 1000)

export const lawyerCustom: CustomCharacter = {
  name: 'Joyce',
  type: 'Lawyer',
  image: '/public/lawyer2/lawyer2.svg',
  description: 'Joyce is a member of the Law Society of British Columbia looking to access court materials online.',
  revocationInfo: [
    {
      credentialName: 'Person',
      credentialIcon: '/public/lawyer2/icon-lawyer2.svg',
      title: 'Revoke your Person Credential',
      description:
        'Revoking your credentials does not mean that is it unusable. Services may accept revoked credentials especially for information that is unchanging, such as your birthday.',
    },
    {
      credentialName: 'member_card',
      credentialIcon: '/public/lawyer2/icon-lawyer2.svg',
      title: 'Revoke your LSBC Member Card',
      description:
        'The Law Society of BC allows you to revoke your own Member Card if:\n• there is a problem with your credential.\n• your device was lost or stolen and you want to secure your personal information.',
    },
  ],
  progressBar: [
    {
      name: 'person',
      onboardingStep: 'PICK_CHARACTER',
      iconLight: '/public/common/icon-person-light.svg',
      iconDark: '/public/common/icon-person-dark.svg',
    },
    {
      name: 'moon',
      onboardingStep: 'SETUP_START',
      iconLight: '/public/common/icon-moon-light.svg',
      iconDark: '/public/common/icon-moon-dark.svg',
    },
    {
      name: 'wallet',
      onboardingStep: 'CONNECT_LSBC',
      iconLight: '/public/common/icon-wallet-light.svg',
      iconDark: '/public/common/icon-wallet-dark.svg',
    },
    {
      name: 'notification',
      onboardingStep: 'ACCEPT_PERSON',
      iconLight: '/public/common/icon-notification-light.svg',
      iconDark: '/public/common/icon-notification-dark.svg',
    },
    {
      name: 'balloon',
      onboardingStep: 'SETUP_COMPLETED',
      iconLight: '/public/common/icon-balloon-light.svg',
      iconDark: '/public/common/icon-balloon-dark.svg',
    },
  ],
  onboarding: [
    {
      screenId: 'PICK_CHARACTER',
      title: 'Meet Joyce',
      text: "Meet Joyce (that's you in this demo!). Joyce is a lawyer in good standing with The Law Society of British Columbia. We know this because she's got her physical Law Society of British Columbia Member Card. She's also a resident of British Columbia and has gone through the process to prove her identity with Service BC and has obtained a physical BC Services Card. This has allowed her to use in person services.",
    },
    {
      screenId: 'SETUP_START',
      title: "Let's get started!",
      text: 'BC Wallet is a new app for storing and using credentials on your smartphone. Credentials are things like IDs, licenses and diplomas. \nUsing your BC Wallet is fast and simple. In the future it can be used online and in person.You approve every use, and share only what is needed. \nIn this demo, you will use two credentials to prove who you are and access court materials online instead of in-person.',
      image: '/public/lawyer2/onboarding/scan.svg',
    },
    {
      screenId: 'GOING_DIGITAL',
      title: 'Going Digital',
      text: 'Over time, The Government of B.C. and the Law Society of British Columbia has been making things more convenient by offering a choice of accessing services online and in-person. Joyce has accumulated all physical credentials and has gone digital. She has been verified as a practising lawyer in B.C. and verified herself with the BC Services Card app.',
      image: '/public/lawyer2/onboarding/goingDigital.svg',
    },
    {
      screenId: 'ACCESS_COURT_MATERIALS',
      title: 'Accessing court materials',
      text: "Joyce has been going to the courthouse in person to access voice recordings and other confidential materials. Court Services Branch has let her know that she now has the choice of accessing court materials online. She just needs to prove she's a practising lawyer from B.C. and have a government issued ID with a matching name. She can get a digital lawyer member card from the Law Society of British Columbia and her Person credential from her BC Services Card app.",
      image: '/public/lawyer2/onboarding/loginLSBC.svg',
    },
    {
      screenId: 'CONNECT_LSBC',
      title: 'Get your lawyer credential',
      text: 'Joyce is now ready to be issued her Law Society of British Columbia Member Card. She has logged into her member portal and is ready to accept a digital version of that card. Open the BC Wallet app on your phone, hit the scan button and accept.',
      image: '/public/lawyer2/onboarding/lawyerCredPhone.svg',
      issuer_name: 'Law Society of BC (Demo)',
    },
    {
      screenId: 'ACCEPT_LSBC',
      title: 'Accept your lawyer credential',
      text: 'Check your phone. You’ve received a credential offer from the Law Society of British Columbia in your BC Wallet. You can use this credential to prove you’re a lawyer online.',
      image: '/public/lawyer2/onboarding/lawyerCredPhone.svg',
      credentials: [
        {
          name: 'member_card',
          version: process.env.LAWYER_VERSION ?? '1.0',
          icon: '/public/lawyer2/connection/lsbc-logo.png',
          attributes: [
            {
              name: 'Member Status',
              value: 'Active',
            },
            {
              name: 'Given Name',
              value: 'Joyce',
            },
            {
              name: 'PPID',
              value: 'MC12349',
            },
            {
              name: 'Member Status Code',
              value: '1',
            },
            {
              name: 'Surname',
              value: 'Lee-Martinez',
            },
          ],
        },
      ],
    },
    {
      screenId: 'CONNECT_PERSON',
      title: 'Get Person credential',
      text: 'Joyce gets her Person credential from the BC Services Card app. She starts the process within BC Wallet. For this demo you will scan this QR code to receive the credential offer.',
      image: '/public/lawyer2/onboarding/personCredPhone.svg',
      issuer_name: 'Service BC (Demo)',
    },
    {
      screenId: 'ACCEPT_PERSON',
      title: 'Accept your Person credential',
      text: 'Check your phone. You’ve received a credential offer from Service BC in your BC Wallet. You can use this credential to prove who you are online.',
      image: '/public/lawyer2/onboarding/personCredPhone.svg',
      credentials: [
        {
          name: 'Person',
          version: process.env.PERSON_VERSION ?? '1.0',
          icon: '/public/lawyer2/connection/bc-logo.png',
          attributes: [
            {
              name: 'postal_code',
              value: 'V8N2X6',
            },
            {
              name: 'picture',
              value:
                'data:image/png;base64,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',
            },
            {
              name: 'given_names',
              value: 'Joyce',
            },
            {
              name: 'family_name',
              value: 'Lee-Martinez',
            },
            {
              name: 'locality',
              value: 'BC',
            },
            {
              name: 'region',
              value: 'Victoria',
            },
            {
              name: 'street_address',
              value: '123 Test Rd',
            },
            {
              name: 'country',
              value: 'Canada',
            },
            {
              name: 'expiry_date_dateint',
              value: `${getDateInt(5)}`,
            },
            {
              name: 'birthdate_dateint',
              value: `${getDateInt(-19)}`,
            },
          ],
        },
      ],
    },
    {
      screenId: 'SETUP_COMPLETED',
      title: "You're all set!",
      text: 'Congratulations, you’ve just received your first digital credentials. They are safely stored in your wallet and ready to be used. So, what are you waiting for? Let’s go!',
      image: '/public/lawyer2/onboarding/lawyer2Success.svg',
    },
  ],
  useCases: [
    {
      id: 'courtServices',
      name: 'Court Services',
      screens: [
        {
          screenId: 'START',
          title: 'Gain access to court materials online',
          text: 'Joyce can gain entry to Access to Court Materials, a service online by Court Services Branch where lawyers can access court documents online. They require proof that you’re a practising lawyer in B.C. and a matching name to your lawyer member card.',
          image: '/public/lawyer2/useCases/courtServices/bothCreds.svg',
        },
        {
          screenId: 'CONNECTION',
          title: 'Start proving you’re a lawyer',
          text: 'As Joyce you’re now ready to prove you’re a practising lawyer in B.C. and your name to Court Services Branch and gain entry to Access to Court Materials online. Scan the QR code.',
          image: '/public/lawyer2/useCases/courtServices/courtServicesOverlay.png',
          verifier: { name: 'Court Services Branch (DEMO)', icon: '/public/lawyer2/connection/lsbc-logo.png' },
        },
        {
          screenId: 'PROOF',
          title: 'Confirm the information to send',
          text: 'BC Wallet will now ask you to confirm what to send. Notice how you’re not sharing your entire credential. Court Services Branch is requesting that you prove only what is needed.',
          requestOptions: {
            title: 'Court Services Branch (DEMO) Request',
            text: 'Court Services Branch (DEMO) would like some of your personal information.',
            requestedCredentials: [
              {
                icon: '/public/lawyer2/connection/lsbc-logo.png',
                name: 'member_card',
                schema_id: 'QEquAHkM35w4XVT3Ku5yat:2:member_card:1.54',
                properties: ['Given Name', 'Surname', 'PPID'],
              },
              {
                icon: '/public/lawyer2/connection/bc-logo.png',
                name: 'Person',
                schema_id: 'QEquAHkM35w4XVT3Ku5yat:2:Person:1.3',
                properties: ['given_names', 'family_name'],
              },
            ],
          },
        },
        {
          screenId: 'STEP_END',
          title: "You're done!",
          text: 'You’ve proved to Court Services Branch that you’re a practising lawyer from B.C. and your identity using your Person credential. You can now access court materials online from the comfort of your own home. It only took a few seconds and you revealed minimal information that Court Services Branch could easily and automatically trust.',
          image: '/public/lawyer2/onboarding/lawyer2Success.svg',
        },
      ],
    },
    {
      id: 'courtLibrary',
      name: 'Court Library',
      hidden: true,
      screens: [
        {
          screenId: 'START',
          title: 'Gain access to the Court Library in person',
          text: 'Joyce wants to gain access to the court library using her digital credentials. The court library requires that joyce provides photo identification.',
          image: '/public/lawyer2/useCases/courtServices/bothCreds.svg',
        },
        {
          screenId: 'CONNECTION',
          title: 'Start proving you’re a lawyer',
          text: 'As Joyce you’re now ready to prove you’re a practising lawyer in B.C. to the court library. Scan the QR code.',
          image: '/public/lawyer2/useCases/courtServices/courtServicesOverlay.png',
          verifier: { name: 'Court Library', icon: '/public/lawyer2/connection/lsbc-logo.png' },
        },
        {
          screenId: 'PROOF',
          title: 'Confirm the information to send',
          text: 'BC Wallet will now ask you to confirm what to send. Notice how you’re not sharing your entire credential. The Court Library is requesting that you prove only what is needed.',
          requestOptions: {
            title: 'Court Library (DEMO) Request',
            text: 'Court Library (DEMO) would like some of your personal information.',
            requestedCredentials: [
              {
                icon: '/public/lawyer2/connection/lsbc-logo.png',
                name: 'member_card',
                schema_id: 'QEquAHkM35w4XVT3Ku5yat:2:member_card:1.54',
                properties: ['Given Name', 'Surname', 'PPID'],
                nonRevoked: { to: now() },
              },
              {
                icon: '/public/lawyer2/connection/bc-logo.png',
                name: 'Person',
                schema_id: 'QEquAHkM35w4XVT3Ku5yat:2:Person:1.3',
                properties: ['given_names', 'family_name', 'picture'],
                nonRevoked: { to: now() },
              },
            ],
          },
        },
        {
          screenId: 'STEP_END',
          title: "You're done!",
          text: 'You’ve proved to the Court Library that you’re a practising lawyer from B.C. and your identity using your Person credential. You can now access court materials online from the comfort of your own home. It only took a few seconds and you revealed minimal information that Court Services Branch could easily and automatically trust.',
          image: '/public/lawyer2/onboarding/lawyer2Success.svg',
        },
      ],
    },
    {
      id: 'attestation',
      name: 'BC Wallet Attestation',
      hidden: true,
      screens: [
        {
          screenId: 'START',
          title: 'Verify a BC Wallet application',
          text: 'Verify that you are using a valid BC Wallet application.',
          image: '/public/lawyer2/useCases/courtServices/bothCreds.svg',
        },
        {
          screenId: 'CONNECTION',
          title: 'Connect to Attestation Service',
          text: "You're now ready to prove you're using a valid BC Wallet application. Scan the QR code.",
          image: '/public/lawyer2/useCases/courtServices/courtServicesOverlay.png',
          verifier: { name: 'BC Wallet Attestation', icon: '/public/lawyer2/connection/bc-logo.png' },
        },
        {
          screenId: 'PROOF',
          title: 'Confirm the information to send',
          text: 'BC Wallet will now ask you to confirm what to send. Notice how you’re not sharing your entire credential.',
          requestOptions: {
            title: 'Attestation (DEMO) Request',
            text: 'Attestation (DEMO) would like some of your personal information.',
            requestedCredentials: [
              {
                icon: '/public/lawyer2/connection/bc-logo.png',
                name: 'Certified Application',
                properties: ['Issued At', 'Assurance Level'],
                nonRevoked: { to: now() },
              },
              {
                icon: '/public/lawyer2/connection/bc-logo.png',
                name: 'Person',
                properties: ['given_names', 'family_name', 'picture'],
                nonRevoked: { to: now() },
              },
            ],
          },
        },
        {
          screenId: 'STEP_END',
          title: "You're done!",
          text: 'You’ve proved to the Attestation Service that you’re using a valid BC Wallet application. It only took a few seconds and you revealed minimal information that Attestation Service could easily and automatically trust.',
          image: '/public/lawyer2/onboarding/lawyer2Success.svg',
        },
      ],
    },
  ],
}
