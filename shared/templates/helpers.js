/**
 * Keys to ignore (=not run tests for them) depending on platform (=tealium profile).
 * An object with keys = platform (profile) names and values = array of keys to ignore
 * @type {object}
 * @module tests/ignoreKeysForPlatform
 */
TMSHelper.ignoreKeysForPlatform = {
    "profile1": ["variable_that_never_exists_on_profile1"],
    "profile2": [
        "cp.a_cookie_variable_that_never_exists_on_profile2",
        "some_other_variable_that_never_exists_on_profile2"
    ]
};
/**
 * console: uses the window.console.log function to log messages to console, checking if debug output is active
 * @param {*} msg - message to log
 * @param {boolean} [flag] - forces ignoring the debugActive flag (used e.g. by Error Handler) to log also when debugging is off
 * @module helpers/console
 */
TMSHelper.console = function (msg, flag) {
    var check = false;
    if (typeof TMSHelper.debugActive === "function") {
        check = TMSHelper.debugActive(); // define your own function under which circumstances you want TMSHelper.console logs to be posted to the console (e.g. only on QA/DEV environments)
    } else {
        check = true;
    }
    if (flag) {
        check = true;
    }
    if (check) {
        console.log(msg);
    }
};
/**
 * populated
 * @returns true if a variable or an array is populated
 * @param v: variable to inspect. Can be any type
 * @param {Boolean} [zero_ok]: if true, zero is considered populated
 * @param {Boolean} [false_ok]: if true, `false` is considered populated
 * verifies:
 * * String: not "", not undefined, not null
 * * Array: not [], not [""], not [null] not [undefined], not ["","",0]
 * * BOOLEAN: not false
 * * Integer/float: not 0 / 0.0
 * * Object: not undefined
 * @module helpers/populated
 **/
TMSHelper.populated = function (v, zero_ok, false_ok) {
    if (!v) {
        if (zero_ok) {
            if (v === 0) {
                return true;
            }
        }
        if (false_ok) {
            if (v === false) {
                return true;
            }
        }
        return false;
    }
    if (v instanceof Array) {
        if (v.length) {
            for (var i = 0, ii = v.length; i < ii; i++) {
                if (v[i]) {
                    return true;
                }
                if (zero_ok) {
                    if (v[i] === 0) {
                        return true;
                    }
                }
                if (false_ok) {
                    if (v[i] === false) {
                        return true;
                    }
                }
            }
        }
    } else {
        if (v) {
            return true;
        }
    }
    return false;
};
/**
 * gets type of variable (according to utag.ut.typeOf logic: "regexp, array, string, object, number, boolean")
 * @param {*} e - variable to check
 * @returns {string}
 * @module helpers/typeOf
 */
TMSHelper.typeOf = function (e) {
    return ({}).toString.call(e).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};
/**
 * shortPreview: gives a (by default 80-character) short preview of a variable's value, e.g. to not show all 78 array values
 * @param {*} val - value to preview
 * @param {number} [len] - how many characters short
 * @module tests/shortPreview
 */
TMSHelper.shortPreview = function (val, len) {
    len = len || 80;
    if (TMSHelper.populated(val)) {
        if (TMSHelper.typeOf(val) === "regexp") {
            val = val.toString();
        } else {
            val = JSON.stringify(val);
        }
        if (val.length > len) {
            val = val.slice(0, len) + "...";
        }
        return val;
    }
};
/**
 * checks if a variable is in the TMSHelper.ignoreKeysForPlatform ignore list for the current Tealium profile
 * or if it has a T~ or M~ prefix and then if the test for it should run on the current testing environment (Teal Func or Mocha)
 * @param {string} variable - DL property name
 * @param {object} dl - data layer of current event payload
 * @returns {Boolean} true if test should be skipped
 * @module helpers/skipTest
 */
TMSHelper.skipTest = function (variable, dl) {
    //check if the variable is in the ignore key list for the current platform
    if (TMSHelper.ignoreKeysForPlatform[dl["ut.profile"]]) {
        if (TMSHelper.ignoreKeysForPlatform[dl["ut.profile"]].indexOf(TMSHelper.sanitizeKey(variable)) !== -1) {
            return true;
        }
    }
    if (variable.search(/^[MT]~/) === -1) {
        return false; // no prefix => test runs everywhere, don't skip
    }
    var prefix = variable.slice(0, 2);
    if (TMSHelper.mochaChaiExt) {
        return prefix !== "M~"; // if mochaChai env, return true (skip) if prefix is not M~
    }
    return prefix !== "T~"; // otherwise, we are in Teal function -> return true (skip) if prefix is not T~
};
/**
 * Cleans keys from prefixes (currently M~ or T~, but can be extended)
 * @param {string} key - the data layer property name
 * @returns {string} - the sanitized key
 * @module helpers/sanitizeKey
 */
