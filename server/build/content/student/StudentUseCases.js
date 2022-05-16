"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentUseCases = void 0;
const Student_1 = require("./Student");
const OnlineStore_1 = require("./useCases/OnlineStore");
const StudyRoom_1 = require("./useCases/StudyRoom");
exports.StudentUseCases = {
    characterId: Student_1.Student.id,
    useCases: [OnlineStore_1.OnlineStore, StudyRoom_1.StudyRoom],
};
