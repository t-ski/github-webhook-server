/**
 * Module containing the mandatory configuration file reading
 * and preperation mechanism.
 */


const config = {
	defaultPort: 9797
};


const { existsSync } = require("fs");

const { absolutizePath } = require("./util");


// Check for config file existence
const configArg = process.argv[2] || "./";

const configPath = absolutizePath(process.cwd(), configArg)
.replace(/(\.json)?$/i, ".json");

if(!existsSync(configPath)) {
	throw new ReferenceError(`Required config file does not exist '${configPath}'`);
}


// Prepare and expose config file in object representation (providing defaults)
module.exports.CONFIG = {
	port: config.defaultPort,
	
	...require(configPath)
};


/**
 * Config file format / sample:
 * 
 * {
 *     "port": 8155,	// GLOBAL
 *     "hooks": [		// HOOK-WISE / LOCAL
 *         {
 *             "endpoint": "/endpoint",
 *             "secret": "abc...xyz",
 *             "cwd": "../app/",
 *             "cmd": "git pull && npm update",
 *             "module": "./"
 *         }, (...)
 *     ]
 * }
 */