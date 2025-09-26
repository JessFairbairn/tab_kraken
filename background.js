// import "webextension-polyfill";
console.debug("Start of background.js")
/*
On click, fetch stored settings and forget browsing data.
*/
browser.browserAction.onClicked.addListener(() => {
    console.debug("opening window?")
    browser.tabs.create({
        // active: true,
        url: "page/domains.html"
    }).then(value => {
        console.log(value)
    });
});