TMSHelper.sanitizeKey = function (key) {
    if (key.search(/^[MT]~/) === -1) {
        return key;
    }
    return key.slice(2);
};
/**
 * Mocha/Chai: a RegExp to check any kind of price to be either in format 100.30 or 1 (int)
 * @type {string}
 *
 * @module helpers/regExpPrice
 */
TMSHelper.regExpPrice = "/^([1-9]\\d*|0)(\\.\\d{1,2}|)$/";

/**
 * Mocha/Chai: a RegExp to check if a value is a positive integer
 * @type {string}
 *
 * @module helpers/positiveInt
 */
TMSHelper.positiveInt = "/^[1-9]\\d*$/";

/**
 * Mocha/Chai: a RegExp to check if a value is a positive integer
 * @type {string}
 *
 * @module helpers/positiveIntOrZero
 */
TMSHelper.positiveIntOrZero = "/^(zero|[1-9]\\d*)$/";
/**
 * checks which type of logical test is used and runs it
 * @param {string} dlvar - dataLayer variable name
 * @param {object} testDef - Object with the logical test definitions e.g. switch definition
 * @param  {object} _dl - dataLayer
 * @param {string} testType - type of test to run (e.g. "fullOrRegexMatch")
 * @returns {Boolean} result of the logical test
 * @module helpers/logicalTest
 */
TMSHelper.logicalTest = function (dlvar, testDef, _dl, testType) {
    if (testDef.hasOwnProperty("switch")) {
        // switchOn = the first and only key has the variable name to switch on (e.g. "ut.profile")
        let switchOn = Object.keys(testDef.switch)[0];
        // if the dl value (eg "main") for the var on which to switch (eg dl["ut.profile"]) is not defined as a value to switch on in the test definition, we check for the default
        let theTest = testDef.switch[switchOn][_dl[switchOn]] || testDef.switch[switchOn]["default"];
        if (!TMSHelper.mochaChaiExt) {
            let testMap = {};
            testMap[dlvar] = theTest;
            return TMSHelper[testType](testMap);
        } // otherwise in Mocha:
        return TMSHelper[testType](dlvar, theTest, _dl); // ignore IDE error because mocha's fullOrRegExMatch expects different parameters
    } else {
        TMSHelper.handleError("Unhandled logical test type", _dl, dlvar, testType);
    }
};
/**
 * handles Errors in a way that is compatible with both Mocha & Tealium Unit Tests,
 * i.e. throws an Error in Mocha and logs to the error array in Tealium Unit Tests.
 * @param {string} msg - error message to log
 * @param {object} dl - the data layer
 * @param {string} prop - the key in the data layer we are testing
 * @param {string} testType - the type of test we are running (e.g. "functionMatch")
 * @returns {boolean}
 * @module helpers/handleError
 */
TMSHelper.handleError = function (msg, dl, prop, testType) {
    if (!TMSHelper.mochaChaiExt) {
        error.add(testType, prop, eventName, msg);
        return false;
    }
    throw Error(msg);
};
/**
 * collects functions that can be used in the "functionMatch" part of the schema to test a variable against more complex conditions
 * The functions here are only for illustrative purposes, feel free to remove them
 * A function is not tied to a particular variable
 * @type {Object}
 * @module helpers/functionMatchFunctions
 */
TMSHelper.functionMatchFunctions = {
    /**
     * checks for value "fallback" in the first element of an array or a string
     * @param dl {Object} - data layer
     * @param prop {string} - property name to check
     * @returns {boolean}
     */
    notFallback: function (dl, prop) {
        var val = dl[prop];
        if (val instanceof Array) {
            val = val[0];
        }
        if (val === "fallback") {
            return TMSHelper.handleError(prop + "is 'fallback'!", dl, prop, "functionMatch");
        }
        return true;
    },
    /**
     * validates the page_category_name
     * @param dl {Object} - data layer
     * @param prop {string} - property name to check
     * @returns {boolean}
     */
    validatePageCategory: function (dl, prop) { // exists only on cat pages
        if (dl.page_type === "Category") {
            if (!dl[prop] || dl[prop].search(/[a-z]+[\-a-z]+/) === -1) {
                return TMSHelper.handleError("page_category not defined or false value: " + dl[prop], dl, prop, "functionMatch");
            }
        }
        return true;
    },
    /**
     * ossTermCheck: checks if search term is formatted correctly or missing even though it should be there.
     * @param {object} dl: the data layer
     * @param {string} prop: the key in the data layer that contains the search term
     * @returns {Boolean} true or throws Error
     * @module helpers/ossTermCheck
     */
    ossTermCheck: function (dl, prop) {
        if (TMSHelper.getParameterByName("query", dl["url_search"])) { // url param "query" exists
            if (!dl[prop]) {
                return TMSHelper.handleError("Search Term (" + prop + ") not set!", dl, prop, "functionMatch");
            }
            return true;
        } else if (dl[prop] !== "*") {
            return TMSHelper.handleError("Search Term (" + prop + ") should be *, but is " + dl[prop], dl, prop, "functionMatch");
        }
        return true;
    }
    //, next function
};
const short = TMSHelper.shortPreview;