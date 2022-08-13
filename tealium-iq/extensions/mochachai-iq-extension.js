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
    TMSHelper.ignoreKeysForPlatform={profile1:["variable_that_never_exists_on_profile1"],profile2:["cp.a_cookie_variable_that_never_exists_on_profile2","some_other_variable_that_never_exists_on_profile2"]},TMSHelper.console=function(e,r){var t=!1,t="function"!=typeof TMSHelper.debugActive||TMSHelper.debugActive();(t=r?!0:t)&&console.log(e)},TMSHelper.populated=function(e){if(e)if(e instanceof Array){if(e.length)for(var r=0,t=e.length;r<t;r++)if(e[r])return!0}else if(e)return!0;return!1},TMSHelper.typeOf=function(e){return{}.toString.call(e).match(/\s([a-zA-Z]+)/)[1].toLowerCase()},TMSHelper.shortPreview=function(e,r){if(r=r||50,TMSHelper.populated(e))return e=(e="regexp"===TMSHelper.typeOf(e)?e.toString():JSON.stringify(e)).length>r?e.slice(0,r)+"...":e},TMSHelper.skipTest=function(e,r){if(r=r||(TMSHelper.mochaChaiExt?b:eventData),TMSHelper.ignoreKeysforPlatform[r["ut.profile"]]&&-1!==TMSHelper.ignoreKeysforPlatform[r["ut.profile"]].indexOf(TMSHelper.sanitizeKey(e)))return!0;if(-1===e.search(/^[MT]~/))return!1;r=e.slice(0,2);return TMSHelper.mochaChaiExt?"M~"!==r:"T~"!==r},TMSHelper.sanitizeKey=function(e){return-1===e.search(/^[MT]~/)?e:e.slice(2)},TMSHelper.regExpPrice="/^([1-9]\\d*|0)(\\.\\d{1,2}|)$/",TMSHelper.positiveInt="/^[1-9]\\d*$/",TMSHelper.positiveIntOrZero="/^(zero|[1-9]\\d*)$/",TMSHelper.logicalRegExMatch=function(r,t,e){if(t.hasOwnProperty("switch")){var l=Object.keys(t.switch)[0],t=t.switch[l][e[l]]||t.switch[l].default;if(TMSHelper.mochaChaiExt)return TMSHelper.fullOrRegExMatch(r,t,e);{let e={};return e[r]=t,TMSHelper.fullOrRegExMatch(e)}}TMSHelper.handleError("Unhandled logical test type in TMSHelper.logicalRegExMatch",e,r,"fullOrRegExMatch")},TMSHelper.handleError=function(e,r,t,l){if(TMSHelper.mochaChaiExt)throw Error(e);return error.add(l,t,eventName,e),!1},TMSHelper.functionMatchFunctions={notFallback:function(e,r){var t=e[r];return"fallback"!==(t=t instanceof Array?t[0]:t)||TMSHelper.handleError(r+"is 'fallback'!",e,r,"functionMatch")},validatePageCategory:function(e,r){return!!("Category"!==e.page_type||e[r]&&-1!==e[r].search(/[a-z]+[\-a-z]+/))||TMSHelper.handleError("page_category not defined or false value: "+e[r],e,r,"functionMatch")},ossTermCheck:function(e,r){return TMSHelper.getParameterByName("query",e.url_search)?!!e[r]||TMSHelper.handleError("Search Term ("+r+") not set!",e,r,"functionMatch"):"*"===e[r]||TMSHelper.handleError("Search Term ("+r+") should be *, but is "+e[r],e,r,"functionMatch")}};var short=TMSHelper.shortPreview;
    // Shared TMSHelper functions end
// @formatter:on

// Mocha-specific Helper functions
/**
 * populatedAndOfType: checks if a variable variable is of type type (according to utag.ut.typeOf logic: "regexp, array, string, object, number, boolean")
 * @param {object} variable - variable to check whether populated and type
 * @param {string} type - type
 * @returns {boolean}
 * @module tests/populatedAndOfType
 */
