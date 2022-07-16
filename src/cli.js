#!/usr/bin/env node


/**
 * CLI interface module for global and background application maintenance.
 */


const { CONFIG } = require("./config");
const storage = require("./storage");


// TODO: Implement args for background maintenance (start, terminate)


require("./app");   // TODO: Start and keep in background


storage.write("21312", CONFIG.port);