// start mocha Extension code. Add this as the last "After Tags" Extension in Tealium iQ (and do not publish to PROD!)
"use strict";
window.TMSHelper = window.TMSHelper || {};
/**
 * simple flag to know that we are in "Mocha" (and not e.g. Tealium Functions) context (some helper functions work differently in Tealium Functions context)
 * @type {boolean}
 * @module tests/mochaChaiExt
 */
TMSHelper.mochaChaiExt = true;

/**
 * event2DLVarMap: test definitions per event name/data layer variable.
 * The code as-is expects you to have an object TMSHelper.event2DLVarMap defined prior to this extension
 * (e.g. via a previous extension or by a queueing logic that has to be finished before the first utag.view call on the page)
 *
 * Every event Name (e.g. "detail") has its logic.
 * Logic is of these types:
 *
 * `populatedAndOfType` - variables that must (not) be populated (TMSHelper.populated) and be
 * of a certain type.
 *  Examples:
 *  populated and of type string: "string"
 *  optionally populated and of type string (if populated): "**string"
 *  must not be populated: "!!"
 *
 * `fullOrRegExMatch` - variable (if defined) matches "full string" or /RegExp/.
 * If variable is an Array, all Array members are checked
 *
 * `functionMatch` - custom function that variable (if defined) must match
 * All functions receive a dl (full data Layer) and a val (name of key to check, e.g. "page_pageInfo_language") parameter
 *
 * See readme.md for more
 *
 * @module tests/event2DLVarMap
 */
TMSHelper.event2DLVarMap = TMSHelper.event2DLVarMap || {}; // INSERT YOUR Data Layer Tests (JSON "map") here or set it via a previous extension

// insert newest shared (between Mocha and Tealium Functions) helper functions via `gulp updateHelpers`
// @formatter:off
// Shared TMSHelper functions start
TMSHelper.ignoreKeysForPlatform={profile1:["variable_that_never_exists_on_profile1"],profile2:["cp.a_cookie_variable_that_never_exists_on_profile2","some_other_variable_that_never_exists_on_profile2"]},TMSHelper.functionMatchFunctions={isExternalHost:function(e,r){var t=e[r],n=e.url_host||location.hostname;return t===n&&TMSHelper.handleError("isExternalHost: "+t+" is the same as current host: "+n,e,r,"functionMatch"),!0},notFallback:function(e,r){var t=e[r];return"fallback"!==(t=t instanceof Array?t[0]:t)||TMSHelper.handleError(r+"is 'fallback'!",e,r,"functionMatch")},validatePageCategory:function(e,r){return!!("Category"!==e.page_type||e[r]&&-1!==e[r].search(/[a-z]+[\-a-z]+/))||TMSHelper.handleError("page_category not defined or false value: "+e[r],e,r,"functionMatch")},ossTermCheck:function(e,r){return TMSHelper.getParameterByName("query",e.url_search)?!!e[r]||TMSHelper.handleError("Search Term ("+r+") not set!",e,r,"functionMatch"):"*"===e[r]||TMSHelper.handleError("Search Term ("+r+") should be *, but is "+e[r],e,r,"functionMatch")}},TMSHelper.console=function(e,r){var t=!1,t="function"!=typeof TMSHelper.debugActive||TMSHelper.debugActive();(t=r?!0:t)&&console.log(e)},TMSHelper.populated=function(e,r,t){if(!e)return!(!r||0!==e)||!(!t||!1!==e);if(e instanceof Array){if(e.length)for(var n=0,o=e.length;n<o;n++){if(e[n])return!0;if(r&&0===e[n])return!0;if(t&&!1===e[n])return!0}}else if(e)return!0;return!1},TMSHelper.typeOf=function(e){return{}.toString.call(e).match(/\s([a-zA-Z]+)/)[1].toLowerCase()},TMSHelper.shortPreview=function(e,r){if(r=r||80,TMSHelper.populated(e))return e=(e="regexp"===TMSHelper.typeOf(e)?e.toString():JSON.stringify(e)).length>r?e.slice(0,r)+"...":e},TMSHelper.skipTest=function(e,r){if(TMSHelper.ignoreKeysForPlatform[r["ut.profile"]]&&-1!==TMSHelper.ignoreKeysForPlatform[r["ut.profile"]].indexOf(TMSHelper.sanitizeKey(e)))return!0;if(-1===e.search(/^[MT]~/))return!1;r=e.slice(0,2);return TMSHelper.mochaChaiExt?"M~"!==r:"T~"!==r},TMSHelper.sanitizeKey=function(e){return-1===e.search(/^[MT]~/)?e:e.slice(2)},TMSHelper.regExpValidUrl="/((http|https)://)(www.)?.*..*/",TMSHelper.regExpPrice="/^([1-9]\\d*|0)(\\.\\d{1,2}|)$/",TMSHelper.positiveInt="/^[1-9]\\d*$/",TMSHelper.positiveIntOrZero="/^(zero|[1-9]\\d*)$/",TMSHelper.logicalTest=function(r,t,e,n){if(t.hasOwnProperty("switch")){var o=Object.keys(t.switch)[0],t=t.switch[o][e[o]]||t.switch[o].default;if(TMSHelper.mochaChaiExt)return TMSHelper[n](r,t,e);{let e={};return e[r]=t,TMSHelper[n](e)}}TMSHelper.handleError("Unhandled logical test type",e,r,n)},TMSHelper.handleError=function(e,r,t,n){if(TMSHelper.mochaChaiExt)throw Error(e);return error.add(n,t,eventName,e),!1};const short=TMSHelper.shortPreview;
// Shared TMSHelper functions end
// @formatter:on

