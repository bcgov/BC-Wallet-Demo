"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialController = void 0;
const core_1 = require("@aries-framework/core");
const routing_controllers_1 = require("routing-controllers");
const typedi_1 = require("typedi");
const CredDefService_1 = require("./CredDefService");
let CredentialController = class CredentialController {
    constructor(service) {
        this.service = service;
    }
    getAllCredentialsByConnectionId(connectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return this.service.getAllCredentialsByConnectionId(connectionId);
            }
            catch (error) {
                if (error instanceof core_1.RecordNotFoundError) {
                    throw new routing_controllers_1.NotFoundError(`credentials for connectionId "${connectionId}" not found.`);
                }
                throw new routing_controllers_1.InternalServerError(`something went wrong: ${error}`);
            }
        });
    }
};
__decorate([
    (0, typedi_1.Inject)(),
    __metadata("design:type", CredDefService_1.CredDefService)
], CredentialController.prototype, "service", void 0);
__decorate([
    (0, routing_controllers_1.Get)('/:connectionId'),
    __param(0, (0, routing_controllers_1.Param)('connectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CredentialController.prototype, "getAllCredentialsByConnectionId", null);
CredentialController = __decorate([
    (0, routing_controllers_1.JsonController)('/credentials'),
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [CredDefService_1.CredDefService])
], CredentialController);
exports.CredentialController = CredentialController;
