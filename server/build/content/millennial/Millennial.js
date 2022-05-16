"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Millennial = void 0;
const uuid_1 = require("uuid");
exports.Millennial = {
    id: '3',
    image: '/public/millennial/millennial.svg',
    name: 'Noah',
    type: 'Millennial',
    backstory: 'Web designer Noah loves to explore. He has spent the last year as a digital nomad, traveling and working around the globe, guide him through his next adventure!',
    starterCredentials: [
        {
            id: (0, uuid_1.v4)(),
            name: 'Student ID Card',
            icon: '/public/millennial/icon-millennial.svg',
            attributes: [
                { name: 'student_first_name', value: 'Jan' },
                { name: 'student_last_name', value: 'Test' },
                { name: 'expiry_date', value: '05-05-2025' },
            ],
        },
    ],
};
