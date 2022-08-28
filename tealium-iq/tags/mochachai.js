//~~tv:20010.20140827
//~~tc: Tealium Custom Container

/*
  Tealium Custom Container Notes:
  - Add sending code between "Start Tag Sending Code" and "End Tag Sending Code".
  - Add JavaScript tag library code between "Start Tag Library Code" and "End Tag Library Code".
  - Add JavaScript code only, do not add HTML code in this file.
  - Remove any <script> and </script> tags from the code you place in this file.

  Loading external JavaScript files (Loader):
  - If you need to load an additional external JavaScript file, un-comment the singe-line JavaScript comments ("//") within the following Loader sections near the bottom of this file:
      - "Start Loader Function Call"
      - "End Loader Function Call"
      - "Start Loader Callback Function"
      - "End Loader Callback Function"
  - After un-commenting, insert the path to the external JavaScript file you want to load.
  - Finally, within the Loader callback function, insert the JavaScript code that should run after the external JavaScript file has loaded.
*/

/* Start Tag Library Code */

/* End Tag Library Code */

//tealium universal tag - utag.sender.custom_container ut4.0.##UTVERSION##, Copyright ##UTYEAR## Tealium.com Inc. All Rights Reserved.
try {
  (function (id, loader) {
    var u = {};
    utag.o[loader].sender[id] = u;

    // Start Tealium loader 4.32
    // Please do not modify
    if (utag === undefined) { utag = {}; } if (utag.ut === undefined) { utag.ut = {}; } if (utag.ut.loader === undefined) { u.loader = function (o) { var a, b, c, l; a = document; if (o.type === "iframe") { b = a.createElement("iframe"); b.setAttribute("height", "1"); b.setAttribute("width", "1"); b.setAttribute("style", "display:none"); b.setAttribute("src", o.src); } else if (o.type === "img") { utag.DB("Attach img: " + o.src); b = new Image(); b.src = o.src; return; } else { b = a.createElement("script"); b.language = "javascript"; b.type = "text/javascript"; b.async = 1; b.charset = "utf-8"; b.src = o.src; } if (o.id) { b.id = o.id; } if (typeof o.cb === "function") { if (b.addEventListener) { b.addEventListener("load", function () { o.cb(); }, false); } else { b.onreadystatechange = function () { if (this.readyState === "complete" || this.readyState === "loaded") { this.onreadystatechange = null; o.cb(); } }; } } l = o.loc || "head"; c = a.getElementsByTagName(l)[0]; if (c) { utag.DB("Attach to " + l + ": " + o.src); if (l === "script") { c.parentNode.insertBefore(b, c); } else { c.appendChild(b); } } }; } else { u.loader = utag.ut.loader; }
    // End Tealium loader

    u.ev = {'view' : 1,
        'link': 1
    };

    u.initialized = false;

    ##UTGEN##

    u.send = function(a, b) {
      if (u.ev[a] || u.ev.all !== undefined) {
        //##UTENABLEDEBUG##utag.DB("send:##UTID##");

        var c, d, e, f, i;

        u.data = {
          /* Initialize default tag parameter values here */
          /* Examples: */
          /* "account_id" : "1234567" */
          //"base_url_moca" : "//unpkg.com/mocha@6.2.1/mocha.js",
         // "base_url_chai" : "//unpkg.com/chai@4.2.0/chai.js"
          /* A value mapped to "account_id" or "base_url" in TiQ will replace these default values. */
        };


        /* Start Tag-Scoped Extensions Code */
        /* Please Do Not Edit This Section */
        ##UTEXTEND##
        /* End Tag-Scoped Extensions Code */


        /* Start Mapping Code */
        for (d in utag.loader.GV(u.map)) {
          if (b[d] !== undefined && b[d] !== "") {
            e = u.map[d].split(",");
            for (f = 0; f < e.length; f++) {
              u.data[e[f]] = b[d];
            }
          }
        }
        /* End Mapping Code */


        /* Start Tag Sending Code */

                    // Insert your tag sending code here.
                    window.TMSHelper = window.TMSHelper || {};
                    // remove div for mocha if exists to avoid inserting the same div again and again (leads to the same tests appearing multiple times)
                    try { // works only after one test has already run
                        var h = document.getElementById("mocha");
                        h.parentNode.removeChild(h);
                    } catch (e) {
                    }
                    // insert div for mocha
                    var el = document.createElement("div");
                    el.id = "mocha";
                    document.body.appendChild(el);
                    //  on first run: Insert DIV and CSS from mocha
                    if (!TMSHelper.testsRunOnPage) {

                        var mocaCSSFile = "https://unpkg.com/mocha@8.2.1/mocha.css";
                        var mochaCSS = document.createElement("link");
                        mochaCSS.setAttribute("rel", "stylesheet");
                        mochaCSS.setAttribute("type", "text/css");
                        mochaCSS.setAttribute("href", mocaCSSFile);
                        document.head.appendChild(mochaCSS);

                        // add possibility to scroll to results by clicking on passes / failures
                        document.body.addEventListener("click", function (event) {
                            if (event.target.matches(".failures a") || event.target.matches(".passes a")) {
                                var el = document.querySelectorAll("#mocha-report")[0];
                                el.scrollIntoView();
                            }
                        });
                    }
                    /* End Tag Sending Code */

                    /* Start Loader Callback Function */
                    /* Un-comment the single-line JavaScript comments ("//") to use this Loader callback function. */
                    // this is run after mocha and chai libraries have been downloaded and are parsed and the tests in the tag-scoped Ext have run
                    u.loader_cb = function () {
                        u.initialized = true;
                        /* Start Loader Callback Tag Sending Code */
                        // Insert your post-Loader tag sending code here.
                        TMSHelper.mochaChaiServed = true;
                        console.log("mocha: in u.loader_cb", 1);
                        if (typeof window.chai === "object" && typeof window.mocha === "object") {
                            console.log("Loading mocha (" + mocha.version + ") & chai (" + chai.version + ") libs completed! Enjoy!", 1);
                            if (TMSHelper.runDataLayerTests) {
                                // fire the data layer tests (TMSHelper.runDataLayerTests function is defined in the MochaChai iQ Extension)
                                TMSHelper.runDataLayerTests(b);
                            } else {
                                console.log("no mochaChaiTests defined, not running any tests.", 1);
                            }
                        } else {
                            console.log("mocha and chai libs downloaded, but either of both not available. Cannot run tests", 1);
                        }

                        /* End Loader Callback Tag Sending Code */
                    };

                    /* End Loader Callback Function */


                    /* Start Loader Function Call */
                    /* Un-comment the single-line JavaScript comments ("//") to use Loader. */

                    if (!u.initialized) {
                        //u.loader({"type" : "iframe", "src" : u.data.base_url + c.join(u.data.qsp_delim), "cb" : u.loader_cb, "loc" : "body", "id" : 'utag_##UTID##' });
                        // u.loader({"type" : "script", "src" : u.data.base_url_moca, "cb" : u.loader_cb, "loc" : "script", "id" : 'utag_##UTID##' });
                        var chaiJSFile = "https://unpkg.com/chai@4.2.0/chai.js",
                            mochaJSFile = "https://unpkg.com/mocha@8.2.1/mocha.js";

                        // prevent loading the libs again and again on every Event Hit (virtual pageviews need reloading everything however, because React clears out window
                        if (!TMSHelper.mochaChaiServed) {
                            // Config Vars
                            console.log("Loading mocha + chai libs, get your cup ready!");
                            u.loader({
                                "type": "script",
                                "src": chaiJSFile,
                                "cb": function () {
                                    console.log("chai loaded, now loading mocha");
                                    u.loader({
                                        "type": "script",
                                        "src": mochaJSFile,
                                        "cb": u.loader_cb,
                                        "loc": "script",
                                        "id": 'utag_##UTID##_2'
                                    });
                                },
                                "loc": "script",
                                "id": 'utag_##UTID##'
                            });
                        } else {
                            // refresh mocha cache to allow multiple runs on same page
                            mocha.unloadFiles();
                            u.loader_cb();
                        }
                    } else {
                        u.loader_cb();
                    }
          //u.loader({"type" : "img", "src" : u.data.base_url + c.join(u.data.qsp_delim) });

        /* End Loader Function Call */


        //##UTENABLEDEBUG##utag.DB("send:##UTID##:COMPLETE");
      }
    };
    utag.o[loader].loader.LOAD(id);
  })("##UTID##", "##UTLOADERID##");
} catch (error) {
  utag.DB(error);
}
//end tealium universal tag