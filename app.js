const {join, extname} = require("path");

const configPath = join(process.cwd(), process.argv[2]);

if(extname(configPath).toLowerCase() != ".json") {
	throw new ReferenceError("No path to config JSON file given")
}

const config = require();

var crypto = require("crypto");
const {exec} = require("child_process");

require("http").createServer((req, res) => {
	try {
		handleRequest(req, res);
	} catch(err) {
		console.error(err);
	}
}).listen(config.port, null, null, _ => {
	console.log(`GitHub webhook server started on port ${config.port}`);
});

function handleRequest(req, res) {
	if(req.method.toLowerCase() == "post" && req.url == config.pathname) {
		let body = [];

		req.on("error", (err) => {
			console.error(err);

			respond(res, 500);
		}).on("data", (chunk) => {
			body.push(chunk);
		}).on("end", _ => {
			body = Buffer.concat(body).toString();

			respond(res, 200);

			handlePayload(body, req.headers["x-hub-signature-256"]);
		});

		return;
	}
	
	respond(res, 404);
}

function respond(res, status) {
	res.statusCode = status;
	res.end();
}

function handlePayload(body, signature) {
	if(JSON.parse(body).repository.name != config.repositoryName) {
		return;
	}

	signature = Buffer.from(signature || "", "utf8");
	const hmac = crypto.createHmac("sha256", config.secret);
	const digest = Buffer.from(`sha256=${hmac.update(body).digest("hex")}`, "utf8");

	if(signature.length !== digest.length || !crypto.timingSafeEqual(digest, signature)) {
		return;
	}

	// IS VALID
	console.log("web hook successfully triggered due to push\n");

	if(!config.resolve.commands) {
		return;
	}
	exec(config.resolve.commands, {
		cwd: config.resolve.cwd || ""
	}, (err, stdout, stderr) => {
		if(err) {
			console.error(err);

			return;
		}

		console.log(stdout);
		stderr && console.error(stderr);
	});
}