TMSHelper.populatedAndOfType = function (variable, type) {
    // not populated (value = "!!")
    if (type.substring(0, 2) === "!!") {
        return TMSHelper.notPopulatedThrow(variable);
    }
    // optionally populated (value = "**type"
    else if (type.substring(0, 2) === "**") {
        if (TMSHelper.populated(variable) && TMSHelper.typeOf(variable) === type.substring(2)) {
            return true;
        }
        if (!TMSHelper.populated(variable)) {
            return true;
        }
    }
    // must be populated and of type (value = "type")
    if (TMSHelper.populated(variable) && (TMSHelper.typeOf(variable) === type)) {
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
 * fullOrRegExMatch: checks a variable value v against c (a string = full match, or c = regexp match)
 *
 * @param {*} v - value to check (e.g. value of a data layer variable)
 * @param {*} c - value or regexp to check against.
 * @param {object} dl - current data layer
 * @returns {boolean}
 * @module tests/fullOrRegExMatch
 */
TMSHelper.fullOrRegExMatch = function (v, c, dl) {
    if (TMSHelper.typeOf(c) === "object") {
        return TMSHelper.logicalRegExMatch(v, c, dl);
    }
    var isRegex;
    if (!(v instanceof Array)) {
        v = [v];  // transform value into array so we can treat anything like an Array and avoid redundancies
    }
    let theTest = c;
    // to keep it compatible with MochaChai Test definitions
    if (c instanceof Array) {
        theTest = c[0];
    }

    isRegex = theTest.search(/^\/.*\/$/) > -1; // first and last chars = "/" => it must be a regex
    if (isRegex) {
        theTest = new RegExp(theTest.substring(1, theTest.length - 1)); // strip preceding and trailing / and turn the rest into a regexp
    } else if (theTest.substring(0, 2) === "//") { // "//" at the start signify reference to TMSHelper[regExpString]
        let regexName = theTest.substring(2);
        theTest = new RegExp(TMSHelper[regexName].substring(1, TMSHelper[regexName].length - 1));
    } else {
        theTest = new RegExp("^" + theTest + "$"); // add ^ and $ to make it an "equals"
    }
    for (let i = 0; i < v.length; i++) {
        var dlval = v[i].toString(); // setting to string to allow re searches
        if (dlval.search(theTest) === -1) {
            throw Error("The value or at least one value in the Array (first value: " + v[i].toString() + ") does not match the string or RegExp. " + c.toString());
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
        var lib = eventMap[libNames[i]];
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
    var assert = chai.assert;
    mocha.setup({
        ui: 'bdd'
    }); // sets UI
    mocha.cleanReferencesAfterRun(false);

    // output processed b object to console
    console.log("--Final processed Data Layer used for Mocha/Chai Tests--", b); // we do this on purpose with console.log because TMSHelper.console may be inactive on purpose to not get flooded with other debug output

    /**
     * Runs tests for a particular Event
     * @param {string} eventName - name of the event
     * @param [mapForThisEvent=TMSHelper.event2DLVarMap] - the Test Logic to test against (otherwise the globalMap (TMSHelper.event2DLVarMap) is used
     * @param {object} dl - data layer to test (current event payload)
     * @module tests/runEventMapTests
     */
    TMSHelper.runEventMapTests = function (eventName, mapForThisEvent, dl) {
        mapForThisEvent = mapForThisEvent || TMSHelper.event2DLVarMap[eventName];

        var populatedAndOfTypeMap = mapForThisEvent.populatedAndOfType;
        if (populatedAndOfTypeMap) {
            describe('"Populated and of Type" Checks for Event Name ' + eventName, function () {
                for (var key in populatedAndOfTypeMap) {
                    if (populatedAndOfTypeMap.hasOwnProperty(key) && !TMSHelper.skipTest(key)) {
                        (function (_dl, _key) { // since we are in a loop and the assert statement is asynchronous,
                            // we need to wrap this in an anonymous function so that the current state of p is evaluated
                            var _keySan = TMSHelper.sanitizeKey(_key); // remove eventual prefixes like M~ from the variable name
                            var text = 'must exist and';
                            if (populatedAndOfTypeMap[_key].indexOf("**") === 0) {
                                text = 'is optional (**), but if exists, must ';
                            }
                            it('Populated and of type: ' + _keySan + ' (' + short(_dl[_keySan]) + ') ' + text + ' be of ' +
                                'type ' + populatedAndOfTypeMap[_key], function () {
                                assert.isTrue(TMSHelper.populatedAndOfType(_dl[_keySan], populatedAndOfTypeMap[_key]));
                            });
                        })(dl, key);
                    }
                }
            });
        }
        if (mapForThisEvent.fullOrRegExMatch) {
            describe('"Full or Regex Match" Checks for Event Name ' + eventName, function () {
                var fullOrRegExMatchMap = mapForThisEvent.fullOrRegExMatch;
                for (var key in fullOrRegExMatchMap) {
                    if (fullOrRegExMatchMap.hasOwnProperty(key) && !TMSHelper.skipTest(key)) {
                        var keySan = TMSHelper.sanitizeKey(key); // remove eventual prefixes like M~ from the variable name
                        if (!TMSHelper.populated(dl[keySan])) {
                            continue;
                        }
                        (function (_dl, _key, _keySan) {
                            it('Full or Regex Match: ' + _keySan + ' (' + short(_dl[_keySan]) + ') matches the ' +
                                'event name-based definition: ' + short(fullOrRegExMatchMap[_key]), function () {
                                assert.isTrue(TMSHelper.fullOrRegExMatch(_dl[_keySan], fullOrRegExMatchMap[_key], _dl));
                            });
                        })(dl, key, keySan);
                    }
                }
            });
        }
        if (mapForThisEvent.functionMatch) {
            describe('"Function Match" Checks for Event Name ' + eventName, function () {
                var functionMatchMap = mapForThisEvent.functionMatch;
                for (var key in functionMatchMap) {
                    if (functionMatchMap.hasOwnProperty(key) && !TMSHelper.skipTest(key)) {
                        var keySan = TMSHelper.sanitizeKey(key);
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
        var en = dl.event_name;
        eventMap = eventMap || TMSHelper.event2DLVarMap;
        describe("Running Event-Name-Based Tests for Event " + en + ":", function () {
            // For any hit, add allEvents Tests
            var eventSchemaArray = TMSHelper.importLib(["allEvents"], eventMap);

            // For Any Prod Hit, add Prod Tests
            if (TMSHelper.populated(TMSHelper.populated(dl.prod_id))) {
                eventSchemaArray = TMSHelper.importLib(["anyProdHit"], eventMap, eventSchemaArray);
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
            var mergedSchema = {};
            for (var i = 0; i < eventSchemaArray.length; i++) {
                for (var key in eventSchemaArray[i]) {
                    if (eventSchemaArray[i].hasOwnProperty(key)) {
                        if (mergedSchema.hasOwnProperty(key)) { // if we have already imported sth for this key
                            // before merging, check if there are multiple test definitions for the same key (this is not a bad thing,
                            // as you can define the "default" at the lower level and the exception for this particular
                            // event at the highest level (highest level wins), see readme)
                            for (var dlv in eventSchemaArray[i][key]) {
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
        // fire the tests
        TMSHelper.mergeTestMapsAndFireTests(dl, TMSHelper.event2DLVarMap);

        mocha.run(asyncOnly = false);
        var style = document.createElement("style");
        document.head.appendChild(style);
        style.sheet.insertRule('#mocha-stats { background-color: white; display:block; margin: 7px; border-color:blue; border-style: dotted; border-width: 4px; z-index:1100; opacity: 1;}');
    }; // end of TMSHelper.runDataLayerTests
};
// end of Mocha Extension Code