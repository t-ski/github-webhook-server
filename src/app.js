/**
 * Module containing the web server instance.
 */


const config = {
	requestLimit: 5
};


const { createServer } = require("http");
const { createHmac, timingSafeEqual } = require("crypto");

const { CONFIG } = require("./config");


// Web server
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
	const clientRegistryEntry = registeredClients.get(clientIp);
	
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

	if(req.url == config.pathname) {	// TODO: Find according
		respond(res, 404);
		
		return;
	}
	
	// Gather request body to perform on
	let body = [];
	
	req.on("error", (err) => {
		console.error(err);

		respond(res, 500);
	})
	
	req.on("data", (chunk) => {
		body.push(chunk);
	})
	
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
		const hmac = createHmac("sha256", config.secret);
		const digest = Buffer.from(`sha256=${hmac.update(body).digest("hex")}`, "utf8");
	
		if(signature.length !== digest.length
		|| !timingSafeEqual(digest, signature)) {
			respond(res, 403);

			return;
		}
	
		// Handle valid request according to configured strategy

		// TODO: Implement actions

		/* if(!config.resolve.commands) {
			return;
		}
		exec(config.resolve.commands, {
			cwd: CWD || ""
		}, (err, stdout, stderr) => {
			if(err) {
				console.error(err);
	
				return;
			}
	
			console.log(stdout);
			stderr && console.error(stderr);
		}); */
		
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