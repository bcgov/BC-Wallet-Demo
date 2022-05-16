"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepType = void 0;
var StepType;
(function (StepType) {
    StepType[StepType["START"] = 0] = "START";
    StepType[StepType["INFO"] = 1] = "INFO";
    StepType[StepType["CONNECTION"] = 2] = "CONNECTION";
    StepType[StepType["PROOF"] = 3] = "PROOF";
    StepType[StepType["PROOF_OOB"] = 4] = "PROOF_OOB";
    StepType[StepType["CREDENTIAL"] = 5] = "CREDENTIAL";
    StepType[StepType["STEP_END"] = 6] = "STEP_END";
    StepType[StepType["END"] = 7] = "END";
})(StepType = exports.StepType || (exports.StepType = {}));
