/**
 * Module containing a trivial local storage interface for manipulating
 * (file) persistent data independent fro a specific runtime context.
 */


const config = {
	appDirName: "node-github-server",
	appFileName: "data"
};


const { existsSync, mkdirSync, writeFileSync, rmdirSync } = require("fs");
const { join } = require("path");


// Create app data directory / file if not yet done
const appDataDirPath = `${
	process.env.APPDATA
|| `${process.env.HOME}${(process.platform === "darwin") ? "/Library/Preferences" : "/.local/share"}`
}/${config.appDirName}`;
const appDataFilePath = join(appDataDirPath, `${config.appFileName}.json`);

!existsSync(appDataDirPath)
&& mkdirSync(appDataDirPath, {
	force: true,
	recursive: true
});


// Maintain a virtual image if the data dictionary (in objectrepresentation)
// => better performance
let curDataObj;
try {
	curDataObj = require(appDataFilePath);
} catch {
	curDataObj = {};
}


/**
 * Write the current state of the virtually maintained data to
 * the file system.
 */
function writeStateToFile() {
	writeFileSync(appDataFilePath, JSON.stringify(curDataObj));
}


module.exports.APP_DATA_DIR_PATH = appDataDirPath;


/**
 * Read data associated with a given key from the storage.
 * @param {String} key Data entry key
 * @returns Data associated with the given key
 */
module.exports.read = function(key) {
	return curDataObj[key];
};

/**
 * Write data associated with a given key to the storage.
 * @param {String} key Data entry key
 * @param {*} data Data to write
 */
module.exports.write = function(key, value) {
	curDataObj[key] = value;
    
	writeStateToFile();
};

/**
 * Check whether the key exists in the storage.
 * @param {String} key Data entry key
 * @returns {Boolean} Whether the key exists in the storage
 */
module.exports.exists = function(key) {
	return !!curDataObj[key];
};

/**
 * Clear data key from the storage.
 * @param {String} key Data entry key
 */
module.exports.clear = function(key) {
	delete curDataObj[key];

	writeStateToFile();
};

/**
 * Read all data from the storage retireving the virtual object.
 */
module.exports.readAll = function() {
	return curDataObj;
};


process.on("exit", _ => {
	// Always remove physical app data files from file system if none exists (anymore)
	(Object.keys(curDataObj).length === 0)
    && rmdirSync(appDataDirPath, {
    	force: true,
    	recursive: true
    });
});