// Mocha-specific Helper functions
/**
 * populatedAndOfType: checks if a data layer property is populated and of type (according to utag.ut.typeOf logic: "regexp, string, object, number, boolean").
 * If property is an Array, all Array members are checked.
 *
 * Special commands:
 *  <pre>
 *  - preceding "**", e.g. "**string" -> optionally populated, but if populated, should be of type
 *  - "!!" -> must not be populated -> throws error if populated
 *  - If property is an object, it will run a logical test, e.g. a switch (similar to fullOrRegExMatch) (see TMSHelper.logicalTest)
 *  </pre>
 * @param {string} prop - data layer property (key) to check whether populated and type
 * @param {string|object} type to check - if string = expected type (e.g. "string"), if object = logical test
 * @param {object} dl - full data layer
 * @returns {boolean}
 * @module tests/populatedAndOfTypeMocha
 */
TMSHelper.populatedAndOfType = function (prop, type, dl) {
    if (TMSHelper.typeOf(type) === "object") { // special case: logical test
        return TMSHelper.logicalTest(prop, type, dl, "populatedAndOfType");
    }

    // not populated (value = "!!")
    if (type.substring(0, 2) === "!!") {
        return TMSHelper.notPopulatedThrow(dl[prop]);
    }
    // optionally populated (value = "**type"
    if (type.substring(0, 2) === "**") {
        if (TMSHelper.populated(dl[prop]) && TMSHelper.typeOf(dl[prop]) === type.substring(2)) {
            return true;
        }
        if (!TMSHelper.populated(dl[prop])) {
            return true;
        }
    }
    // must be populated and of type (value = "type")
    if (TMSHelper.populated(dl[prop]) && (TMSHelper.typeOf(dl[prop]) === type)) {
        return true;
    }
    throw Error("variable does not exist or is not populated or is not of type " + type + "!");
};
/**
 * notPopulatedThrow: inversion of TMSHelper.populated, use only in MochaChai Context because it throws an Error if not populated
 * @param {*} v - variable to
 * @returns {boolean}
 * @module tests/notPopulatedthrow
 */
TMSHelper.notPopulatedThrow = function (v) {
    if (TMSHelper.populated(v)) {
        throw Error("variable is populated, but mustn't!");
    }
    return true;
};
/**
 * fullOrRegExMatch: checks a variable value v against c (a "string" = full match, a "/regexstr/" = regexp match)
 * if value to check is an object, a logical test is run (similar to populatedAndOfType)
 * if value to check is an Array, all Array members are checked
 * @param {*} prop - value to check (e.g. value of a data layer variable)
 * @param {string|object} theTest - if "string" = full match, if "/regExpStr/" -> RegExp check expected type, if object = logical test
 * @param {object} dl - current data layer
 * @returns {boolean}
 * @module tests/fullOrRegExMatchMocha
 */
