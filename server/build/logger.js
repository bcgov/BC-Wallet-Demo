"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestLogger = void 0;
const core_1 = require("@aries-framework/core");
const fs_1 = require("fs");
const tslog_1 = require("tslog");
function logToTransport(logObject) {
    (0, fs_1.appendFileSync)('logs.txt', JSON.stringify(logObject) + '\n');
}
class TestLogger extends core_1.BaseLogger {
    constructor(logLevel, name) {
        super(logLevel);
        // Map our log levels to tslog levels
        this.tsLogLevelMap = {
            [core_1.LogLevel.test]: 'silly',
            [core_1.LogLevel.trace]: 'trace',
            [core_1.LogLevel.debug]: 'debug',
            [core_1.LogLevel.info]: 'info',
            [core_1.LogLevel.warn]: 'warn',
            [core_1.LogLevel.error]: 'error',
            [core_1.LogLevel.fatal]: 'fatal',
        };
        this.logger = new tslog_1.Logger({
            name,
            minLevel: this.logLevel == core_1.LogLevel.off ? undefined : this.tsLogLevelMap[this.logLevel],
            ignoreStackLevels: 5,
            attachedTransports: [
                {
                    transportLogger: {
                        silly: logToTransport,
                        debug: logToTransport,
                        trace: logToTransport,
                        info: logToTransport,
                        warn: logToTransport,
                        error: logToTransport,
                        fatal: logToTransport,
                    },
                    // always log to file
                    minLevel: 'silly',
                },
            ],
        });
    }
    log(level, message, data) {
        const tsLogLevel = this.tsLogLevelMap[level];
        if (data) {
            this.logger[tsLogLevel](message, data);
        }
        else {
            this.logger[tsLogLevel](message);
        }
    }
    test(message, data) {
        this.log(core_1.LogLevel.test, message, data);
    }
    trace(message, data) {
        this.log(core_1.LogLevel.trace, message, data);
    }
    debug(message, data) {
        this.log(core_1.LogLevel.debug, message, data);
    }
    info(message, data) {
        this.log(core_1.LogLevel.info, message, data);
    }
    warn(message, data) {
        this.log(core_1.LogLevel.warn, message, data);
    }
    error(message, data) {
        this.log(core_1.LogLevel.error, message, data);
    }
    fatal(message, data) {
        this.log(core_1.LogLevel.fatal, message, data);
    }
}
exports.TestLogger = TestLogger;
