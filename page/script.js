import "../external/browser-polyfill.min.js"
import StringCounter from "../js_utils/StringCounter.js"
import { loadTemplates, TabItemList } from "./TabItems.js";

const DOMAIN_LIST_ELEMENT = document.getElementById("domain-list");
const DUPLICATE_LIST_ELEMENT = document.getElementById("duplicate-list");

const TAB_KRAKEN_UUID = (new URL(document.URL)).hostname;
await loadTemplates();
browser.tabs.query({}).then(async tabList => {

    loadDomainList(tabList);
    await loadDuplicateTabList(tabList);
});

let tabLists = [];

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    let changedProperties = Object.getOwnPropertyNames(changeInfo);
    if (changedProperties.length === 1 && changedProperties[0] === "title"){
        return;
    }
    reloadAll();
});

browser.tabs.onCreated.addListener(reloadAll);
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
    // delayPromise(100).then(reloadAll);
    tabLists.forEach(element => {
        element.tabClosedAction(tabId);
    });
});


async function loadDuplicateTabList(fullTabList) {
    DUPLICATE_LIST_ELEMENT.innerHTML  = '';
    console.debug("clearing duplicate list")
    const siteSet = countSiteNumbersInTabList(fullTabList);
    const duplicateTabList = Object.entries(siteSet.getResultsWithMin(2));
    for (const [key, _] of duplicateTabList) {

        let tabs = fullTabList.filter(tab => tab.url === key);
        
        let tabListElement = new TabItemList(
            tabs, 
            async () => await closeAllTabsWithUrl(key), 
            false
        );
        tabListElement.innerText = key;

        DUPLICATE_LIST_ELEMENT.append(tabListElement);
        console.debug("appending duplicate list")

        tabLists.push(tabListElement);
    }
}

function loadDomainList(tabList) {
    const generator = countDomainNumbersInTabList(tabList);

    DOMAIN_LIST_ELEMENT.innerHTML  = '';


    for (const [domain, domainTabList] of generator) {
        if (!domain) {
            continue;
        }
        

        let tabListElement = new TabItemList(
            domainTabList, 
            () => closeAllTabsInDomain(domain), 
            true,
            true
        );
        if (domain === "moz-extension://" + TAB_KRAKEN_UUID){
            tabListElement.innerText = "Tab Kraken"
        } else {
            tabListElement.innerText = domain;
        }
        DOMAIN_LIST_ELEMENT.append(tabListElement);
        tabLists.push(tabListElement);
    }
}

function* countDomainNumbersInTabList(urlList) {

    let extension_list = []
    
    let domainCounts = new StringCounter();
    let domainTabLists = {
        "about": [],
        "Extensions": [],
        "Tab Kraken": []
    };

    for (let tab of urlList) {
        if (tab.url.startsWith("about:")) {
            domainCounts.add("about");
            domainTabLists["about"].push(tab)
        }
        else if (tab.url.startsWith("moz-extension://" + TAB_KRAKEN_UUID)) {
            domainCounts.add("Tab Kraken");
            domainTabLists["Tab Kraken"].push(tab)
        }
        else if (tab.url.startsWith("moz-extension://")) {
            
            // let url = new URL(tab.url);
            // if (extension_list.indexOf(url.hostname) === -1) {
            //     extension_list.push(url.hostname)
            // }

            // domainCounts.add(`Extension ${}`)
            domainCounts.add('Extensions');
            domainTabLists["Extensions"].push(tab)
        }
        else {
            let url = new URL(tab.url);
            domainCounts.add(url.hostname);
            if (domainTabLists[url.hostname]) {
                domainTabLists[url.hostname].push(tab);
            } else {
                domainTabLists[url.hostname] = [tab];
            }
        }
        
    }

    let orderedItems = domainCounts.getAllOrdered()
    for (const [domain, _] of orderedItems) {
        yield [domain, domainTabLists[domain]];
    }
}

function countSiteNumbersInTabList(urlList) {
    
    let siteCounts = new StringCounter();
    for (let tab of urlList) {        
        siteCounts.add(tab.url);
    }
    return siteCounts;
}

async function closeAllTabsInDomain(domain) {
    
    let tabs = await browser.tabs.query({url: `*://${domain}/*`, pinned: false, hidden: false});
    let tabIds = tabs.map(tab => tab.id);
    await browser.tabs.remove(tabIds);
    await reloadAll();
}

async function closeAllTabsWithUrl(url) {
    
    let tabs = await browser.tabs.query({url: url, pinned: false, hidden: false});
    let tabIds = tabs.map(tab => tab.id);
    await browser.tabs.remove(tabIds);
}

async function reloadAll() {
    let fullTabList = await browser.tabs.query({});
    loadDomainList(fullTabList);
    await loadDuplicateTabList(fullTabList);
}
