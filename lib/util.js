const { isAbsolute, join } = require("path");


module.exports.absolutizePath = function(root, path) {
	return !isAbsolute(path)
		? join(root, path)
		: path;
};