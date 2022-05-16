"use strict";
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
const core_1 = require("@aries-framework/core");
const node_1 = require("@aries-framework/node");
const rest_1 = require("@aries-framework/rest");
const express_1 = require("express");
const ngrok_1 = require("ngrok");
const routing_controllers_1 = require("routing-controllers");
const typedi_1 = require("typedi");
const CredDefService_1 = require("./controllers/CredDefService");
const logger_1 = require("./logger");
const AgentCleanup_1 = require("./utils/AgentCleanup");
const utils_1 = require("./utils/utils");
const logger = new logger_1.TestLogger(process.env.NODE_ENV ? core_1.LogLevel.error : core_1.LogLevel.debug);
process.on('unhandledRejection', (error) => {
    if (error instanceof Error) {
        logger.fatal(`Unhandled promise rejection: ${error.message}`, { error });
    }
    else {
        logger.fatal('Unhandled promise rejection due to non-error error', {
            error,
        });
    }
});
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const endpoint = (_a = process.env.AGENT_ENDPOINT) !== null && _a !== void 0 ? _a : (yield (0, ngrok_1.connect)(5001));
    const agentConfig = {
        label: 'BC Wallet',
        walletConfig: {
            id: 'BC Wallet',
            key: (_b = process.env.AGENT_WALLET_KEY) !== null && _b !== void 0 ? _b : 'BC Wallet',
        },
        indyLedgers: [
            {
                id: 'CandyDev',
                genesisTransactions: utils_1.CANDY_DEV,
                isProduction: false,
            },
        ],
        logger: logger,
        publicDidSeed: process.env.AGENT_PUBLIC_DID_SEED,
        endpoints: [endpoint],
        autoAcceptConnections: true,
        autoAcceptCredentials: core_1.AutoAcceptCredential.ContentApproved,
        useLegacyDidSovPrefix: true,
        connectionImageUrl: 'https://i.imgur.com/g3abcCO.png',
    };
    const agent = new core_1.Agent(agentConfig, node_1.agentDependencies);
    const httpInbound = new node_1.HttpInboundTransport({
        port: 5001,
    });
    agent.registerInboundTransport(httpInbound);
    agent.registerOutboundTransport(new core_1.HttpOutboundTransport());
    yield agent.initialize();
    const app = (0, routing_controllers_1.createExpressServer)({
        controllers: [__dirname + '/controllers/**/*.ts', __dirname + '/controllers/**/*.js'],
        cors: true,
        routePrefix: '/demo',
    });
    httpInbound.app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if (typeof req.query.c_i === 'string') {
            try {
                const invitation = yield core_1.ConnectionInvitationMessage.fromUrl(req.url.replace('d_m=', 'c_i='));
                res.send(invitation.toJSON());
            }
            catch (error) {
                res.status(500);
                res.send({ detail: 'Unknown error occurred' });
            }
        }
    }));
    app.use('/public', (0, express_1.static)(__dirname + '/public'));
    const credDefService = new CredDefService_1.CredDefService(agent);
    (0, routing_controllers_1.useContainer)(typedi_1.Container);
    typedi_1.Container.set(CredDefService_1.CredDefService, credDefService);
    const job = (0, AgentCleanup_1.AgentCleanup)(agent);
    job.start();
    app.get('/server/last-reset', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        res.send(job.lastDate());
    }));
    yield (0, rest_1.startServer)(agent, {
        port: 5000,
        app: app,
    });
});
run();
