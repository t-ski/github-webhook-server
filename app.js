const {join, extname, dirname} = require("path");

const configPath = join(process.cwd(), process.argv[2]);

if(extname(configPath).toLowerCase() != ".json") {
	throw new ReferenceError("No path to config JSON file given")
}

const config = require(configPath);
const CWD = join(process.cwd(), dirname(process.argv[2]), config.resolve.cwd);
console.log(CWD);
var crypto = require("crypto");
const {exec} = require("child_process");

require("http").createServer((req, res) => {
	try {
		handleRequest(req, res);
	} catch(err) {
		console.error(err);
	}
}).listen(config.port, null, null, _ => {
	console.log(`GitHub webhook server started on port ${config.port || 80}`);
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
	signature = Buffer.from(signature || "", "utf8");
	const hmac = crypto.createHmac("sha256", config.secret);
	const digest = Buffer.from(`sha256=${hmac.update(body).digest("hex")}`, "utf8");

	if(signature.length !== digest.length || !crypto.timingSafeEqual(digest, signature)) {
		return;
	}

	// IS VALID

	if(!config.resolve.commands) {
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
	});
}