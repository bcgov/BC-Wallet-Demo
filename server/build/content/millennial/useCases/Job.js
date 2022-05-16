"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = void 0;
const uuid_1 = require("uuid");
const types_1 = require("../../types");
const URL = '/public/millennial/useCases/job';
const date = new Date();
const today = Number(date.toISOString().replace('-', '').split('T')[0].replace('-', ''));
exports.Job = {
    slug: 'apply-for-job',
    card: {
        title: 'Apply for a new job',
        image: `${URL}/job-card.svg`,
        description: "A position just opened up at tech startup eCorp. Let's apply using verifiable credentials.",
    },
    stepper: [
        {
            id: (0, uuid_1.v4)(),
            name: 'Apply for a position at eCorp',
            description: `Setup a connection to apply for the position.`,
            steps: 2,
            section: 1,
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'Share your personal information',
            description: 'Share your personal information and prove your education.',
            steps: 5,
            section: 1,
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'Receive your Employee Badge',
            description: `Accept your Employee Badge as proof of employment.`,
            steps: 8,
            section: 1,
        },
    ],
    sections: [
        {
            id: (0, uuid_1.v4)(),
            entity: {
                name: `eCorp Limited`,
                icon: `${URL}/job-icon-company.png`,
                imageUrl: 'https://i.imgur.com/GtKPsqd.png',
            },
            colors: {
                primary: '#92E3A9',
                secondary: '#d8f8e1',
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
                    icon: `${URL}/job-icon-proof-of-employment.png`,
                },
            ],
            steps: [
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.START,
                    image: `${URL}/job-card.svg`,
                    title: 'Applying for a new job',
                    description: `You have been freelancing for a lot of companies the last few years. But last week a new position opened up at eCorp, the coolest tech startup. Let's apply for a job at eCorp using verifiable credentials.`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.CONNECTION,
                    title: 'Connect with eCorp Limited',
                    description: `To submit your application you need to make a connection with eCorp through the QR code in the job advert.`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.INFO,
                    title: 'Share your information',
                    image: `${URL}/job-private.svg`,
                    description: `You now have a secure connection. Using this connection, you are going to share some personal information that is needed to complete the application.`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.PROOF,
                    title: 'Share your information',
                    description: `Grab your wallet, you've received a request for some information! To finish the application process, share the information by accepting the request. `,
                    requestOptions: {
                        name: 'eCorp Limited Proof Request',
                        comment: 'eCorp Limited would like some of your personal information.',
                    },
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.INFO,
                    title: 'Your application has been approved.',
                    image: `${URL}/job-interview.svg`,
                    description: `Congratulations! You've found a great new job at eCorp. Before you tell anyone, first receive your employee badge.`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.CREDENTIAL,
                    title: `Here's your employee badge.`,
                    description: `Open your wallet, and accept your new student pass. You can use it to access all kinds of eCorp employee benefits or to prove that you work there.`,
                    requestOptions: {
                        name: 'eCorp Employee Badge',
                        comment: 'Here is your proof of employment.',
                    },
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.INFO,
                    title: `Welcome to the team!`,
                    description: `Go enjoy your time at the coolest startup out there right now!`,
                    image: `${URL}/job-onboarding.svg`,
                },
                {
                    id: (0, uuid_1.v4)(),
                    type: types_1.StepType.END,
                    title: 'Congratulations, you did it!',
                    description: 'Great job on finishing this use case. These are the steps you took.',
                    endStepper: [
                        {
                            id: (0, uuid_1.v4)(),
                            title: 'Submitted your Application',
                            description: `You've successfully submitted your application.`,
                            image: `${URL}/job-behind-laptop.svg`,
                        },
                        {
                            id: (0, uuid_1.v4)(),
                            title: 'Shared proof of your degree',
                            description: 'eCorp requested proof of your degree, so they could verify your education.',
                            image: `${URL}/job-private.svg`,
                        },
                        {
                            id: (0, uuid_1.v4)(),
                            title: 'You got hired!',
                            description: `eCorp accepted your application and issued you your employee badge as a credential.`,
                            image: `${URL}/job-onboarding.svg`,
                        },
                    ],
                },
            ],
        },
    ],
};
