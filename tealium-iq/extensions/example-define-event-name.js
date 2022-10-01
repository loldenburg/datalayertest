// Example Extension of how to define an event_name which is the used for unit tests in Tealium Functions and mochaChai tests.
// Your Event Name may be defined completely differently.
// Run this in an All Tags Extension of Scope "After Load Rules", at any time that makes sense in your setup.
let compCat, compSub;
try {
    // default: use component_category and component_subcategory
    compCat = b["component_category"][0];
    compSub = b["component_subcategory"][0];
} catch (e) {
}
// if compcat does not exist, use On-Site Search Type OR Page Type OR Pathname
compCat = compCat || b["oss_type"] || b["page_type"] || location.pathname;
compSub = compSub || b["oss_interaction"] || "na";
b["event_name"] = [b["ut.event"], compCat, compSub].join("__");

// TODO if this Extension is an "After Load Rules Extension" (which it probably should be in most cases), uncomment the
//  following line to re-evaluate load rules after this Extension has run (otherwise, your mocha tag will not fire if
//  you have not defined an event_name elsewhere)
// utag.handler.LR(b);