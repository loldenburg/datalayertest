"use strict";
import {event, store} from "tealium";

// WHEN TEST CHANGES DEPEND ON NEWEST DATA LAYER VERSION, CHANGE THIS SO NO OLDER TEALIUM VERSIONS ARE TESTED:
const minimumTealiumVersion = 202207270820;

var dbgActive = !event.data.udo; // if event.data.udo doesn't exist, set dbg to true

/**
 * console output if dbgActive is true (set at start of script)
 * @param message {*} - message to output
 * @module tests/dbg
 */
const dbg = function (message) {
    if (dbgActive) {
        console.log(message);
    }
};
const downloadTestDefinitions = false; // set to true if you want to download your test definitions from your host of choice (e.g. Google Cloud Storage)

(async () => {
    var eventData = event.data.udo || event.data;
    var eventSchemaArray = []; // placeholder for all schemas for tested actions e.g. user/page/job/account
    var errorMessage, checkResponse;
    var eventName = eventData.event_name;
    var testCounter = 0;
    var testFinishedCounter = 0;

    // copy event.data.firstparty_tealium_cookies data to eventData object and add cp. before this keys so that the variables have the same name as in client-side tests
    if (event.data.firstparty_tealium_cookies) {
        for (let key in event.data.firstparty_tealium_cookies) {
            eventData["cp." + key] = event.data.firstparty_tealium_cookies[key];
        }
    }

    console.log("eventName: " + eventName);
    console.log("-------------------------------------");

    // check if Event is from a newer version of Tealium than the minimum version
    const tealVersionDate = parseInt(eventData["ut.version"].split(".")[2]); // e.g. ut4.48.202207270826
    if (tealVersionDate < minimumTealiumVersion) {
        dbg("Tealium version is older than minimum required version (does not matter in dbg mode).");
        if (!dbgActive) {
            // in debug mode we don't quit so we don't need to update all our test events with every new Tealium version
            dbg("Quitting to not throw errors due to tests looking for e.g. new data layer variables.");
            return;
        }
        dbg("YOUR TEST DEFINITION MAY BE OUTDATED!!");
    }

    // Blacklist: Use like in Mocha for Events which should not be tested (eg no proper tests defined yet)
    if (eventData["tool_mochaTestFlag"] === "0") {
        console.log("No test desired for this Event: " + eventName + ". Quitting.");
        return;
    }

    var TMSHelper = {};
    // @formatter:off
// insert newest shared (between Mocha and Tealium Functions) helper functions via `gulp updateHelpers`
// Shared TMSHelper functions start
TMSHelper.ignoreKeysForPlatform={profile1:["variable_that_never_exists_on_profile1"],profile2:["cp.a_cookie_variable_that_never_exists_on_profile2","some_other_variable_that_never_exists_on_profile2"]},TMSHelper.console=function(e,r){var t=!1,t="function"!=typeof TMSHelper.debugActive||TMSHelper.debugActive();(t=r?!0:t)&&console.log(e)},TMSHelper.populated=function(e,r,t){if(!e)return!(!r||0!==e)||!(!t||!1!==e);if(e instanceof Array){if(e.length)for(var n=0,o=e.length;n<o;n++){if(e[n])return!0;if(r&&0===e[n])return!0;if(t&&!1===e[n])return!0}}else if(e)return!0;return!1},TMSHelper.typeOf=function(e){return{}.toString.call(e).match(/\s([a-zA-Z]+)/)[1].toLowerCase()},TMSHelper.shortPreview=function(e,r){if(r=r||80,TMSHelper.populated(e))return e=(e="regexp"===TMSHelper.typeOf(e)?e.toString():JSON.stringify(e)).length>r?e.slice(0,r)+"...":e},TMSHelper.skipTest=function(e,r){if(TMSHelper.ignoreKeysForPlatform[r["ut.profile"]]&&-1!==TMSHelper.ignoreKeysForPlatform[r["ut.profile"]].indexOf(TMSHelper.sanitizeKey(e)))return!0;if(-1===e.search(/^[MT]~/))return!1;r=e.slice(0,2);return TMSHelper.mochaChaiExt?"M~"!==r:"T~"!==r},TMSHelper.sanitizeKey=function(e){return-1===e.search(/^[MT]~/)?e:e.slice(2)},TMSHelper.regExpPrice="/^([1-9]\\d*|0)(\\.\\d{1,2}|)$/",TMSHelper.positiveInt="/^[1-9]\\d*$/",TMSHelper.positiveIntOrZero="/^(zero|[1-9]\\d*)$/",TMSHelper.logicalTest=function(r,t,e,n){if(t.hasOwnProperty("switch")){var o=Object.keys(t.switch)[0],t=t.switch[o][e[o]]||t.switch[o].default;if(TMSHelper.mochaChaiExt)return TMSHelper[n](r,t,e);{let e={};return e[r]=t,TMSHelper[n](e)}}TMSHelper.handleError("Unhandled logical test type",e,r,n)},TMSHelper.handleError=function(e,r,t,n){if(TMSHelper.mochaChaiExt)throw Error(e);return error.add(n,t,eventName,e),!1},TMSHelper.functionMatchFunctions={notFallback:function(e,r){var t=e[r];return"fallback"!==(t=t instanceof Array?t[0]:t)||TMSHelper.handleError(r+"is 'fallback'!",e,r,"functionMatch")},validatePageCategory:function(e,r){return!!("Category"!==e.page_type||e[r]&&-1!==e[r].search(/[a-z]+[\-a-z]+/))||TMSHelper.handleError("page_category not defined or false value: "+e[r],e,r,"functionMatch")},ossTermCheck:function(e,r){return TMSHelper.getParameterByName("query",e.url_search)?!!e[r]||TMSHelper.handleError("Search Term ("+r+") not set!",e,r,"functionMatch"):"*"===e[r]||TMSHelper.handleError("Search Term ("+r+") should be *, but is "+e[r],e,r,"functionMatch")}};const short=TMSHelper.shortPreview;
// Shared TMSHelper functions end
    // @formatter:on

    // Test Log
    var test = {data: {}};
    /**
     * Adds test results to the test.data object
     * @param testType
     * @param variable
     * @param testResult
     */
    test.add = function (testType, variable, testResult) {
        if (test.data[testType]) {
            test.data[testType].push({var: variable, result: testResult});
        } else {
            test.data[testType] = [];
            test.data[testType].push({var: variable, result: testResult});
        }
    };

    // Error Obj
    var error = {data: {}};
    /**
     * Adds Errors Log to the Error Object
     * @param testType
     * @param variable
     * @param eventName
     * @param message
     */
    error.add = function (testType, variable, eventName, message) {
        if (error.data.testType) {
            error.data[testType].push({var: variable, event: eventName, message: message});
        } else {
            error.data[testType] = [];
            error.data[testType].push({var: variable, event: eventName, message: message});
        }
    };

    /**
     * Gets the test schemas ("event-to-data-layer map") from Google Cloud Storage
     * @returns {object} event-to-datalayer map
     * @module tests/getEvent2DLVarMap
     */
    TMSHelper.getEvent2DLVarMap = async function () {
        try {
            // after this line, our function will wait for the `fetch()` call to be settled
            // the `fetch()` call will either return a Response or throw an error
            let url = "https://storage.googleapis.com/xxxx/yourURLWithTheTestSchemas";
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            // after this line, our function will wait for the `response.json()` call to be settled
            // the `response.json()` call will either return the parsed JSON object or throw an error
            return await response.json();
        } catch (error) {
            console.log(`Could not get event-to-datalayer map: ${error}`);
        }
    };
    // download test definitions from server or insert manually
    if (downloadTestDefinitions) {
        TMSHelper.event2DLVarMap = await TMSHelper.getEvent2DLVarMap();
    } else {
        // @formatter:off
    // START eventMap - insert the most up-to-date event map from shared/templates/eventMap.min.js here via `gulp updateTFMap`
    TMSHelper.event2DLVarMap={allEvents:{import:["allEventsRegexSchema","allEventsTypeSchema","allEventsFunctionSchema"]},allEventsFunctionSchema:{functionMatch:{page_category_name:"validatePageCategory"}},allEventsRegexSchema:{fullOrRegExMatch:{timing_server:"/^\\d+$/",timing_load:"/^\\d+$/",timing_dom:"/^\\d+$/",server_code:"/^\\d{3}$/",referrer_full:"/^(https?|android-app):.*/",order_currency:"CHF",page_language:"/^(de|en|fr|it)$/",page_instanceid:"/^([a-z\\d]{40}|[a-z-\\d]{36})_20\\d+$/",debug_info:"/^ut[\\d\\.]+\\|[a-z]{2,4}\\|[a-z_-]+\\|y\\|\\d{3}\\|.*/",dbg_localStorage:"y",onsiteCampaign_name:"/^\\!\\w[\\w\\d]{0,2}-[a-z0-9_!\\-+\\/%=?&]+$/","cp.ut_aa_mcid":"/\\d+/",url_rootDomain:{switch:{"ut.profile":{main:"main-site.ch","second-profile":"/(othersite|nextsite|anothersite)\\.ch/","third-profile":"/(thirdsite|fourthsite)\\.ch/",default:"unexpected domain"}}}}},allEventsTypeSchema:{populatedAndOfType:{toolGA_tid:"string",toolAA_rsId:"string",server_code:"string",platform:"string",page_type:"string",page_title:"string",page_language:"string",page_instanceid:"string",order_currency:"string",environment_platform:"string",debug_info:"string",dbg_localStorage:"string",client_id:"string","M~cp.ut_aa_mcid":"string",cart_content:"**object"}},allProdEvents:{import:["allProdEventsRegexSchema","allProdEventsTypeSchema","allProdEventsFunctionSchema"]},allProdEventsFunctionSchema:{functionMatch:{prod_action:"notFallback"}},allProdEventsRegexSchema:{fullOrRegExMatch:{prod_id:"/^[1-9]\\d+$/",prod_pos:"/^[1-9]\\d*$/",prod_posTotal:"/^[1-9]\\d*$/",prod_quan:"//positiveInt",prod_price:"//regExpPrice",prod_priceTotal:"//regExpPrice",prod_stock:"/^(n|[1-9]\\d*)$/",prod_purchasable:"/^[yn]$/",prod_hasService:"/[yn]$/",prod_cat_l5:"/^$|[aA-zZ].*/",prod_cat_l4:"/^$|[aA-zZ].*/",prod_cat_l3:"/[aA-zZ].*/",prod_cat_l2:"/[aA-zZ].*/",prod_cat_l1:"/[aA-zZ].*/",prod_action:"/^[a-z0-9_]+$/"}},allProdEventsTypeSchema:{populatedAndOfType:{prod_action:"array",prod_cat_l1:"array",prod_cat_l2:"array",prod_cat_l3:"**array",prod_cat_l4:"**array",prod_cat_l5:"**array",prod_cat_wg:"array",prod_id:"array",firstProd_id:"string",prod_price:"array",prod_stock:"array",prod_purchasable:"array",prod_hasService:"**array"}},link__ecommerce__add_cart:{import:["tpl_cartAddEvents"],eventSchema:{populatedAndOfType:{order_id:"!!",prod_list:"!!"},fullOrRegExMatch:{prod_action:"add_cart",component_category:"ecommerce",component_subcategory:"add_cart",page_type:"Cart"},functionMatch:{cart_content:"cartContentNotEmpty"}}},link__ecommerce__add_pdp:{import:["tpl_cartAddEvents"],eventSchema:{populatedAndOfType:{prod_list:"!!",prod_purchasableHasService:"array"},fullOrRegExMatch:{prod_action:"add_pdp",component_category:"ecommerce",component_subcategory:"add_pdp",page_type:"Product"}}},link__ecommerce__remove_cart:{eventSchema:{populatedAndOfType:{prod_quan:"array",prod_pos:"array",order_id:"!!"},fullOrRegExMatch:{prod_action:"/^remove_cart$/",page_type:"Cart"}}},tpl_cartAddEvents:{eventSchema:{populatedAndOfType:{prod_quan:"array",order_id:"!!",persistPageContext:"string",prod_actionIsCartAdd:"string",cart_content:"**object",component_category:"array",component_subcategory:"array"},fullOrRegExMatch:{order_id:"!!",persistPageContext:"y",prod_actionIsCartAdd:"y"}}}};
    // END eventMap
    }

    // Tealium Function-specific Helper functions
    /**
     * gets a specific test schema
     * @returns {Object}
     * @module tests/getEvent2DLVarMap/get
     */
    TMSHelper.event2DLVarMap.get = function (eventName) {
        return this[eventName];
    };
    /**
     * Helper function to extract query parameter from URL (default) or
     * string (parameter "str") if b["qp.parameter"] cannot be used
     * @param {string} name - parameter whose value we want to retrieve
     * @param {string} str - URL Query String we should search through
     * @returns {string} value of the
     * @module helpers/getParameterByName
     */
    TMSHelper.getParameterByName = function (name, str) {
        try {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var s = str || ""; // || location.search; -> location.search only for in-browser tests
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(s);
            return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        } catch (e) {
            console.log(e, "getParameterByName: name: " + name + " . str: " + str);
        }
    };

     /**
     * populatedAndOfType: checks if a data layer property is populated and of type (according to utag.ut.typeOf logic: "regexp, string, object, number, boolean").
     *
     * Special commands:
     * <pre>
     *  - preceding "**", e.g. "**string" -> optionally populated, but if populated, should be of type
     *  - "!!" -> must not be populated -> throws error if populated
     *  </pre>
     * @param {object} testMap
     * @returns {string} - passed tests
     * @module tests/populatedAndofTypeTealFunctions
     */
    TMSHelper.populatedAndOfType = function (testMap) {
        for (let key in testMap) {
            if (TMSHelper.skipTest(key, eventData)) {
                continue;
            }
            if (TMSHelper.typeOf(testMap[key]) === "object") {
                // if the test definition is an object, it must be a logical test (eg switch)
                TMSHelper.logicalTest(key, testMap[key], eventData, "populatedAndOfType");
                continue;
            }
            // key = unsanitized key from testmap, e.g. "T~prod_id"
            var keySan = TMSHelper.sanitizeKey(key); // keySan = sanitized key, e.g. "prod_id"
            var val = eventData[keySan]; // val = data layer value
            var theTest = testMap[key]; // theTest = the test definition (e.g. "**string")
            var testPrefix = theTest.slice(0, 2); // prefix e.g. "**"
            testFinishedCounter++; // has to come up here already due to various "continue" statements further down // TODO improve this so Finished is not counted unless a real test has been made

            var typeOfResult = TMSHelper.typeOf(val);

            // not populated (value = "!!")

            if (testPrefix === "!!") {
                TMSHelper.notPopulated(keySan);
                continue;
            } else if (testPrefix === "**") {
                // optionally populated (**type)
                var testSan = theTest.slice(2); // the value after the prefix, e.g. "string")
                // if populated and correct type => ok
                if (TMSHelper.populated(val) && typeOfResult === testSan) {
                    checkResponse = key + " --> Correct type: " + typeOfResult + " -> " + testSan;
                    test.add("populatedAndOfType", key, checkResponse);
                    continue;
                }
                // if not populated => always ok (because optional)
                if (!TMSHelper.populated(val)) {
                    checkResponse = key + " --> Correct type: optionally populated";
                    test.add("populatedAndOfType", key, checkResponse);
                    continue;
                }
            }
            // mandatorily populated:
            // is populated and key as defined => OK
            if (TMSHelper.populated(eventData[key]) && typeOfResult === theTest) {
                checkResponse = key + " --> Correct type: " + typeOfResult + " -> " + theTest;
                test.add("populatedAndOfType", key, checkResponse);
            } else {
                errorMessage = keySan + " does not exist or is not populated or is not of type " + theTest + "!";
                error.add("populatedAndOfType", key, eventName, errorMessage);
            }
        }
    };
    /**
     * Checks if variable in Data Layer is not populated. Use only for Data Layer tests, not the same as in MochaChai
     * @param {string} dlkey - key to check in Data Layer
     */
    TMSHelper.notPopulated = function (dlkey) {
        if (TMSHelper.populated(eventData[dlkey])) {
            errorMessage = dlkey + ' --> is populated: Expected not populated, but found ---> "' + short(eventData[dlkey]) + '"\n';
            error.add("notPopulated", dlkey, eventName, errorMessage);
        } else {
            checkResponse = dlkey + " --> Not populated - OK";
            test.add("notPopulated", dlkey, checkResponse);
        }
        testFinishedCounter++;
    };

    /**
     * Import Test Library. A Library is a variable with multiple test presets e.g. ["AllEvents","ProdTests"]
     * @param {Array} libNames
     * @module tests/importLibTealFunctions
     */
    TMSHelper.importLib = function (libNames) {
        for (let i = 0; i < libNames.length; i++) {
            var lib = TMSHelper.event2DLVarMap.get(libNames[i]);
            if (lib.hasOwnProperty("import")) {
                TMSHelper.importLib(lib.import); // import other event libraries
            } else if (lib.hasOwnProperty("eventSchema")) {
                eventSchemaArray.push(lib.eventSchema);
            } else {
                // if there is no eventSchema property, we simply import everything (eg for schemas that contain only e.g. regexp matches for a certain event)
                eventSchemaArray.push(lib);
            }
        }
    };
    /**
     * sends error to influxDB
     * @param data
     * @returns {Promise<void>}
     * @module tests/sendDataToInfluxDB
     */
    TMSHelper.sendDataToInfluxDB = async function (data) {
        // send error to influxdb
        var tokens = JSON.parse(store.get("tokens"));
        var url = "https://eu-central-1-1.aws.cloud2.influxdata.com/api/v2/write?org=xxx&bucket=xxx&precision=ms";
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: tokens["influxdb"],
                Accept: "application/json",
                "Content-Type": "text/plain; charset=utf-8",
                "Content-Encoding": "identity"
            },
            body: data
        });
    };

    /**
     * logs error to google cloud function
     * @param {object} errorData - the error data to log (usually error.data)
     * @returns {Promise<void>}
     * @module tests/logErrorToGCF
     */
    TMSHelper.logErrorToGCF = async function (errorData) {
        console.log("Logging error to Cloud Function");
        let tokenGCF = store.get("tokenGCF");
        let urlGCF = store.get("urlGCF");
        // eventPayload needs to be JSON-stringified additionally
        let ep = JSON.stringify({
            script: "log_datalayer_error",
            scriptType: "data_layer_tests",
            errorData: errorData,
            dataLayer: eventData,
            eventName: eventName // actually tested event name
        });
        let body = JSON.stringify({
            topic: "XXX",
            token: tokenGCF,
            eventPayload: ep,
            attrs: {
                origin: "tealium function"
            }
        });
        dbg("GCF Payload:");
        dbg(body);
        let headers = {
            "content-type": "application/json",
            "mute-http-exceptions": "true"
        };
        const response = await fetch(urlGCF, {
            method: "POST",
            headers: headers,
            body: body
        });
        console.log("Logged error to Cloud Function. Status Response:", response.status, response.statusText);
    };

    /**
     * fullOrRegExMatch: checks a variable value v against c (a "string" = full match, a "/regexstr/" = regexp match)
     * if value to check is an object, a logical test is run (similar to populatedAndOfType)
     * @param {object} testMap
     * @module tests/fullOrRegExMatchTealFunctions
     */
    TMSHelper.fullOrRegExMatch = function (testMap) {
        for (let key in testMap) {
            if (TMSHelper.skipTest(key, eventData)) {
                continue;
            }
            if (TMSHelper.typeOf(testMap[key]) === "object") {
                // if the test definition is an object, it must be a logical test (eg switch)
                TMSHelper.logicalTest(key, testMap[key], eventData, "fullOrRegExMatch");
                continue;
            }
            // key = unsanitized key from testmap, e.g. "T~prod_id"
            var keySan = TMSHelper.sanitizeKey(key); // keySan = sanitized key, e.g. "prod_id"
            var val = eventData[keySan]; // val = data layer value
            if (!TMSHelper.populated(val, true, true)) {
                continue; // if not populated, go to next var
            }
            if (TMSHelper.typeOf(val) !== "array") {
                // Arraify if not an Array yet
                val = [val];
            }
            let theTest = testMap[key];
            // to keep it compatible with MochaChai Test definitions
            if (testMap[key] instanceof Array) {
                theTest = testMap[key][0]; // test definitions for Array vars have always only one element, eg ["/"hundi+/"]
            }
            let isRegex = theTest.search(/^\/.*\/$/) > -1; // first and last chars = "/" => it must be a regex
            if (isRegex) {
                theTest = new RegExp(theTest.substring(1, theTest.length - 1)); // strip preceding and trailing / and turn the rest into a regexp
            } else if (theTest.substring(0, 2) === "//") {
                // "//" at the start signify reference to TMSHelper[regExpString]
                let regexName = theTest.substring(2);
                theTest = new RegExp(TMSHelper[regexName].substring(1, TMSHelper[regexName].length - 1));
            } else {
                theTest = new RegExp("^" + theTest + "$"); // add ^ and $ to make it an "equals"
            }
            for (let i = 0; i < val.length; i++) {
                let val_i = val[i];
                if (TMSHelper.populated(val_i, true, true)) {
                    val_i = val[i].toString(); // setting to string to allow re searches

                    if (val_i.search(theTest) !== -1) {
                        checkResponse = key + " --> Full or Regex Match OK: " + theTest.toString() + " matched " + val_i;
                        test.add("fullOrRegExMatch", key, checkResponse);
                    } else {
                        errorMessage = key + " --> Full or Regex Match failed: Searched for --> " + short(theTest) + ", but found --> " + short(val_i) + "\n";
                        error.add("fullOrRegExMatch", key, eventName, errorMessage);
                    }
                }
            }
            testFinishedCounter++;
        }
    };

    /**
     * runs functionMatches tests. All functions for function matches tests need to be in the "functionMatchFunctions" object
     * @param testMap - map of data layer variable and function name to run, e.g. "prod_action": "notFallBack" will run `functionMatchFunctions.notFallBack(eventData, "prod_action")`
     */
    TMSHelper.functionMatch = function (testMap) {
        for (let key in testMap) {
            if (TMSHelper.skipTest(key, eventData)) {
                continue;
            }
            // key = unsanitized key from testmap, e.g. "T~prod_id"
            var keySan = TMSHelper.sanitizeKey(key); // keySan = sanitized key, e.g. "prod_id"
            var val = eventData[keySan]; // val = data layer value
            if (testMap.hasOwnProperty(key) && TMSHelper.populated(val)) {
                var theFunction = testMap[key];
                if (TMSHelper.functionMatchFunctions[theFunction](eventData, keySan)) {
                    checkResponse = key + " --> Function Match OK: " + theFunction + " -> " + short(val);
                    test.add("functionMatch", key, checkResponse);
                }
                testFinishedCounter++;
            }
        }
    };

    // --- START! Importing testSchema to build eventSchemaArray based on tealium_event ---
    dbg("Importing Test Schemas");
    //For any hit, add allEvents Tests
    TMSHelper.importLib(["allEvents"]);

    // For Any Prod Hit, add Prod Tests
    if (TMSHelper.populated(eventData.prod_id)) {
        TMSHelper.importLib(["allProdEvents"]);
    }

    if (typeof TMSHelper.event2DLVarMap.get(eventName) !== "undefined") {
        var testSchema = TMSHelper.event2DLVarMap.get(eventName);

        if (testSchema.hasOwnProperty("import")) {
            TMSHelper.importLib(testSchema["import"]);
        }
        if (testSchema.hasOwnProperty("eventSchema")) {
            eventSchemaArray.push(testSchema.eventSchema);
        }
    } else {
        var noTestDefined = "There is no Event-based Test for: " + eventName;
        console.log("No Test Definition: " + noTestDefined);
    }

    //merge duplicate schema keys into one object, going through them by order of importing. The last schema (=usually the Event Schema) wins
    dbg("Merging Schemas");
    var mergedSchema = {};
    for (let i = 0; i < eventSchemaArray.length; i++) {
        for (var key in eventSchemaArray[i]) {
            if (eventSchemaArray[i].hasOwnProperty(key)) {
                if (mergedSchema.hasOwnProperty(key)) {
                    //before merging, check if there are multiple test definitions for the same key
                    for (var dlv in eventSchemaArray[i][key]) {
                        if (mergedSchema[key].hasOwnProperty(dlv) && mergedSchema[key][dlv] !== eventSchemaArray[i][key][dlv]) {
                            //log this warning
                            console.groupCollapsed("Info: Multiple " + key + " definitions for variable: " + dlv);
                            console.log("Original: " + mergedSchema[key][dlv]);
                            console.log("New: " + eventSchemaArray[i][key][dlv]);
                            console.groupEnd();
                        }
                    }
                    mergedSchema[key] = {...mergedSchema[key], ...eventSchemaArray[i][key]};
                } else {
                    mergedSchema[key] = eventSchemaArray[i][key];
                }
            }
        }
    }
    eventSchemaArray = [mergedSchema];
    dbg("Converting some string variables back to arrays");
    TMSHelper.convertToArrays();
    // --- Run the tests! ---
    dbg("Starting tests");
    for (var i = 0; i < eventSchemaArray.length; i++) {
        // for each schema to test against (eg "allEvents", "view_ecommerce_detail"), ...
        for (let key in eventSchemaArray[i]) {
            // ... go through each key in the schema (e.g. "populatedAndOfType", "notPopulated", "fullOrRegExMatch", ...)
            testCounter += eventSchemaArray[i][key].length || Object.keys(eventSchemaArray[i][key]).length; // get the number of tests (= variables to check)
            dbg("Running Tests of type "+ key);
            if (eventSchemaArray[i].hasOwnProperty(key)) {
                if (key === "populatedAndOfType") {
                    TMSHelper.populatedAndOfType(eventSchemaArray[i][key]);
                } else if (key === "fullOrRegExMatch") {
                    TMSHelper.fullOrRegExMatch(eventSchemaArray[i][key]);
                } else if (key === "functionMatch") {
                    TMSHelper.functionMatch(eventSchemaArray[i][key]);
                }
            }
        }
    }
    console.log("-------------------------------------");
    console.groupCollapsed("Test Summary");
    console.log("Finished " + testFinishedCounter + "/" + testCounter + " Tests\n");
    console.groupEnd();

    // log separately to influxDB if an Event had no test defined for it
    var ts = 0,
        data = "";
    if (TMSHelper.populated(noTestDefined)) {
        ts = Math.round(new Date().getTime());
        data = `Info,infoType=noTestDefined,variable=na,event=${eventName} counter=1 ${ts} \n`;
        // UNCOMMENT THIS IF YOU HAVE YOUR OWN INFLUXDB Connection:
        // TMSHelper.sendDataToInfluxDB(data);
    }

    // log the passed tests
    if (typeof errorMessage !== "undefined" && errorMessage !== "") {
        let msg = (Object.keys(error.data).length.toString() + " Tests failed");
        console.error(msg); // console.error is needed to make the Tealium test output red and not green (however
        // Tealium puts this to the very end of the console output, so we continue the rest with normal console.log)
        console.log(msg);
        dbg(JSON.stringify(error.data, null, 4));
        for (let key in error.data) {
            if (error.data[key].length) {
                console.groupCollapsed("Failed Tests for " + key + ":");
                for (let i in error.data[key]) {
                    console.log(error.data[key][i]["message"]);
                }
                console.groupEnd();
                console.log("-------------------------------------");
            }
        }

        ts = Math.round(new Date().getTime());
        data = "";
        for (let key in error.data) {
            for (let i in error.data[key]) {
                data += `Error,errorType=${key},variable=${error.data[key][i]["var"]},event=${error.data[key][i]["event"]} counter=1 ${ts} \n`;
            }
        }
        // UNCOMMENT THIS IF YOU HAVE YOUR OWN INFLUXDB CONNECTION
        // dbg("Sending Error to influxDB");
        // TMSHelper.sendDataToInfluxDB(data);

        // UNCOMMENT THIS IF YOU HAVE YOUR OWN GCLOUD CONNECTION
        // log to Google Cloud Function
        // dbg("Sending Error to Google Cloud Function");
        // TMSHelper.logErrorToGCF(error);

        // ADD OTHER ERROR LOGGING DESTINATIONS HERE

        console.groupCollapsed("Data Layer (only logged if debug active):");
        dbg(JSON.stringify(eventData, null, 1));
        console.groupEnd();
        TMSHelper.dataLayerLogged = true;
    } else {
        if (dbgActive) { // in debug mode, log all passed tests to Tealium console
            console.log("Passed Tests:");
            for (let key in test.data) {
                console.groupCollapsed(key + " Tests");
                if (test.data.hasOwnProperty(key)) {
                    for (let i in test.data[key]) {
                        console.log(test.data[key][i].result);
                    }
                    console.groupEnd();
                    console.log("-------------------------------------");
                }
            }
            if (!TMSHelper.dataLayerLogged) {
                console.groupCollapsed("Data Layer:");
                console.log(JSON.stringify(eventData, null, 1)); // avoid truncation
                console.groupEnd();
            }
        }
    }
})();