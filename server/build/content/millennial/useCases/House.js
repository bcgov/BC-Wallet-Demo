"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.House = void 0;
const uuid_1 = require("uuid");
const types_1 = require("../../types");
const URL = '/public/millennial/useCases/house';
const date = new Date();
const today = Number(date.toISOString().replace('-', '').split('T')[0].replace('-', ''));
date.setFullYear(date.getFullYear() + 1);
const nextYear = Number(date.toISOString().replace('-', '').split('T')[0].replace('-', ''));
exports.House = {
    slug: 'rent-place',
    card: {
        title: 'Find a new place',
        image: `${URL}/house-card.svg`,
        description: "Let's look for a new place close to your new job in a nice neighborhood.",
    },
    stepper: [
        {
            id: (0, uuid_1.v4)(),
            name: 'See which apartments are available.',
            description: `Let's see what apartments are available.`,
            steps: 2,
            section: 1,
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'Share personal information.',
            description: 'You need to prove some stuff about yourself.',
            steps: 6,
            section: 1,
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'Receive rent agreement.',
            description: 'Receive your rent agreement in you wallet.',
            steps: 9,
            section: 1,
        },
    ],
    sections: [
        {
            id: (0, uuid_1.v4)(),
            entity: {
                name: `Mary's Real Estate`,
                icon: `${URL}/house-logo.png`,
                imageUrl: 'https://i.imgur.com/VVMbbsL.png',
            },
            colors: {
                primary: '#003366',
                secondary: '#F2ABAB',
            },
            requestedCredentials: [
                {
                    id: (0, uuid_1.v4)(),
                    name: 'Student ID Card',
                    icon: '/public/millennial/icon-millennial.svg',
                    properties: ['student_first_name', 'student_last_name', 'expiry_date'],
                },
            ],
            issueCredentials: [
                {
                    id: (0, uuid_1.v4)(),
                    name: 'BC Pilot',
                    attributes: [
                        { name: 'name', value: 'Jan van Dalen' },
                        { name: 'emailAddress', value: 'test@mail.com' },
                        { name: 'iss_dateint', value: '2025' },
                        { name: 'program', value: 'LSBC' },
                    ],
                    icon: '/public/millennial/useCases/house/house-icon-rent.png',
                },
            ],
            steps: [
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.START,
                    image: `${URL}/house-card.svg`,
                    description: `Renting a new place can be a hassle. Gathering documents, proving all kinds of information about yourself. Let's rent a new place using your credentials and your wallet to see how easy it can be!`,
                    title: `Find a new place.`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.INFO,
                    title: `Look at a place`,
                    description: `You've been browsing for new houses and your real estate agent Mary found an amazing place you can look at.`,
                    image: `${URL}/house-talking.svg`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.CONNECTION,
                    title: `Connect with Mary's Real Estate.`,
                    description: `To get house hunting with Mary, you need to make a connection through her company's QR code.`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.INFO,
                    title: 'Mary needs some verification.',
                    image: `${URL}/house-secure.svg`,
                    description: `You now have a secure connection. Using this connection, you are going to share some personal information that is needed to apply for homes.`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.PROOF,
                    title: 'Verify your name and proof of employment',
                    description: `Grab your wallet, you've received a request for some information! Share the information by accepting the request. `,
                    requestOptions: {
                        name: `Mary's Real Estate Proof Request`,
                        comment: 'Mary would like some of your personal information.',
                    },
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.INFO,
                    title: 'Everything checks out!',
                    description: `Congratulations! Because of verifiable credentials, your information was verified instantly. Now all that's left is to receive your rent agreement in your wallet! `,
                    image: `${URL}/house-agreement.svg`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.CREDENTIAL,
                    title: `Accept your rent agreement.`,
                    description: `Grab your wallet to accept your new rent agreement, you can now use it as proof for any process that needs it. `,
                    requestOptions: {
                        name: 'Mary Rent Agreement',
                        comment: 'Here is your rent agreement.',
                    },
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.INFO,
                    title: 'You have a new place!',
                    description: `First your job, now your house, you've been getting stuff done using verifiable credentials. No more couch surfing for you!`,
                    image: `${URL}/house-happy.svg`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.END,
                    title: 'Congratulations, you did it!',
                    description: 'Congratulations on finishing this use case.',
                    endStepper: [
                        {
                            id: (0, uuid_1.v4)(),
                            title: 'You found a great place to live.',
                            description: 'You selected the right house together with Mary.',
                            image: `${URL}/house-talking.svg`,
                        },
                        {
                            id: (0, uuid_1.v4)(),
                            title: 'You safely presented your data',
                            description: 'Without showing all of your data, you successfully shared the required information with Mary’s Real Estate.',
                            image: `${URL}/house-secure.svg`,
                        },
                        {
                            id: (0, uuid_1.v4)(),
                            title: 'You have a new place!',
                            description: `You finally managed to get your own place!`,
                            image: `${URL}/house-happy.svg`,
                        },
                    ],
                },
            ],
        },
    ],
};
