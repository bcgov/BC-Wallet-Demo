"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnlineStore = void 0;
const uuid_1 = require("uuid");
const types_1 = require("../../types");
const URL = '/public/student/useCases/store';
const date = new Date();
date.setFullYear(date.getFullYear() - 18);
const todayDate = Number(date.toISOString().split('T')[0].replace(/-/g, ''));
exports.OnlineStore = {
    slug: 'store',
    card: {
        title: 'Get a student discount at an online store',
        // image: `${URL}/card-school.svg`,
        description: '',
    },
    stepper: [
        {
            id: (0, uuid_1.v4)(),
            name: `Start proving you're a student`,
            description: '',
            steps: 1,
            section: 1,
        },
        {
            id: (0, uuid_1.v4)(),
            name: `Confirm the information to send`,
            description: '',
            steps: 2,
            section: 1,
        },
        {
            id: (0, uuid_1.v4)(),
            name: `Done!`,
            description: '',
            steps: 3,
            section: 1,
        },
    ],
    sections: [
        {
            id: (0, uuid_1.v4)(),
            entity: {
                name: 'Cool Clothes Online',
                icon: `${URL}/logo-university.png`,
                imageUrl: 'https://i.imgur.com/KPrshWf.png',
            },
            colors: {
                primary: '#4686C6',
                secondary: '#c4dbf3',
            },
            requestedCredentials: [
                {
                    id: (0, uuid_1.v4)(),
                    name: 'Student Card',
                    icon: '/public/student/icon-student.svg',
                    // properties: ['expiry_date'],
                    predicates: { name: 'expiry_date', value: todayDate, type: '>=' },
                },
            ],
            issueCredentials: [],
            steps: [
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.START,
                    image: `${URL}/card-school.svg`,
                    title: 'Getting a student discount',
                    description: `Alice (that's you in this demo!) can get a student discount on her online purchase. In this example, you will just tell Cool Clothes Online you're a student`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.CONNECTION,
                    title: `Start proving you're a student`,
                    description: `Imagine, as Alice, you are in the checkout process for Cool Clothes Online. They're offering you a 15% discount on your purchase if you can prove you're a student. First, scan the QR code.`,
                    image: `${URL}/cool-clothes-no-overlay.png`,
                    overlay: {
                        header: `Students get 15% off their entire order`,
                        footer: `Scan the QR Code above with your digital wallet to prove you're a student`,
                    },
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.PROOF,
                    title: 'Confirm the information to send',
                    description: `BC Wallet will now ask you to confirm what to send. Notice how it will only share that you're a current student (i.e. yes or no). You don't have to share anything else for it to be trustable.`,
                    requestOptions: {
                        name: 'Cool Clothes Online Request',
                        comment: 'Cool Clothes Online would like some of your personal information.',
                    },
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.STEP_END,
                    title: `You're done!`,
                    description: `You proved that you're a student, and Cool Clothes Online gave you the discount. It only took a few seconds, you revealed minimal information, and Cool Clothes Online could easily and automatically trust what you sent.`,
                    image: `${URL}/student-accepted.svg`,
                },
            ],
        },
    ],
};