TMSHelper.fullOrRegExMatch = function (prop, theTest, dl) {
    if (TMSHelper.typeOf(theTest) === "object") { // special case logicalTest
        return TMSHelper.logicalTest(prop, theTest, dl, "fullOrRegExMatch");
    }
    let dlval = dl[prop];
    if (!(dlval instanceof Array)) {
        dlval = [dlval];  // transform value into array so we can treat anything like an Array and avoid redundancies
    }
    if (theTest instanceof Array) {
        theTest = theTest[0];
    }
    let isRegex = theTest.search(/^\/.*\/$/) > -1; // first and last chars = "/" => it must be a regex
    if (isRegex) {
        theTest = new RegExp(theTest.substring(1, theTest.length - 1)); // strip preceding and trailing / and turn the rest into a regexp
    } else if (theTest.substring(0, 2) === "//") { // "//" at the start signify reference to TMSHelper[regExpString]
        let regexName = theTest.substring(2);
        theTest = new RegExp(TMSHelper[regexName].substring(1, TMSHelper[regexName].length - 1));
    } else {
        theTest = new RegExp("^" + theTest + "$"); // add ^ and $ to make it an "equals"
    }
    for (let i = 0; i < prop.length; i++) {
        let val_i = dlval[i];
        if (TMSHelper.populated(val_i, true, true)) {
            val_i = val_i.toString(); // setting to string to allow re searches
            if (val_i.search(theTest) === -1) {
                throw Error("The value or at least one value in the Array (first value: " + val_i.toString() + ") does not match the string or RegExp. " + theTest.toString());
            }
        }
    }
    return true;
};

/**
 * Import Test Library. A Library is a variable with multiple test presets e.g. ["AllEvents","ProdTests"]
 * @param {Array} libNames - schema (library, i.e. event names) names for which to import tests
 * @param {object} [eventMap=TMSHelper.event2DLVarMap] - global event map with all schemas to import from
 * @param {array} [eventSchemas=[]] - array of objects with already imported event testing schemas
 * @returns {Array} Array of event schemas map
 */
TMSHelper.importLib = function (libNames, eventMap, eventSchemas) {
    let _eventSchemaArray = eventSchemas || [];
    eventMap = eventMap || TMSHelper.event2DLVarMap;
    for (let i = 0; i < libNames.length; i++) {
        let lib = eventMap[libNames[i]];
        if (lib.hasOwnProperty("import")) { // if the event schema requires importing another schema, import that, too
            _eventSchemaArray = TMSHelper.importLib(lib.import, eventMap, _eventSchemaArray);
        }
        if (lib.hasOwnProperty("eventSchema")) {
            _eventSchemaArray.push(lib.eventSchema);
        } else {
            _eventSchemaArray.push(lib); // if no "eventSchema" object (to separate from import object), we simply import all
        }
    }
    // remove the "import" properties from the final event schemas as they are irrelevant for the tests
    _eventSchemaArray = _eventSchemaArray.filter(function (el) {
        return !el["import"];
    });
    return _eventSchemaArray;
};

/**
 * runDataLayerTests: configures mocha & chai and then runs Data Layer Tests.
 * Function is called from MochaChai Tag after the mocha / chai libraries have been downloaded and parsed
 * order: runDataLayerTests -> runs mergeTestMapsAndFireTests -> runs runEventMapTests
 * @param {object} dl - data Layer to test (e.g. b, utag_data)
 * @module tests/runDataLayerTests
 */
