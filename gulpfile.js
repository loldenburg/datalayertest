const {src, dest, series, watch} = require('gulp');
const uglify = require("gulp-uglify");
const rename = require("gulp-rename");
const fs = require("fs");
const axios = require("axios");
const jsonminify = require("gulp-jsonminify");

/**
 *
 * @returns {array} event names from the globals folder without the .json suffix
 */
function getGlobals() {
    let globals = [];
    //get all filenames in globals folder
    fs.readdirSync("shared/globals").forEach(function (file) {
        globals.push(file);
    });
    // remove the .json in the filename
    globals = globals.map(function (file) {
        return file.replace(".json", "");
    });
    return globals;
}

/**
 * generates the event map with all event names concatenated into one large object and stores them in
 * templates/eventMap.js, eventMap.json and minified versions of those
 */
function generateEventMap(cb) {
    let globals = getGlobals();
    let output = "// DO NOT EDIT THIS FILE! It is generated via gulp (generateEventMap)! The original event definitions are in the /globals folder! \n" +
        "TMSHelper.event2DLVarMap = {\n";
    let output_json_only = "{";
    for (let i = 0; i < globals.length; i++) {
        let g = globals[i];
        let gContent = fs.readFileSync("shared/globals/" + g + ".json", "utf8");
        let gOutput = '"' + g + '": ' + gContent + ",";
        console.log(gOutput);
        output += gOutput;
        output_json_only += gOutput;
    }
    output = output.substring(0, output.length - 1); // remove last trailing comma
    output_json_only = output_json_only.substring(0, output.length - 1);
    output_json_only = output_json_only.substring(0, output_json_only.length - 1);
    output += "};";
    output_json_only += "}";
    // write the output into the templates folder
    fs.writeFileSync("shared/templates/eventMap.js", output);
    fs.writeFileSync("shared/templates/eventMap.json", output_json_only);
    // fs.writeFileSync("../extensions/8998.js", output); // copy file to the extension folder (8998.js)
    // create a minified version of the file in the templates folder
    // the stream makes sure we don't start with the next command until all the file operations have been completed.
    let jsStream = src("shared/templates/eventMap.js")
        .pipe(rename("eventMap.min.js"))
        .pipe(uglify())
        .pipe(dest("shared/templates/"));

    jsStream.on('finish', function () {
        let jsonStream = src("shared/templates/eventMap.json")
            .pipe(rename("eventMap.min.json"))
            .pipe(jsonminify())
            .pipe(dest("shared/templates/"));
        jsonStream.on('finish', cb);
    });
}
/**
 * Updates the Tealium Functions unit_test.js file with the newest version of the Event Testing Map.
 * Can be removed if Tealium Functions loads the map from a server (see `downloadTestDefinitions` flag in Tealium Function)
 * @param cb
 */
function updateTealiumFunctionsMap(cb) {
    console.log("Importing eventMap from eventMap.min.js into unit_test.js");
    let eventMap = fs.readFileSync("shared/templates/eventMap.min.js", "utf8");
    let tealFunction = fs.readFileSync("tealium-functions/unit_test.js", "utf8");
    tealFunction = tealFunction.replace(/TMSHelper.event2DLVarMap *=.*};/, eventMap);
    fs.writeFileSync("tealium-functions/unit_test.js", tealFunction);
    cb();
}

function updateHelpers(cb) {
    console.log("Updating Shared Helper Functions in Mocha and Tealium Functions from Template");
    let minifyStream = src("shared/templates/helpers.js")
        .pipe(rename("helpers.min.js"))
        .pipe(uglify())
        .pipe(dest("shared/templates/"));
    minifyStream.on('finish', function () {
        const helpersPath = "shared/templates/helpers.min.js";
        const mochaPath = "tealium-iq/extensions/mochachai-iq-extension.js";
        const tealFuncPath = "tealium-functions/unit_test.js";
        let helpers = fs.readFileSync(helpersPath, "utf8");
        let mocha = fs.readFileSync(mochaPath, "utf8");
        let tealFunction = fs.readFileSync(tealFuncPath, "utf8");
        const replaceRe = /\/\/ Shared TMSHelper functions start[\s\S]+\/\/ Shared TMSHelper functions end/gmi;
        const replaceBy = "// Shared TMSHelper functions start\n" + helpers + "\n// Shared TMSHelper functions end";
        tealFunction = tealFunction.replace(replaceRe, replaceBy);
        mocha = mocha.replace(replaceRe, replaceBy);
        fs.writeFileSync(tealFuncPath, tealFunction);
        fs.writeFileSync(mochaPath, mocha);
        console.log("Finished updating Helpers");
        cb();
    });
}

exports.generateEventMap = generateEventMap;
exports.updateTFMap = updateTealiumFunctionsMap;
exports.updateHelpers = updateHelpers;
// generates the Event Map files, then updates Event Map in unit_test.js, then updates helpers in unit_test.js and mocha
exports.build = series(generateEventMap, updateTealiumFunctionsMap, updateHelpers);