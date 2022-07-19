#!/usr/bin/env node


/**
 * CLI interface module for global and background application maintenance.
 */


const { openSync, rmSync } = require("fs");
const { spawn, execSync } = require("child_process");
const { join } = require("path");

const { readConfig } = require("./config");
const storage = require("./storage");


process.on("exit", _ => console.log(""));	// Closing line break


/*
 * Parse and apply and CLI arguments.
 */
const helpText = `
\x1b[2m|\x1b[0m \x1b[1mgithub-webhook-server\x1b[0m \x1b[2m(<command> <option>?)+\x1b[0m \x1b[2m|\x1b[0m

  \x1b[1mArgument\x1b[0m \x1b[2m<option>?\x1b[0m\t\t\x1b[1mDescription\x1b[0m

\x1b[34m--start|-S \x1b[2m<path-to-config>\x1b[0m     Start a webhook server based on the given config file (*.json)
\x1b[34m--stop|-T \x1b[2m<port>\x1b[0m                Stop a webhook server listening on the given port
\x1b[34m--monitor|-M\x1b[0m                    Monitor all running webhook servers
\x1b[34m--help\x1b[0m                          Display help text
`;

/**
 * Check whether an argument has been given to the input.
 * @param {String} parsedName Parsed name to check for
 * @param {String} name Full argument name (--<name>)
 * @param {String} shorthand Argument shorthand (-<shorthand>)
 * @returns {Boolean} Whether the argument has been given
 */
const isArgument = (parsedName, name, shorthand) => {
	return (new RegExp(`^-(-${name.toLowerCase()}${shorthand ? `|${shorthand.toUpperCase()}`: ""})$`, "i"))
		.test(parsedName);
};

/*
 * Parse arguments in order of appearance (chained calls possible).
 */
let validArgs = 0;
const args = process.argv.slice(2);
while(args.length > 0) {
	const name = args.shift();

	validArgs++;

	console.log("");	// Section line break

	if(isArgument(name, "start", "S")) {	// START
		start(args.shift());
	} else
	if(isArgument(name, "stop", "T")) {		// STOP / TERMINATE
		stop(args.shift());
	} else
	if(isArgument(name, "monitor", "M")) {	// MONITOR
		monitor();
	} else
	if(isArgument(name, "help")) {			// HELP
		console.log(helpText.trim());
	} else {								// UNDEFINED
		validArgs--;

		console.error(`Unknown argument '${name}'`);
	}

	// TODO: Reload arg?
}

// Display usage helper message if neither argument was valid
if(validArgs <= 0) {
	console.error("\nSpecify a usage (type --help for usage information)");
}


/**
 * Check whether a given port is associated with an existing webhook server process.
 * @param {Number} port Port
 * @returns {Boolean} Whether is associated
 */
function isAssociatedServerProcess(port) {
	if(!storage.exists(port)) {
		return false;
	}

	const associatedData = storage.read(port);

	try {
		const actualPid = execSync(`lsof -i:${port} -t`);   // TODO: Windows, ... DOS
        
		return (associatedData.pid == parseInt(String(actualPid)));
	} catch {
		return false;
	}
}

/**
 * Start a webhook server based on a given config (per path).
 * @param {String} pathToConfig Path to the related config file (JSON)
 */
function start(pathToConfig) {
	const CONFIG = readConfig(pathToConfig);
    
	if(isAssociatedServerProcess(CONFIG.port)) {
		console.error("Webhook server already running");

		return;
	}

	const pipeOutFile = openSync(join(storage.APP_DATA_DIR_PATH, String(CONFIG.port)), "a");
    
	const app = spawn("node", [ join(__dirname, "/app.js"), pathToConfig ], {
		detached: true
	});

	// Consider spawn as SUCCESSFUL if child stdio is used
	app.stdout.on("data", message => {
		storage.write(CONFIG.port, {
			pid: app.pid,
			config: join(process.cwd(), pathToConfig)
		});

		process.stdout.write(String(message));

		app.stdio = [ "ipc", pipeOutFile, pipeOutFile ];    // TODO: Fix
		app.unref();	// Detach child process

		process.exit();
	});

	// Consider spawn as FAILED if child stderr is used
	app.stderr.on("data", message => {
		console.error("Webhook server could not b started:");
		process.stderr.write(String(message));
	});
}

/**
 * Stop a webhook server based on a given port.
 * Termination only to occur if the port is associated with a
 * webhook server process.
 * @param {Number} port Port
 */
function stop(port) {
	if(!storage.exists(port)) {
		console.error(`No webhook server running on port \x1b[33m:${port}\x1b[0m`);

		return;
	}

	const pid = storage.read(port).pid;
	const invalid = !isAssociatedServerProcess(port);

	storage.clear(port);

	rmSync(join(storage.APP_DATA_DIR_PATH, String(port)), {
		force: true
	});

	if(invalid) {
		console.error("No webhook server process found");

		storage.clear(port);

		return;
	}

	try {
		process.kill(pid, 9);
        
		console.log("Webhook server terminated");
	} catch(err) {
		console.error(err);
	}
}

/**
 * Monitor all active webhook server processes for management purposes.
 */
function monitor() {
	// TODO: Only list if open port is aassociated with registered pid
	const data = storage.readAll();
	const info = [];
	const indexPadLimit = String(Object.keys(data).length).length;
	const indentation = Array.from({ length: indexPadLimit }, _ => " ").join("");
	const usedConfigs = new Set();
	let i = 1;
	let maxSublineLength = 0;

	for(const port in data) {
		const hookObj = data[port];

		let configPath = hookObj.config.replace(/(\.json)?$/i, ".json");
		if(usedConfigs.has(configPath)) {
			configPath += " \x1b[2m(updated)\x1b[0m";
		} else {
			usedConfigs.add(configPath);
		}


		const processInfo = `${String(i++).padStart(indexPadLimit, " ")}. ${hookObj.name
			? `\x1b[33m${hookObj.name}\x1b[0m |` : ""
		}\x1b[0m${indentation} \x1b[2mPORT\x1b[0m \x1b[33m:${
			port
		}\x1b[0m${indentation}| ${
			isAssociatedServerProcess(port) ? `\x1b[2mPID\x1b[0m \x1b[33m${hookObj.pid}` : "\x1b[31mTERMINATED"
		}\x1b[0m\n${indentation}| \x1b[2mCONFIG\x1b[0m \x1b[34m${
			configPath
		}\x1b[0m\n${indentation}| \x1b[2mLOG FILE\x1b[0m \x1b[34m${
			join(storage.APP_DATA_DIR_PATH, String(port))
		}\x1b[0m`;

		maxSublineLength = Math.max(maxSublineLength,
			Math.max.apply(null, processInfo.split(/\n+/g).map(line => line.trim().length)));
        
		info.push(processInfo);
	}
    
	const subline = Array.from({ length: maxSublineLength }, _ => "–").join("");

	console.log((info.length > 0)
		? `\x1b[1mGitHub webhook servers\x1b[0m\n${
			info.join(`\n\x1b[2m${subline}\x1b[0m\n`)}`
		: "\x1b[31mNo active processes\x1b[0m");
}