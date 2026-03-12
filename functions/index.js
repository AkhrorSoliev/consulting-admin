const { setGlobalOptions } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

setGlobalOptions({ maxInstances: 10, cpu: 0.5 });

const telegram = require("./src/endpoints/telegram");
const registry = require("./src/endpoints/registry");
const userMgmt = require("./src/endpoints/userManagement");
const misc = require("./src/endpoints/misc");
const { downloadProxy } = require("./src/downloadProxy");

Object.assign(exports, telegram, registry, userMgmt, misc, { downloadProxy });
