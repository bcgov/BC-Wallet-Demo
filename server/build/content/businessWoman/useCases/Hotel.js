"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hotel = void 0;
const uuid_1 = require("uuid");
const types_1 = require("../../types");
const URL = '/public/businesswoman/useCases/hotel/';
exports.Hotel = {
    slug: 'hotel-booking',
    card: {
        title: 'Book a hotel room',
        image: `${URL}/hotel-card.svg`,
        description: `You are in the city for a business conference. During this two-day event you'll need to find a hotel to stay at.`,
    },
    stepper: [
        {
            id: (0, uuid_1.v4)(),
            name: 'Connect with Paramount Hotels',
            description: 'First up we need to setup a connection with Paramount Hotels.',
            steps: 3,
            section: 1,
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'Share your information',
            description: 'Next, Paramount Hotels would like some billing information.',
            steps: 6,
            section: 1,
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'Receive your keycard',
            description: 'Paramount Hotels issues a hotel room keycard.',
            steps: 8,
            section: 1,
        },
    ],
    sections: [
        {
            id: (0, uuid_1.v4)(),
            entity: {
                name: 'Paramount Hotels',
                icon: `${URL}/hotel-logo-hotel.png`,
                imageUrl: 'https://i.imgur.com/yO3u2DD.png',
            },
            colors: {
                primary: '#407BFF',
                secondary: '#bdd0fa',
            },
            requestedCredentials: [
                {
                    id: (0, uuid_1.v4)(),
                    name: 'Student ID Card',
                    icon: `/public/businesswoman/icon-businesswoman.svg`,
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
                    icon: `${URL}/hotel-icon-keycard.png`,
                },
            ],
            steps: [
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.START,
                    image: `${URL}/hotel-card.svg`,
                    title: 'Stay at a nice hotel',
                    description: `You are in the city for a TechCon 2021. It's a two-day event, so you'll need to find a hotel for your stay. Let's book a hotel room using verifiable credentials.`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.INFO,
                    title: 'Welcome to Paramount Hotels!',
                    description: `Paramount Hotels has the newest technology installed to make your stay as easy and carefree as possible. They're using verifiable credentials to create a smoothe check-in process.`,
                    image: `${URL}/hotel-counter.svg`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.CONNECTION,
                    title: 'Connect with Paramount Hotels',
                    description: `Use your wallet to make a connection with the hotel. Paramount Hotels has a QR-code available online, or at the reception desk.`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.INFO,
                    title: 'Paramount Hotels wants some information',
                    description: `To finalize your booking, you can share your billing information and proof of your idenity with Paramount Hotels. `,
                    image: `${URL}/hotel-qr.svg`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.PROOF,
                    title: 'Accept the request from Paramount Hotels',
                    description: `Grab your wallet, you've received a request for some information!`,
                    requestOptions: {
                        name: 'Paramount Hotels booking information',
                        comment: 'We would like some personal information for your hotel booking.',
                    },
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.INFO,
                    title: 'Your room is ready!',
                    description: `Great! You've been checked in and the room looks perfect. Now you'll receive your keycard in your wallet using verifiable credentials.`,
                    image: `${URL}/hotel-keycard.svg`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.CREDENTIAL,
                    title: 'Accept your hotel keycard.',
                    description: `Grab your wallet, and accept your new hotel keycard. You can use this credential to get acces to your room with your mobile phone.`,
                    useProof: false,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.END,
                    title: 'Congratulations, you did it!',
                    description: 'Great job on finishing this use case. These are the steps you took.',
                    endStepper: [
                        {
                            id: (0, uuid_1.v4)(),
                            title: 'You connected with the Hotel',
                            description: 'This secure connection is used for all of your communication with Paramount Hotels.',
                            image: `${URL}/hotel-qr.svg`,
                        },
                        {
                            id: (0, uuid_1.v4)(),
                            title: 'You shared your personal and billing information',
                            description: 'By accepting the request you safely shared your data with Paramount Hotels.',
                            image: `${URL}/hotel-keycard.svg`,
                        },
                        {
                            id: (0, uuid_1.v4)(),
                            title: `You obtained your keycard, right in your digital wallet.`,
                            description: 'This is now safely stored in your wallet.',
                            image: `${URL}/hotel-sleep.svg`,
                        },
                    ],
                },
            ],
        },
    ],
};
