"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCleanup = void 0;
const cron_1 = require("cron");
const AgentCleanup = (agent) => {
    // “At 05:00 on Sunday.”
    return new cron_1.CronJob('0 5 * * 0', () => {
        console.log('Starting cleanup');
        agent.connections.getAll().then((connections) => {
            connections.map((connection) => agent.connections.deleteById(connection.id));
        });
        agent.credentials.getAll().then((credentials) => {
            credentials.map((credential) => agent.credentials.deleteById(credential.id));
        });
        agent.proofs.getAll().then((proofs) => {
            proofs.map((proof) => agent.proofs.deleteById(proof.id));
        });
        console.log('Cleanup completed');
    });
};
exports.AgentCleanup = AgentCleanup;
