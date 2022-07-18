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

	return {
		port: config.defaultPort,
		hooks: [],
		
		...require(path)
	};
}

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