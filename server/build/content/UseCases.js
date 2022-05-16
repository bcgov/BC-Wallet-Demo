"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BusinesswomanUseCases_1 = require("./businessWoman/BusinesswomanUseCases");
const MillennialUseCases_1 = require("./millennial/MillennialUseCases");
const StudentUseCases_1 = require("./student/StudentUseCases");
const useCases = [StudentUseCases_1.StudentUseCases, BusinesswomanUseCases_1.BusinessWomanUseCases, MillennialUseCases_1.MillennialUseCases];
exports.default = useCases;
