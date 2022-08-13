# Tealium Client-and-Server-Side Data Layer Testing Framework

## Introduction

This framework validates Tealium Data Layer Events via ...

* __Tealium iQ (`tealium-iq` folder):__ client-side for ad-hoc testing in your browser via a Mocha/Chai-JS based tag + "
  After Tags" Extension (folders `extensions` and `tags`)
* __Tealium Functions (`tealium-functions` folder):__ server-side for all Events of all users

Both frameworks use the same JSON-schema-based data layer test definitions (see `shared/globals`).

In the Tealium iQ (MochaChai) variant, errors are reported visually as you browse. Server-Side errors are logged in the
Tealium Functions console and to your destination of choice, e.g. a Google Cloud Function + Firestore for deeper
debugging and an influxDB for monitoring.

## Event Names

All tests are triggered by __Event Names__. The Event Name is transmitted via the Data Layer variable `event_name`. 
An Event Name is whatever you define it to be. An example could be a concatenation (separator: \_\_ (double underscore) of:

* the Tealium Event ("view"/"link") plus
    * `component_category` + "_" + `component_subcategory`
        * or `page_type`
            * or "na" if neither of the above (unspecific pageviews)

__Examples:__

* `link__srchFilter__select`
* `view__ecommerce__purchase`

The script will look if there is a test for the given Event Name. If there is a test, it will load the Test Schema and
import the libraries or other Schema Lists for the test.

Failed Tests are logged to an `error` Object. The error object will be logged as an exception in Tealium Functions, and
it can be sent to your destination of choice (e.g. an InfluxDB and/or a Google Cloud Function URL) for more monitoring
and debugging.

### What is a good Event Name?

Make sure to define your event names not too low-granular so you don't need to write too many tests for very similar
events (see "Importing (referencing) other test definitions" below on how to set up your test definitions with as little
redundancy as possible)). E.g. an Event name containing the URL Path is too low-granular, because it would assume that
every page has its own data layer tests.

## Test Schemas ("globals")

The Test Schemas (in the `shared/globals` folder) are JSON files named after the Event Name,
e.g. `view__ecommerce__purchase.json`.

For example, this is how the Test schema could look like for PDP Views:

```json
{
  "import": [
    "ecommerceGeneralTemplate"
  ],
  "eventSchema": {
    "populatedAndOfType": {
      "url_permaLink_de": "string",
      "!order_id"
    },
    "fullOrRegExMatch": {
      "prod_action": "detail",
      "prod_id": "/\\d+/",
      "page_type": "Product"
    },
    "functionMatch": {
      "prod_cat_l1": "checkCategoryNames"
    }
  }
}
```

See the following paragraphs to illustrate this example:

### Importing (referencing) other test definitions

The `import` property is used to import entire predefined test schemas. Here, we import the `ecommerceGeneralTemplate`
schema which could contain all variables common for all e-commerce events. This means we do not have to define commonly
shared tests in each event schema again.

You can import **multiple** test schemas. If the same data layer variable is defined in multiple imported schemas, the
definition from the last imported schema wins.

The `eventSchema` property is used to define the test schema for the given event. It _overrides any other imported
definitions_.

The `eventSchema` property is mandatory if the schema requires imports. If there are no imports, you can directly write
the test definitions (without `eventSchema` around them).

### Test Types

The schema is a JSON object and can have the following properties (test definitions):

- `populatedAndOfType`
- `fullOrRegExMatch`
- `functionMatch`

They are explained as follows:

#### populatedAndOfType

Checks if the given data layer variable is populated and of the given type. Supported types are JS return values
of `typeof` (e.g. "object", "string") plus "array". The Helper Function (in `templates/helpers`) `TMSHelper.typeOf` is
for this. It mimicks Tealium's own `ut.typeOf` function.

**Special Commands:**

* `**` = "optional". Example: `"url_permaLink_de": "**string"` (url_permaLink is not mandatory, but if it is part of the
  data layer, it has to be a string)
* `!!` = "must _not_ be populated". Test passes if the given data layer variable is not populated (
  not `undefined, null, "", false, []`).

Example:

```json
{
  "populatedAndOfType": {
    "url_permaLink_de": "string",
    "prod_action": "array",
    "user_debid": "**string",
    "order_id": "!!"
  }
} 
```

#### fullOrRegExMatch

Checks ...

* if a data layer variable's value matches the given Regular Expression (string starting and ending with "/",
  e.g. `"variable": "/^myRegexpAsAStringIEWith\\Backslashes-doublescaped$/"`)
