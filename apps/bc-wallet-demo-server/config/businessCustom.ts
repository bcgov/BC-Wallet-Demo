import type { CustomCharacter } from '../src/content/types'
import { getDateInt } from '../src/utils/dateint'

export const businessCustom: CustomCharacter = {
  name: 'Dave',
  type: 'Proprietor',
  image: '/public/student/student.svg',
  hidden: true,
  revocationInfo: [
    {
      credentialName: 'Digital Business Card',
      credentialIcon: '/public/student/icon-student.svg',
      title: 'Revoke your Digital Business Card',
      description:
        'BC Registries allows you to revoke your Digital Business Card "if":\n• there is a problem with your credential.\n• your device was lost or stolen and you want to secure your personal information.',
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
      onboardingStep: 'CHOOSE_WALLET',
      iconLight: '/public/common/icon-wallet-light.svg',
      iconDark: '/public/common/icon-wallet-dark.svg',
    },
    {
      name: 'notification',
      onboardingStep: 'ACCEPT_CREDENTIAL',
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
      title: 'Meet Dave',
      text: "Meet Dave (that's you in this demo!). Dave is a sole proprietor. To help make his life easier, BC Registries is going to offer Dave a Digital Business Card to put in his BC Wallet.",
    },
    {
      screenId: 'SETUP_START',
      title: "Let's get started!",
      text: 'BC Wallet is a new app for storing and using credentials on your smartphone. Credentials are things like IDs, licenses and diplomas. \nUsing your BC Wallet is fast and simple. In the future it can be used online and in person. You approve every use, and share only what is needed. \nIn this demo, you will use your Digital Business Card to prove who you are and access services online instead of in-person.',
      image: '/public/common/getStarted.svg',
    },
    {
      screenId: 'CHOOSE_WALLET',
      title: 'Install BC Wallet',
      text: 'First, install the BC Wallet app onto your smartphone. Select the button below for instructions and the next step.',
      image: '/public/common/app-store-screenshots.png',
    },
    {
      screenId: 'CONNECT',
      title: 'Connect with BC Registries',
      text: 'Imagine, as Dave, you are logged into the BC Registries website (see below). They want to offer you a Digital Business Card. Use your BC Wallet to scan the QR code from the website.',
      image: '/public/student/onboarding-connect-light.svg',
      issuer_name: 'BC Registries',
    },
    {
      screenId: 'ACCEPT_CREDENTIAL',
      title: 'Accept your digital business card',
      text: "Your wallet now has a secure and private connection with BC Registries. You should have received an offer in BC Wallet for a Digital Business Card.\nReview what they are sending, and choose 'Accept offer'.",
      image: '/public/common/onboarding-credential-light.svg',
      credentials: [
        {
          name: 'Digital Business Card',
          version: process.env.BUSINESS_VERSION ?? '1.0.0',
          icon: '/public/student/icon-student.svg',
          attributes: [
            {
              name: 'business_name',
              value: `DAVE'S CUPCAKES`,
            },
            {
              name: 'business_type',
              value: 'BC Sole Proprietorship',
            },
            {
              name: 'company_status',
              value: 'ACTIVE',
            },
            {
              name: 'cra_business_number',
              value: '000000000000001',
            },
            {
              name: 'credential_id',
              value: '00000001',
            },
            {
              name: 'family_name',
              value: 'CHUNG',
            },
            {
              name: 'given_names',
              value: 'DAVID, THOMAS',
            },
            {
              name: 'identifier',
              value: 'FM000001',
            },
            {
              name: 'registered_on_dateint',
              value: `${getDateInt(-1)}`,
            },
            {
              name: 'role',
              value: 'PROPRIETOR',
            },
          ],
        },
      ],
    },
    {
      screenId: 'SETUP_COMPLETED',
      title: "You're all set!",
      text: 'Congratulations, you’ve just received your first digital credential. It is safely stored in your wallet and ready to be used. So, what are you waiting for? Let’s go!',
      image: '/public/common/onboarding-completed-light.svg',
    },
  ],
  useCases: [
    {
      id: 'cityOfVancouver',
      name: 'City of Vancouver',
      screens: [
        {
          screenId: 'START',
          title: 'Getting a <Result of Successful Proof>',
          text: "Dave (that's you in this demo!) can get <Result of Successful Proof>. In this example, you will just tell City of Vancouver you're the owner of your business.",
          image: '/public/student/useCases/store/card-school.svg',
        },
        {
          screenId: 'CONNECTION',
          title: "Start proving you're the owner of your business",
          text: "Imagine, as Dave, you are in <Process> for City of Vancouver. They're offering you <Service> if you can prove you're the owner of your business. First, scan the QR code.",
          image: '/public/student/useCases/store/cool-clothes-no-overlay.png',
          verifier: { name: 'City of Vancouver', icon: '/public/student/useCases/store/logo-university.png' },
        },
        {
          screenId: 'PROOF',
          title: 'Confirm the information to send',
          text: "BC Wallet will now ask you to confirm what to send. Notice how it will only share if the credential has expired, not even the expiry date itself gets shared. You don't have to share anything else for it to be trustable.",
          requestOptions: {
            title: 'City of Vancouver',
            text: 'City of Vancouver would like some of your business information.',
            requestedCredentials: [
              {
                icon: '/public/student/useCases/school/icon-university-card.png',
                name: 'Digital Business Card',
                schema_id: 'K9igebFysBL6jcBwR8bKuN:2:Digital Business Card:1.0.0',
                properties: ['business_name', 'business_type', 'company_status', 'family_name', 'given_names'],
              },
            ],
          },
        },
        {
          screenId: 'STEP_END',
          title: "You're done!",
          text: "You proved that you're the owner of your business, and City of Vancouver <Result of Successful Proof>. It only took a few seconds, you revealed minimal information, and City of Vancouver could easily and automatically trust what you sent.",
          image: '/public/student/student-accepted.svg',
        },
      ],
    },
  ],
}