TMSHelper.runDataLayerTests = function (dl) {
    // count tests run on page (needed for the MochaChai Tag)
    TMSHelper.testsRunOnPage = TMSHelper.testsRunOnPage || 0;
    TMSHelper.testsRunOnPage++;

    // configure mocha/chai
    const assert = chai.assert;
    // Log to Console (boosted by mocha loca plugin by https://github.com/simov/loca (free under the MIT License))
    // Logic for mochaOutputToConsole is taken from the Mocha Tag Template
    if (TMSHelper.mochaOutputToConsole) {
        mocha.reporter(mocha.WebKit);
    }
    mocha.setup({
        ui: 'bdd',
        globals: ['']
    });
    mocha.cleanReferencesAfterRun(false);

    // log processed b object ("output data layer") to console
    console.log("--Final processed 'output' Data Layer used for Mocha/Chai Tests--", b);

    /**
     * Runs tests for a particular Event
     * @param {string} eventName - name of the event
     * @param [mapForThisEvent=TMSHelper.event2DLVarMap] - the Test Logic to test against (otherwise the globalMap (TMSHelper.event2DLVarMap) is used
     * @param {object} dl - data layer to test (current event payload)
     * @module tests/runEventMapTests
     */
    TMSHelper.runEventMapTests = function (eventName, mapForThisEvent, dl) {
        mapForThisEvent = mapForThisEvent || TMSHelper.event2DLVarMap[eventName];

        let populatedAndOfTypeMap = mapForThisEvent.populatedAndOfType;
        if (populatedAndOfTypeMap) {
            describe('"Populated and of Type" Checks for Event Name ' + eventName, function () {
                for (let key in populatedAndOfTypeMap) {
                    if (populatedAndOfTypeMap.hasOwnProperty(key) && !TMSHelper.skipTest(key, dl)) {
                        (function (_dl, _key) { // since we are in a loop and the assert statement is asynchronous,
                            // we need to wrap this in an anonymous function so that the current state of p is evaluated
                            let _keySan = TMSHelper.sanitizeKey(_key); // remove eventual prefixes like M~ from the variable name
                            let text = 'must exist and be of type ' + populatedAndOfTypeMap[_key];
                            //in case of a logical match we dont want to check the following
                            if (!TMSHelper.typeOf(populatedAndOfTypeMap[_key]) === "object") {
                                if (populatedAndOfTypeMap[_key].indexOf("**") === 0) {
                                    text = "is optional (**), but if exists, must be of type " + populatedAndOfTypeMap[_key];
                                } else if (populatedAndOfTypeMap[_key].indexOf("!!") === 0) {
                                    text = "must not exist (!!)";
                                }
                            }
                            it('Populated and of type: ' + _keySan + ' (' + short(_dl[_keySan]) + ') ' + text, function () {
                                assert.isTrue(TMSHelper.populatedAndOfType(_keySan, populatedAndOfTypeMap[_key], _dl));
                            });
                        })(dl, key);
                    }
                }
            });
        }
        if (mapForThisEvent.fullOrRegExMatch) {
            describe('"Full or Regex Match" Checks for Event Name ' + eventName, function () {
                let fullOrRegExMatchMap = mapForThisEvent.fullOrRegExMatch;
                for (let key in fullOrRegExMatchMap) {
                    if (fullOrRegExMatchMap.hasOwnProperty(key) && !TMSHelper.skipTest(key, dl)) {
                        let keySan = TMSHelper.sanitizeKey(key); // remove eventual prefixes like M~ from the variable name
                        if (!TMSHelper.populated(dl[keySan], true, true)) {
                            continue;
                        }
                        (function (_dl, _key, _keySan) {
                            it('Full or Regex Match: ' + _keySan + ' (' + short(_dl[_keySan]) + ') matches the ' +
                                'event name-based definition: ' + short(fullOrRegExMatchMap[_key]), function () {
                                assert.isTrue(TMSHelper.fullOrRegExMatch(_keySan, fullOrRegExMatchMap[_key], _dl));
                            });
                        })(dl, key, keySan);
                    }
                }
            });
        }
        if (mapForThisEvent.functionMatch) {
            describe('"Function Match" Checks for Event Name ' + eventName, function () {
                let functionMatchMap = mapForThisEvent.functionMatch;
                for (let key in functionMatchMap) {
                    if (functionMatchMap.hasOwnProperty(key) && !TMSHelper.skipTest(key, dl)) {
                        let keySan = TMSHelper.sanitizeKey(key);
                        if (!TMSHelper.populated(dl[keySan])) {
                            continue;
                        }
                        (function (_dl, _key, _keySan) {

                            it('Function Match: ' + _keySan + ' (' + short(_dl[_keySan]) + ') matches ' +
                                functionMatchMap[_key], function () {
                                assert.isTrue(TMSHelper.functionMatchFunctions[functionMatchMap[_key]](_dl, _keySan));
                            });
                        })(dl, key, keySan);
                    }
                }
            });
        }
        describe('Done!', function (done) {
            it('Ran all tests for Event Name ' + eventName, function (done) {
                done(); // <-- this tells mocha the test has ended
            });
        });
    };

    /**
     * mergeTestMapsAndFireTests - imports all tests for the current event in a last-definition-wins logic and then fires the actual tests
     * @param {object} dl - Data Layer Object
     * @param {object} eventMap - Mapping Object with variable logic per Event Name
     * @module tests/mergeTestMapsAndFireTests
     */
    TMSHelper.mergeTestMapsAndFireTests = function (dl, eventMap) {
        let en = dl.event_name;
        eventMap = eventMap || TMSHelper.event2DLVarMap;
        describe("Running Event-Name-Based Tests for Event " + en + ":", function () {
            // For any hit, add allEvents Tests
            let eventSchemaArray = TMSHelper.importLib(["allEvents"], eventMap);

            // For Any Prod Hit, add Prod Tests
            if (TMSHelper.populated(TMSHelper.populated(dl.prod_id))) {
                eventSchemaArray = TMSHelper.importLib(["allProdEvents"], eventMap, eventSchemaArray);
            }

            if (eventMap[en]) {
                TMSHelper.console("Event " + en + " is in Events with a test definition. Importing Test Definition.")
                eventSchemaArray = TMSHelper.importLib([en], eventMap, eventSchemaArray);
            } else {
                describe('No specific Tests defined: ', function () {
                    it("No specific Test defined for Event " + en, function (done) {
                        TMSHelper.console("No specific Test defined for Event " + en);
                        done();
                    });
                });
            }
            // merge duplicate schema keys into one object, going through them by order of importing. The last schema (=usually the Event Schema) wins
            let mergedSchema = {};
            for (let i = 0; i < eventSchemaArray.length; i++) {
                for (let key in eventSchemaArray[i]) {
                    if (eventSchemaArray[i].hasOwnProperty(key)) {
                        if (mergedSchema.hasOwnProperty(key)) { // if we have already imported sth for this key
                            // before merging, check if there are multiple test definitions for the same key (this is not a bad thing,
                            // as you can define the "default" at the lower level and the exception for this particular
                            // event at the highest level (highest level wins), see readme)
                            for (let dlv in eventSchemaArray[i][key]) {
                                if (mergedSchema[key].hasOwnProperty(dlv) && mergedSchema[key][dlv] !== eventSchemaArray[i][key][dlv]) {
                                    /* log this
                                    console.groupCollapsed("Info: Multiple " + key + " definitions for variable: " + dlv);
                                    console.log("Original: " + mergedSchema[key][dlv]);
                                    console.log("New: " + eventSchemaArray[i][key][dlv]);
                                    console.groupEnd();
                                    */
                                }
                            }
                            // merging schemas in a way that the key of the last schema (the current eventSchema) always wins
                            mergedSchema[key] = {...mergedSchema[key], ...eventSchemaArray[i][key]};
                        } else {
                            mergedSchema[key] = eventSchemaArray[i][key];
                        }
                    }
                }
            }
            TMSHelper.console("Running Tests for Event Name " + en);
            TMSHelper.runEventMapTests(en, mergedSchema, dl);
        });

    };
    // fire the tests
    TMSHelper.mergeTestMapsAndFireTests(dl, TMSHelper.event2DLVarMap);

    // add mocha stats div to page (we need to add it again after each run because e.g. on SPAs the HTML may have been replaced since the last run)
    mocha.run(asyncOnly = false);
    let style = document.createElement("style");
    document.head.appendChild(style);
    style.sheet.insertRule('#mocha-stats { background-color: white; display:block; margin: 7px; border-color:blue; border-style: dotted; border-width: 4px; z-index:1100; opacity: 1;}');
}; // end of TMSHelper.runDataLayerTests
