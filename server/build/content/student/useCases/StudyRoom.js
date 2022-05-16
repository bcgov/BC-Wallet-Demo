"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyRoom = void 0;
const uuid_1 = require("uuid");
const types_1 = require("../../types");
const URL = '/public/student/useCases/school';
const date = new Date();
date.setFullYear(date.getFullYear() + 1);
const nextYear = Number(date.toISOString().replace('-', '').split('T')[0].replace('-', ''));
exports.StudyRoom = {
    slug: 'study',
    card: {
        title: 'Book a study room',
        // image: `${URL}/card-sport.svg`,
        description: '',
    },
    stepper: [
        {
            id: (0, uuid_1.v4)(),
            name: `Start booking the room`,
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
                name: 'BestBC College',
                icon: `${URL}/logo-university.png`,
                imageUrl: 'https://i.imgur.com/CbkUgpH.png',
            },
            colors: {
                primary: '#92E3A9',
                secondary: '#C9EDD3',
            },
            requestedCredentials: [
                {
                    id: (0, uuid_1.v4)(),
                    name: 'Student Card',
                    icon: '/public/student/icon-student.svg',
                    properties: ['student_first_name'],
                },
            ],
            issueCredentials: [],
            steps: [
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.START,
                    image: `${URL}/card-school.svg`,
                    title: 'Book a study room',
                    description: `Alice has lots of work to do, and needs a study room for some peace and quiet. In this example, we'll present some info from our Student Card, but just what's needed to book the room.`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.CONNECTION,
                    title: 'Start booking the room',
                    description: `Imagine you're on the room booking page for BestBC College, abd you've chosen a data and time. Now they just need to confirm a few details. Scan the QR code to continue.`,
                    image: `${URL}/best-bc-college-no-overlay.png`,
                    overlay: {
                        header: 'Scan with your BC Wallet to login',
                    },
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.PROOF,
                    title: 'Confirm the information to send',
                    description: `BC Wallet will now ask you to confirm what to send for the booking. Notice how they only need your first name so they can display it on the booking screen. By providing anything from your student card, they automatically know you're a current student as well.`,
                    requestOptions: {
                        name: 'BestBC College Request',
                        comment: 'BestBC College would like some of your personal information.',
                    },
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.STEP_END,
                    title: `You're done!`,
                    description: `The room is booked. Just by proving your first name, Best BC College could trust your are a current student, and could let others know there's a booking without revealing too much about you.`,
                    image: `${URL}/student-accepted.svg`,
                },
            ],
        },
    ],
};
