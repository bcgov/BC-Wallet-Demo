"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MillennialUseCases = void 0;
const Millennial_1 = require("./Millennial");
const House_1 = require("./useCases/House");
const Job_1 = require("./useCases/Job");
const Laptop_1 = require("./useCases/Laptop");
exports.MillennialUseCases = {
    characterId: Millennial_1.Millennial.id,
    useCases: [Job_1.Job, House_1.House, Laptop_1.Laptop],
};
