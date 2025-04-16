export const DEFAULT_JSON = {
  name: 'Bob',
  type: 'Test',
  headshot_image: '',
  body_image: '',
  description: "This is Bob's description.",
  credentials: {
    student_card: {
      issuer_name: 'Test College',
      name: 'test_card',
      version: '1.10',
      icon: '',
      attributes: [
        {
          name: 'student_first_name',
          value: 'Bob',
          type: 'string',
        },
        {
          name: 'student_last_name',
          value: 'Smith',
        },
        {
          name: 'expiry_date',
          value: '20270517',
          type: 'dateint',
        },
      ],
    },
    test_card_id: {
      issuer_name: 'My Workplace',
      name: 'test_card',
      version: '1.10',
      icon: '',
      attributes: [
        {
          name: 'student_first_name',
          value: 'Bob',
          type: 'string',
        },
        {
          name: 'student_last_name',
          value: 'Smith',
        },
        {
          name: 'expiry_date',
          value: '20270517',
          type: 'dateint',
        },
      ],
    },
  },
  revocationInfo: [
    {
      credentialName: 'Test Card',
      credentialIcon: '',
      title: 'Revoke your Test card',
      description:
        'Test College allows you to revoke your Student Card if:\n• there is a problem with your credential.\n• your device was lost or stolen and you want to secure your personal information.',
    },
  ],
  progressBar: [
    {
      name: 'person',
      onboardingStep: 'PICK_CHARACTER',
      iconLight: '',
      iconDark: '',
    },
    {
      name: 'moon',
      onboardingStep: 'SETUP_START',
      iconLight: '',
      iconDark: '',
    },
    {
      name: 'wallet',
      onboardingStep: 'CHOOSE_WALLET',
      iconLight: '',
      iconDark: '',
    },
    {
      name: 'notification',
      onboardingStep: 'ACCEPT_CREDENTIAL',
      iconLight: '',
      iconDark: '',
    },
    {
      name: 'balloon',
      onboardingStep: 'SETUP_COMPLETED',
      iconLight: '',
      iconDark: '',
    },
  ],
  onboarding: [
    {
      screenId: 'PICK_CHARACTER',
      title: 'Meet Ana',
      text: "Meet Ana (that's you in this demo!). Ana is a student at Test College. To help make student life easier, BestBC College is going to offer Alice a digital Student Card to put in her BC Wallet.",
    },
    {
      screenId: 'SETUP_START',
      title: "Let's get started!",
      text: 'BC Wallet is a new app for storing and using credentials on your smartphone. Credentials are things like IDs, licenses and diplomas. \nUsing your BC Wallet is fast and simple. In the future it can be used online and in person. You approve every use, and share only what is needed. \nIn this demo, you will use two credentials to prove who you are and access court materials online instead of in-person.',
      image: '',
    },
    {
      screenId: 'CHOOSE_WALLET',
      title: 'Install BC Wallet',
      text: 'First, install the BC Wallet app onto your smartphone. Select the button below for instructions and the next step.',
      image: '',
    },
    {
      screenId: 'CONNECT',
      title: 'Connect with Test College',
      text: 'Imagine, as Alice, you are logged into the BestBC College website (see below). They want to offer you a Digital Student Card. Use your BC Wallet to scan the QR code from the website.',
      image: '',
    },
    {
      screenId: 'ACCEPT_CREDENTIAL',
      title: 'Accept your test card',
      text: "Your wallet now has a secure and private connection with BestBC College. You should have received an offer in BC Wallet for a Student Card.\nReview what they are sending, and choose 'Accept offer'.",
      image: '',
      credentials: ['test_card_id'],
    },
    {
      screenId: 'SETUP_COMPLETED',
      title: "You're all set!",
      text: 'Congratulations, you’ve just received your first digital credentials. They are safely stored in your wallet and ready to be used. So, what are you waiting for? Let’s go!',
      image: '',
    },
  ],
  scenarios: [
    {
      id: 'testClothesOnline',
      name: 'Cool Clothes Online',
      overview: {
        title: 'Getting a student discount',
        text: "Bob (that's you in this demo!) can get a student discount on her online purchase. In this example, you will just tell Cool Clothes Online you're a student.",
        image: '/student/useCases/store/card-school.svg',
      },
      summary: {
        title: "You're done!",
        text: "You proved that you're a student, and Cool Clothes Online gave you the discount. It only took a few seconds, you revealed minimal information, and Cool Clothes Online could easily and automatically trust what you sent.",
        image: '/student/student-accepted.svg',
      },
      steps: [
        {
          screenId: 'OvertestClothesOnlineView2',
          type: 'BASIC',
          title: 'Getting a student discount',
          text: "BC Wallet will now ask you to confirm what to send. Notice how it will only share if the credential has expired, not even the expiry date itself gets shared. You don't have to share anything else for it to be trustable.",
          requestOptions: {
            type: 'OOB',
            title: 'Cool Clothes Online Request',
            text: 'Cool Clothes Online would like some of your personal information.',
            proofRequest: {
              attributes: {
                test_card_id: {
                  attributes: ['student_first_name', 'student_last_name'],
                  restrictions: ['test_card_id'],
                },
                student_card: {
                  attributes: ['student_first_name', 'student_last_name'],
                  restrictions: ['student_card'],
                },
              },
              predicates: {
                test_card_id_expiry_date: {
                  name: 'expiry_date',
                  type: '>=',
                  value: 20230517,
                  restrictions: ['test_card_id'],
                },
                student_card_expiry_date: {
                  name: 'expiry_date',
                  type: '>=',
                  value: 20230517,
                  restrictions: ['student_card'],
                },
              },
            },
          },
        },
        {
          screenId: 'testClothesOnlineStep1',
          type: 'CONNET_AND_VERIFY',
          title: 'Confirm the information to send',
          text: "BC Wallet will now ask you to confirm what to send. Notice how it will only share if the credential has expired, not even the expiry date itself gets shared. You don't have to share anything else for it to be trustable.",
          requestOptions: {
            type: 'OOB',
            title: 'Cool Clothes Online Request',
            text: 'Cool Clothes Online would like some of your personal information.',
            proofRequest: {
              attributes: {
                test_card_id: {
                  attributes: ['student_first_name', 'student_last_name'],
                  restrictions: ['test_card_id'],
                },
                student_card: {
                  attributes: ['student_first_name', 'student_last_name'],
                  restrictions: ['student_card'],
                },
              },
              predicates: {
                test_card_id_expiry_date: {
                  name: 'expiry_date',
                  type: '>=',
                  value: 20230517,
                  restrictions: ['test_card_id'],
                },
                student_card_expiry_date: {
                  name: 'expiry_date',
                  type: '>=',
                  value: 20230517,
                  restrictions: ['student_card'],
                },
              },
            },
          },
        },
        {
          screenId: 'OvertestClothesOnlineView3',
          type: 'BASIC',
          title: "You're Done",
          text: "BC Wallet will now ask you to confirm what to send. Notice how it will only share if the credential has expired, not even the expiry date itself gets shared. You don't have to share anything else for it to be trustable.",
          requestOptions: {
            type: 'OOB',
            title: 'Cool Clothes Online Request',
            text: 'Cool Clothes Online would like some of your personal information.',
            proofRequest: {
              attributes: {
                test_card_id: {
                  attributes: ['student_first_name', 'student_last_name'],
                  restrictions: ['test_card_id'],
                },
                student_card: {
                  attributes: ['student_first_name', 'student_last_name'],
                  restrictions: ['student_card'],
                },
              },
              predicates: {
                test_card_id_expiry_date: {
                  name: 'expiry_date',
                  type: '>=',
                  value: 20230517,
                  restrictions: ['test_card_id'],
                },
                student_card_expiry_date: {
                  name: 'expiry_date',
                  type: '>=',
                  value: 20230517,
                  restrictions: ['student_card'],
                },
              },
            },
          },
        },
      ],
    },
    {
      id: 'UniversityParkingPermit',
      name: 'University Parking permit',
      overview: {
        title: 'Getting a student discount',
        text: "Bob (that's you in this demo!) can get a student discount on her online purchase. In this example, you will just tell Cool Clothes Online you're a student.",
        image: '/student/useCases/store/card-school.svg',
      },
      summary: {
        title: "You're done!",
        text: "You proved that you're a student, and Cool Clothes Online gave you the discount. It only took a few seconds, you revealed minimal information, and Cool Clothes Online could easily and automatically trust what you sent.",
        image: '/student/student-accepted.svg',
      },
      steps: [
        {
          screenId: 'OverView',
          type: 'OverView',
          title: 'Getting a student discount',
          text: "BC Wallet will now ask you to confirm what to send. Notice how it will only share if the credential has expired, not even the expiry date itself gets shared. You don't have to share anything else for it to be trustable.",
          requestOptions: {
            type: 'OOB',
            title: 'Cool Clothes Online Request',
            text: 'Cool Clothes Online would like some of your personal information.',
            proofRequest: {
              attributes: {
                test_card_id: {
                  attributes: ['student_first_name', 'student_last_name'],
                  restrictions: ['test_card_id'],
                },
                student_card: {
                  attributes: ['student_first_name', 'student_last_name'],
                  restrictions: ['student_card'],
                },
              },
              predicates: {
                test_card_id_expiry_date: {
                  name: 'expiry_date',
                  type: '>=',
                  value: 20230517,
                  restrictions: ['test_card_id'],
                },
                student_card_expiry_date: {
                  name: 'expiry_date',
                  type: '>=',
                  value: 20230517,
                  restrictions: ['student_card'],
                },
              },
            },
          },
        },
        {
          screenId: 'testClothesOnlineStep1',
          type: 'CONNET_AND_VERIFY',
          title: 'Confirm the information to send',
          text: "BC Wallet will now ask you to confirm what to send. Notice how it will only share if the credential has expired, not even the expiry date itself gets shared. You don't have to share anything else for it to be trustable.",
          requestOptions: {
            type: 'OOB',
            title: 'Cool Clothes Online Request',
            text: 'Cool Clothes Online would like some of your personal information.',
            proofRequest: {
              attributes: {
                test_card_id: {
                  attributes: ['student_first_name', 'student_last_name'],
                  restrictions: ['test_card_id'],
                },
                student_card: {
                  attributes: ['student_first_name', 'student_last_name'],
                  restrictions: ['student_card'],
                },
              },
              predicates: {
                test_card_id_expiry_date: {
                  name: 'expiry_date',
                  type: '>=',
                  value: 20230517,
                  restrictions: ['test_card_id'],
                },
                student_card_expiry_date: {
                  name: 'expiry_date',
                  type: '>=',
                  value: 20230517,
                  restrictions: ['student_card'],
                },
              },
            },
          },
        },
        {
          screenId: 'Done',
          type: 'OverView',
          title: "You're Done",
          text: "BC Wallet will now ask you to confirm what to send. Notice how it will only share if the credential has expired, not even the expiry date itself gets shared. You don't have to share anything else for it to be trustable.",
          requestOptions: {
            type: 'OOB',
            title: 'Cool Clothes Online Request',
            text: 'Cool Clothes Online would like some of your personal information.',
            proofRequest: {
              attributes: {
                test_card_id: {
                  attributes: ['student_first_name', 'student_last_name'],
                  restrictions: ['test_card_id'],
                },
                student_card: {
                  attributes: ['student_first_name', 'student_last_name'],
                  restrictions: ['student_card'],
                },
              },
              predicates: {
                test_card_id_expiry_date: {
                  name: 'expiry_date',
                  type: '>=',
                  value: 20230517,
                  restrictions: ['test_card_id'],
                },
                student_card_expiry_date: {
                  name: 'expiry_date',
                  type: '>=',
                  value: 20230517,
                  restrictions: ['student_card'],
                },
              },
            },
          },
        },
      ],
    },
  ],
}
