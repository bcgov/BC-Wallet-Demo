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
exports.CharacterController = void 0;
const routing_controllers_1 = require("routing-controllers");
const typedi_1 = require("typedi");
const Characters_1 = __importDefault(require("../content/Characters"));
const CredDefService_1 = require("./CredDefService");
let CharacterController = class CharacterController {
    constructor(service) {
        this.service = service;
    }
    /**
     * Retrieve character by id
     */
    getCharacterById(characterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const character = Characters_1.default.find((x) => x.id === characterId);
            if (!character) {
                throw new routing_controllers_1.NotFoundError(`character with characterId "${characterId}" not found.`);
            }
            const lol = character.starterCredentials.map((x) => (Object.assign(Object.assign({}, x), { credentialDefinitionId: this.service.getCredentialDefinitionIdByTag(x.name) })));
            character.starterCredentials = lol;
            return character;
        });
    }
    /**
     * Retrieve all characters
     */
    getCharacters() {
        return __awaiter(this, void 0, void 0, function* () {
            const arr = [];
            Characters_1.default.forEach((char) => {
                arr.push(Object.assign(Object.assign({}, char), { starterCredentials: char.starterCredentials.map((x) => (Object.assign(Object.assign({}, x), { credentialDefinitionId: this.service.getCredentialDefinitionIdByTag(x.name) }))) }));
            });
            return arr;
        });
    }
};
__decorate([
    (0, typedi_1.Inject)(),
    __metadata("design:type", CredDefService_1.CredDefService)
], CharacterController.prototype, "service", void 0);
__decorate([
    (0, routing_controllers_1.Get)('/:characterId'),
    __param(0, (0, routing_controllers_1.Param)('characterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "getCharacterById", null);
__decorate([
    (0, routing_controllers_1.Get)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "getCharacters", null);
CharacterController = __decorate([
    (0, routing_controllers_1.JsonController)('/characters'),
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [CredDefService_1.CredDefService])
], CharacterController);
exports.CharacterController = CharacterController;