* or is equal to the given value (`"variable": "value"`)

It is also possible to add links to predefined Regular Expressions with `//name`. The Regex are stored in the TMSHelper
Object. For example, `"//positiveInt"` will check `TMSHelper.positiveInt`. If the definition of TMSHelper.positiveInt (a
positive integer number) ever changes, you don't need to update all test schemas using it.

In more complex cases, you can use switches to check if a given data layer variable's value matches the given RegEx
depending on the given switch Key. Example below: Check url_rootDomain and switch on ut.profile.

Example:

```json
{
  "fullOrRegExMatch": {
    "prod_action": "/^detail$/",
    "page_type": "Product",
    "product_id": "//postiveInt",
    "url_rootDomain": {
      "switch": {
        "ut.profile": {
          "main": "maindomain.ch",
          "profile2": "/(value1|value2|value3)\\.ch/",
          "anotherprofile": "/(value4|value5)\\.ch/",
          "default": "unexpected domain"
        }
      }
    }
  }
}
```

#### functionMatch

For more complex logic, the functionMatch logic allows to run a custom JS function that must be part of the
TMSHelper.functionMatchFunctions object (see `template/helpers`). Functions must return `true` or `false` if the test
is (not) passed.

```json
{
  "TheEventName": {
    "functionMatch": {
      "page_type": "validatePageTypeOnSearch"
    }
  }
}
```

This will run `TMSHelper.functionMatchFunctions.validatePageTypeOnSearch(eventData, "value of page_type")`

### Ignore Variables by Tealium Profile

In some cases you want to ignore certain data layer variables on a specific platform (=Tealium Profile). For this, you
add this variable to the ignore list:

```javascript
TMSHelper.ignoreKeysForPlatform = {
    "profile1": ["variable_that_never_exists_on_profile1"],
    "profile2": [
        "cp.a_cookie_variable_that_never_exists_on_profile2",
        "some_other_variable_that_never_exists_on_profile2"
    ]
};
```

In the example above, if the data layer Event is sent from Tealium profile "profile2", no data layer tests will be run
for variables `cp.a_cookie_variable_that_never_exists_on_profile2`
and `some_other_variable_that_never_exists_on_profile2`.

## Error Logging

### Tealium Function Logs

At the end of the Test Script, the `error` object and some context messages are printed to the Tealium logs if it
contains errors. Filter the logs for "Exceptions" to see all failed tests.

# TODO Remove from official documentation, but make part of internal docs

### InfluxDB monitoring

Moreover, the errors are sent to an InfluxDB for aggregate real-time monitoring and alerting.

### Google Cloud Logging

In case of an error. the full data layer and the `error` object are also sent to a Google Cloud Function for filtrable
detailed logging in Google Cloud Logs (filter for `log_datalayer_error`. All errors are also stored in Firestore for
easy viewing of the data layer for a particular error. The script run id (which is also prepended to every Cloud log) is
also the Firestore Document ID. See this video "From InfluxDB to GCP Logs" on how to debug
there: https://www.loom.com/share/d8ba9f6f039c428da994f0f6ab5da16b

# TODO END REMOVE FROM official doc

## Gulp Workflows

### Full Build

Run `gulp build` to

* generate concatenated Event Map JS and JSON files as well as minified versions of them
* insert the updated Event Map into the Tealium Function (`functions/unit_test.js`)
* update the helper functions in both the Mocha Extension and the Tealium Function

The following explains each of the `build` actions:

### Generate concatenated Event Map File

Concatenates all test schemas into one file (e.g. to use in MochaChai Tests in Tealium iQ Extension)
Change test definitions ONLY in the `shared/globals` folder.

After changing any test definition, run `gulp generateEventMap`.

This generates:

- a file with all test definitions as one large JS object in `/globals/eventMap.js` and a minified version of it
  in `/globals/eventMap.min.js`
- the same as .json (`globals/eventMap.json` and `...min.json`)

### Insert updated Event Map into Tealium Function (unit_test.js)

`gulp updateTFMap`
This updates the Tealium Function (unit_test.js) with `eventMap.min.js`.

### Update shared Helper Functions

The client-side Mocha tests share most Helper functions with the server-side Tealium functions. To avoid duplicate
maintenance effort, the shared functions are located in `globals\helpers.js`.

After updates to the helper functions, re-insert them (in minified form) into the MochaChai Extension and the Tealium
Function (unit_test.js) via

`gulp updateHelpers`
