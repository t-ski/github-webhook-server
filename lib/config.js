/**
 * Module containing the mandatory configuration file reading
 * and preperation mechanism.
 */


const config = {
	defaultPort: 9797
};


const { existsSync } = require("fs");

const { absolutizePath } = require("./util");


// Prepare and expose config file in object representation (providing defaults)
module.exports.readConfig = function(path = "./")  {
	path = absolutizePath(process.cwd(), path)
		.replace(/(\.json)?$/i, ".json");

	if(!existsSync(path)) {
		throw new ReferenceError(`Required config file does not exist '${path}'`);
	}

	const configObj = {
		port: config.defaultPort,
		hooks: [],
		
		...require(path)
	};

	if(configObj.hooks.length === 0) {
		throw new ReferenceError("Given config does not provide any webhook entities");
	}

	return configObj;
};

/**
 * Config file format / sample:
 * 
 * {
 *     "name": "my-webhook server"	// GLOBAL
 *     "port": 8155,				// GLOBAL
 *     "hooks": [					// HOOK-WISE / SPECIFIC
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

// TODO: Specific hook names for monitoring