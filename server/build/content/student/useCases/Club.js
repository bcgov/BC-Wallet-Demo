"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Club = void 0;
const uuid_1 = require("uuid");
const types_1 = require("../../types");
const URL = '/public/student/useCases/club';
const date = new Date();
date.setFullYear(date.getFullYear() - 18);
const ageDate = Number(date.toISOString().replace('-', '').split('T')[0].replace('-', ''));
exports.Club = {
    slug: 'club',
    card: {
        title: 'Go dancing at club Animo',
        image: `${URL}/club-card.svg`,
        description: `Club Animo is the newest club in town. Let’s prove our age without showing our ID to the bouncer.`,
    },
    stepper: [
        {
            id: (0, uuid_1.v4)(),
            name: 'Entering the club',
            description: 'Wait in line to enter the club.',
            steps: 1,
            section: 1,
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'Prove your age',
            description: 'Accept the request in your wallet to prove your age.',
            steps: 3,
            section: 1,
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'Enjoy the party',
            description: 'Enter the club and enjoy a night out with your friends!',
            steps: 4,
            section: 1,
        },
    ],
    sections: [
        {
            id: (0, uuid_1.v4)(),
            entity: {
                name: 'Club Animo',
                icon: `${URL}/club-logo-club.png`,
                imageUrl: 'https://i.imgur.com/GXOxwMt.png',
            },
            colors: {
                primary: '#5C45BF',
                secondary: '#B7AEE2',
            },
            requestedCredentials: [
                {
                    id: (0, uuid_1.v4)(),
                    name: 'Student ID Card',
                    icon: '/public/student/icon-student.svg',
                    predicates: { name: 'expiry_date', value: ageDate, type: '<=' },
                },
            ],
            steps: [
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.START,
                    image: `${URL}/club-card.svg`,
                    title: 'Going to an exclusive club',
                    description: `You are going dancing! Normally, the bouncer asks for your ID card, but not in this club. Club Animo supports verifiable credentials, and proving you're old enough to enter is now faster, safer and more secure. Let's try it out!`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.INFO,
                    title: `The bouncer asks you to scan the QR-code`,
                    description: `After waiting in line the bounder shows you a QR-code to scan to prove that you're old enough to enter the club.`,
                    image: `${URL}/club-data.svg`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.PROOF_OOB,
                    title: 'Scan the QR-Code to prove your age.',
                    description: `Grab your wallet, and scan the QR-code. A pop up will appear where you can share your age, without showing the rest of your personal information.`,
                    requestOptions: {
                        name: `Age Request`,
                        comment: `Club Animo wants to know if you're over 18`,
                    },
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.INFO,
                    title: `Party time!`,
                    description: `The bouncer gives you the OK-sign, and seconds later you’re flexing your moves on the dance floor!`,
                    image: `${URL}/club-dancing.svg`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.END,
                    title: `Congratulations, you did it!`,
                    description: 'Great job on finishing this use case. These are the steps you took.',
                    endStepper: [
                        {
                            id: (0, uuid_1.v4)(),
                            title: `No need for a connection`,
                            description: `This QR-code contained only the question about your age. No need to setup a connection for everyone you interact with.`,
                            image: `${URL}/club-scan-qr.svg`,
                        },
                        {
                            id: (0, uuid_1.v4)(),
                            title: 'Proved your age',
                            description: 'Without showing your date of birth, you proved that you are old enough to enter the club.',
                            image: `${URL}/club-data.svg`,
                        },
                        {
                            id: (0, uuid_1.v4)(),
                            title: 'Ready to party!',
                            description: `You partied all night long!`,
                            image: `${URL}/club-dancing.svg`,
                        },
                    ],
                },
            ],
        },
    ],
};
