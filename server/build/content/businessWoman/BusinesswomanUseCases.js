"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessWomanUseCases = void 0;
const BusinessWoman_1 = require("./BusinessWoman");
const Airtravel_1 = require("./useCases/Airtravel");
const Conference_1 = require("./useCases/Conference");
const Hotel_1 = require("./useCases/Hotel");
exports.BusinessWomanUseCases = {
    characterId: BusinessWoman_1.BusinessWoman.id,
    useCases: [Conference_1.Conference, Hotel_1.Hotel, Airtravel_1.AirTravel],
};
