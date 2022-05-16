"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessWoman = void 0;
const uuid_1 = require("uuid");
exports.BusinessWoman = {
    id: '2',
    image: '/public/businesswoman/businesswoman.svg',
    name: 'Joyce',
    type: 'Businesswoman',
    backstory: "Joyce is on her way to the top! She's the CEO of a fortune 500 company and is always working around the clock to keep business going, join her in her endeavor!",
    starterCredentials: [
        {
            id: (0, uuid_1.v4)(),
            name: 'Student ID Card',
            icon: '/public/businesswoman/icon-businesswoman.svg',
            attributes: [
                { name: 'student_first_name', value: 'Jan' },
                { name: 'student_last_name', value: 'Test' },
                { name: 'expiry_date', value: '05-05-2025' },
            ],
        },
    ],
};
