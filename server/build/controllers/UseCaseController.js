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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseCaseController = void 0;
const routing_controllers_1 = require("routing-controllers");
const typedi_1 = require("typedi");
const UseCases_1 = __importDefault(require("../content/UseCases"));
const CredDefService_1 = require("./CredDefService");
let UseCaseController = class UseCaseController {
    constructor(service) {
        this.service = service;
    }
    /**
     * Retrieve use case by slug
     */
    getUseCaseBySlug(useCaseSlug) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const useCase = (_a = UseCases_1.default
                .find((x) => x.useCases.find((y) => y.slug === useCaseSlug))) === null || _a === void 0 ? void 0 : _a.useCases.find((z) => z.slug === useCaseSlug);
            if (!useCase) {
                throw new routing_controllers_1.NotFoundError(`use case with slug "${useCaseSlug}" not found.`);
            }
            const nwsec = [];
            useCase.sections.forEach((section) => {
                var _a, _b;
                nwsec.push(Object.assign(Object.assign({}, section), { issueCredentials: (_a = section.issueCredentials) === null || _a === void 0 ? void 0 : _a.map((x) => (Object.assign(Object.assign({}, x), { credentialDefinitionId: this.service.getCredentialDefinitionIdByTag(x.name) }))), requestedCredentials: (_b = section.requestedCredentials) === null || _b === void 0 ? void 0 : _b.map((x) => (Object.assign(Object.assign({}, x), { credentialDefinitionId: this.service.getCredentialDefinitionIdByTag(x.name) }))) }));
            });
            useCase.sections = nwsec;
            return useCase;
        });
    }
    /**
     * Retrieve all usecases for given character id
     */
    getUseCasesByCharId(characterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const UCs = UseCases_1.default.find((x) => x.characterId === characterId);
            if (!UCs) {
                throw new routing_controllers_1.NotFoundError(`Use cases for character with characterId "${characterId}" not found.`);
            }
            // eslint-disable-next-line no-console
            const lol = [];
            UCs.useCases.forEach((x) => {
                const nwsec = [];
                x.sections.forEach((section) => {
                    var _a, _b;
                    nwsec.push(Object.assign(Object.assign({}, section), { issueCredentials: (_a = section.issueCredentials) === null || _a === void 0 ? void 0 : _a.map((x) => (Object.assign(Object.assign({}, x), { credentialDefinitionId: this.service.getCredentialDefinitionIdByTag(x.name) }))), requestedCredentials: (_b = section.requestedCredentials) === null || _b === void 0 ? void 0 : _b.map((x) => (Object.assign(Object.assign({}, x), { credentialDefinitionId: this.service.getCredentialDefinitionIdByTag(x.name) }))) }));
                });
                x.sections = nwsec;
                lol.push(x);
            });
            return UCs.useCases;
        });
    }
};
__decorate([
    (0, typedi_1.Inject)(),
    __metadata("design:type", CredDefService_1.CredDefService)
], UseCaseController.prototype, "service", void 0);
__decorate([
    (0, routing_controllers_1.Get)('/:useCaseSlug'),
    __param(0, (0, routing_controllers_1.Param)('useCaseSlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UseCaseController.prototype, "getUseCaseBySlug", null);
__decorate([
    (0, routing_controllers_1.Get)('/character/:characterId'),
    __param(0, (0, routing_controllers_1.Param)('characterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UseCaseController.prototype, "getUseCasesByCharId", null);
UseCaseController = __decorate([
    (0, routing_controllers_1.JsonController)('/usecases'),
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [CredDefService_1.CredDefService])
], UseCaseController);
exports.UseCaseController = UseCaseController;
