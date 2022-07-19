/**
 * Module containing the web server instance.
 */


const config = {
	requestLimit: 5
};


const { createServer } = require("http");
const { normalize: normalizePath, dirname } = require("path");
const { createHmac, timingSafeEqual } = require("crypto");
const { exec, execFile } = require("child_process");

const { readConfig } = require("./config");
const { absolutizePath } = require("./util");


const configPath = process.argv[2];

const CONFIG = readConfig(configPath);


/*
 * Create the web server instance for the webhook handler.
 */
createServer((req, res) => {
	try {
		handleRequest(req, res);
	} catch(err) {
		console.error(err);

		respond(res, 500);
	}
})
	.listen(CONFIG.port, null, null, _ => {
		console.log(`GitHub webhook server listening :\x1b[33m${CONFIG.port}\x1b[0m`);
	});


/**
 * Maintain a simple request limiter by registering total requests
 * per client and checking against a configured limit.
 * The registration property for a client is cleared after one
 * minute each.
 */
const registeredClients = new Map();	// Simple request limiter


/**
 * Handle a request.
 * @param req HTTP request object
 * @param res HTTP response object
 */
function handleRequest(req, res) {
	// Check rate limiter first
	const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
	const clientRegistryEntry = registeredClients.get(clientIp) || {};
	
	clearTimeout(clientRegistryEntry.refreshTimeout);
	clientRegistryEntry.refreshTimeout = setTimeout(_ => registeredClients.clear());

	clientRegistryEntry.amount++;
	
	registeredClients.set(clientIp, clientRegistryEntry);

	if(clientRegistryEntry.amount >= config.requestLimit) {
		respond(res, 429);

		return;
	}

	// Check for correct HTTP method
	if(req.method.toUpperCase() === "POST") {
		respond(res, 405);

		return;
	}

	// Find adressed hook (if exists)
	let addressedHook;
	for(const hook in CONFIG.hooks) {
		if(normalizePath(hook.endpoint || "") === normalizePath(req.url)) {
			addressedHook = hook;

			break;
		}
	}

	if(!addressedHook
	|| (!addressedHook.cmd && !addressedHook.module)) {
		respond(res, 404);
		
		return;
	}
	
	// Gather request body to perform on
	let body = [];
	
	req.on("error", (err) => {
		console.error(err);

		respond(res, 500);
	});
	
	req.on("data", (chunk) => {
		body.push(chunk);
	});
	
	req.on("end", _ => {
		// Parse request body
		try {
			body = JSON.parse(Buffer.from(body).toString());
		} catch {
			respond(res, 403);

			return;
		}

		// Validate request
		const signature = Buffer.from(req.headers["x-hub-signature-256"] || "", "utf8");
		const hmac = createHmac("sha256", addressedHook.secret);
		const digest = Buffer.from(`sha256=${hmac.update(body).digest("hex")}`, "utf8");
	
		if(signature.length !== digest.length
		|| !timingSafeEqual(digest, signature)) {
			respond(res, 403);

			return;
		}
	
		// Handle valid request according to configured strategy

		// TDOD: Default action? Pull?
		// TODO: Configure accepted branch?
		curCwd = addressedHook.cwd || dirname(configPath);

		addressedHook.cmd
		&& exec(addressedHook.cmd, {
			cwd: curCwd
		}, (err, stdout, stderr) => {
			err
			&& console.error(err);
			stdout
			&& console.log(stdout);
			stderr
			&& console.error(stderr);
		});

		addressedHook.module
		&& execFile(absolutizePath(curCwd, addressedHook.module.replace(/(\.js)$/i, ".js")), {
			cwd: curCwd
		}, (err, stdout, stderr) => {
			err
			&& console.error(err);
			stdout
			&& console.log(stdout);
			stderr
			&& console.error(stderr);
		});
		
		respond(res, 200);
	});
}

/**
 * Respond for a given entity.
 * @param res Associated HTTP response object
 * @param {Number} status Response status
 * @param {String} [message] Optional response message
 */
function respond(res, status, message = null) {
	res.statusCode = status;

	res.end(message);
}