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
 * returns true if a variable or an array is actually populated
 * String: not "", not undefined, not null
 * Array: not [], not [""], not [null] not [undefined], not ["","",0]
 * BOOLEAN: not false
 * Integer/float: not 0 / 0.0
 * Object: not undefined
 * @param {*} a - the variable to check
 * @returns Boolean
 * @module tests/populated
 */
TMSHelper.populated = function (a) {
    if (!a) return !1;
    if (a instanceof Array) {
        if (a.length) {
            for (var b = 0, c = a.length; b < c; b++) if (a[b]) return !0
        }
    } else if (a) return !0;
    return !1
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
 * shortPreview: gives a (by default 50-character) short preview of a variable's value, e.g. to not show all 78 array values
 * @param {*} val - value to preview
 * @param {number} [len] - how many characters short
 * @module tests/shortPreview
 */
TMSHelper.shortPreview = function (val, len) {
    len = len || 50;
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
 * checks if a variable has a T~ or M~ prefix and then if the test for it should run on the current testing environment (Teal Func or Mocha)
 * @param {string} variable - DL property name
 * @param [dl=eventData|b] - data layer of current event payload
 * @returns {Boolean} true if test should be skipped
 * @module tests/skipTest
 */
TMSHelper.skipTest = function (variable, dl) {
    if (!dl) {
        if (TMSHelper.mochaChaiExt) {
            dl = b;
        } else {
            dl = eventData;
        }
    }
    //check if the variable is in the ignore key list for the current platform
    if (TMSHelper.ignoreKeysforPlatform[dl["ut.profile"]]) {
        if (TMSHelper.ignoreKeysforPlatform[dl["ut.profile"]].indexOf(TMSHelper.sanitizeKey(variable)) !== -1) {
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
 * @module tests/sanitizeKey
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
 * @module tests/regExpPrice
 */
TMSHelper.regExpPrice = "/^([1-9]\\d*|0)(\\.\\d{1,2}|)$/";

/**
 * Mocha/Chai: a RegExp to check if a value is a positive integer
 * @type {string}
 *
 * @module tests/positiveInt
 */
TMSHelper.positiveInt = "/^[1-9]\\d*$/";

/**
 * Mocha/Chai: a RegExp to check if a value is a positive integer
 * @type {string}
 *
 * @module tests/positiveIntOrZero
 */
TMSHelper.positiveIntOrZero = "/^(zero|[1-9]\\d*)$/";
/**
 * checks which type of logical test is used and return testMap
 * @param {string} dlvar - dataLayer variable name
 * @param {object} testDef - Object with the logical test definitions e.g. switch definition
 * @param  {object} _dl - dataLayer
 * @returns {*} result of a fullOrRegExMatch for the logical test
 * @module tests/logicalRegExMatch
 */
TMSHelper.logicalRegExMatch = function (dlvar, testDef, _dl) {
    if (testDef.hasOwnProperty("switch")) {
        // switchOn = the first and only key has the variable name to switch on (e.g. "ut.profile")
        let switchOn = Object.keys(testDef.switch)[0];
        // switchKey = the key of the switch object that contains the values on which to switch (e.g. "main")
        // if the dl value (eg "main") for the var on which to switch (eg dl["ut.profile"]) is not defined as a value to switch on in the test definition, we check for the default
        let theTest = testDef.switch[switchOn][_dl[switchOn]] || testDef.switch[switchOn]["default"];
        if (!TMSHelper.mochaChaiExt) {
            let testMap = {};
            testMap[dlvar] = theTest;
            return TMSHelper.fullOrRegExMatch(testMap);
        } // otherwise in Mocha:
        return TMSHelper.fullOrRegExMatch(dlvar, theTest, _dl); // ignore IDE error because mocha's fullOrRegExMatch expects different parameters
    } else {
        TMSHelper.handleError("Unhandled logical test type in TMSHelper.logicalRegExMatch", _dl, dlvar, "fullOrRegExMatch");
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
 * @module tests/handleError
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
 * @module tests/functionMatchFunctions
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
     * @module tests/ossTermCheck
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
var short = TMSHelper.shortPreview;