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
exports.CredDefService = void 0;
const core_1 = require("@aries-framework/core");
const typedi_1 = require("typedi");
let CredDefService = class CredDefService {
    constructor(agent) {
        this.credentialDefinitions = [];
        this.agent = agent;
        this.init();
    }
    getCredentialDefinitionIdByTag(tag) {
        const def = this.credentialDefinitions.find((x) => x.tag === tag);
        if (!def) {
            throw new Error(`CredentialDefinition not found for ${tag}`);
        }
        return def.id;
    }
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.credentialDefinitions.length === 0) {
                yield this.init();
            }
            return this.credentialDefinitions;
        });
    }
    getAllCredentialsByConnectionId(connectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const credentials = yield this.agent.credentials.getAll();
            const filtered = credentials.filter((cred) => cred.connectionId === connectionId);
            return filtered.map((c) => c.toJSON());
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const cd1 = yield this.createCredentialDefinition({
                schemaId: 'Trx3R1frdEzbn34Sp1jyX:2:student_card:1.0',
                supportRevocation: false,
                tag: 'Student Card',
            });
            // "attributes": [
            //   "Name", "Street", "City", "Date of birth", "Nationality"
            // ]
            // const cd2 = await this.createCredentialDefinition({
            //   schemaId: 'GW9GbSntDFutu2qQra2DXd:2:BC VC Pilot Certificate:1.0.1',
            //   supportRevocation: false,
            //   tag: 'BC Pilot',
            // })
            //"attrNames": [
            //   "Security code", "Card number", "Issuer", "Holder", "Valid until"
            // ],
            // const cd3 = await this.createCredentialDefinition({
            //   schemaId: 'q7ATwTYbQDgiigVijUAej:2:Airplane Ticket:1.0',
            //   supportRevocation: false,
            //   tag: 'Airplane Ticket',
            // })
            // "attrNames": [
            //   "Airline", "Class", "Seat", "Passenger"
            // ],
            // const cd4 = await this.createCredentialDefinition({
            //   schemaId: 'q7ATwTYbQDgiigVijUAej:2:Conference Pass:1.0.0',
            //   supportRevocation: false,
            //   tag: 'Conference Pass',
            // })
            // "attrNames": [
            //   "Name", "Nationality"
            // ],
            // const cd5 = await this.createCredentialDefinition({
            //   schemaId: 'q7ATwTYbQDgiigVijUAej:2:Hotel Keycard:1.0.0',
            //   supportRevocation: false,
            //   tag: 'Hotel Keycard',
            // })
            // "attrNames": [
            //   "name", "room"
            // ],
            // const cd6 = await this.createCredentialDefinition({
            //   schemaId: 'q7ATwTYbQDgiigVijUAej:2:University Card:1.0.2',
            //   supportRevocation: false,
            //   tag: 'University Card',
            // })
            // "attrNames": [
            //   "Date of birth", "StudentID", "Valid until", "University", "Faculty", "Name"
            // ],
            // const cd7 = await this.createCredentialDefinition({
            //   schemaId: "q7ATwTYbQDgiigVijUAej:2:Master's Degree:1.0.0",
            //   supportRevocation: false,
            //   tag: `Master's Degree`,
            // })
            // "attrNames": [
            //   "Graduate", "Date", "Field", "Institute"
            // ],
            // const cd8 = await this.createCredentialDefinition({
            //   schemaId: 'q7ATwTYbQDgiigVijUAej:2:Proof of Employment:1.0.0',
            //   supportRevocation: false,
            //   tag: `Proof of Employment`,
            // })
            // "attrNames": [
            //   "Date", "Organization", "Title", "Name"
            // ]
            // const cd9 = await this.createCredentialDefinition({
            //   schemaId: 'q7ATwTYbQDgiigVijUAej:2:Rent Agreement:1.0.1',
            //   supportRevocation: false,
            //   tag: `Rent Agreement`,
            // })
            // "attributes": [
            //   "Landlord", "Name", "Rent", "Start date", "End date"
            // ]
            // const cd10 = await this.createCredentialDefinition({
            //   schemaId: 'q7ATwTYbQDgiigVijUAej:2:Laptop Invoice:1.0.1',
            //   supportRevocation: false,
            //   tag: `Laptop Invoice`,
            // })
            // "attrNames": [
            //  "Street", "Store", "Name", "City", "Product", "Price", "Date"
            // ]
            // const cd11 = await this.createCredentialDefinition({
            //   schemaId: 'q7ATwTYbQDgiigVijUAej:2:Crypto Wallet:1.0.2',
            //   supportRevocation: false,
            //   tag: `Crypto Wallet`,
            // })
            // "attrNames": [
            //  "Address", "Balance"
            // ]
            // const cd12 = await this.createCredentialDefinition({
            //   schemaId: 'q7ATwTYbQDgiigVijUAej:2:Gym Membership:1.0',
            //   supportRevocation: false,
            //   tag: `Gym Membership`,
            // })
            // "attrNames": [
            //  "Name", "Valid until", "Date of birth"
            // ],
            // this.credentialDefinitions = [cd1, cd2, cd3, cd4, cd5, cd6, cd7, cd8, cd9, cd10, cd11, cd12]
            this.credentialDefinitions = [cd1];
        });
    }
    createCredentialDefinition(credentialDefinitionRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const schema = yield this.agent.ledger.getSchema(credentialDefinitionRequest.schemaId);
            return yield this.agent.ledger.registerCredentialDefinition({
                schema,
                supportRevocation: credentialDefinitionRequest.supportRevocation,
                tag: credentialDefinitionRequest.tag,
            });
        });
    }
};
__decorate([
    (0, typedi_1.Inject)(),
    __metadata("design:type", core_1.Agent)
], CredDefService.prototype, "agent", void 0);
CredDefService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [core_1.Agent])
], CredDefService);
exports.CredDefService = CredDefService;
