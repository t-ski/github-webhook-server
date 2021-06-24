#!/usr/bin/env node

const {exec} = require("child_process");
const {join} = require("path");

exec(`node ${join(__dirname, "app.js")} ${process.argv[2]}`, (error, stdout, stderr) => {
    if(error) {
        console.log(`error: ${error.message}`);

        return;
    }
    if(stderr) {
        console.log(`stderr: ${stderr}`);

        return;
    }
});