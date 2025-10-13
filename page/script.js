import "../external/browser-polyfill.min.js"
import StringCounter from "../js_utils/StringCounter.js"
import { loadTemplates, TabItemList } from "./TabItems.js";

const DOMAIN_LIST_ELEMENT = document.getElementById("domain-list");
const DUPLICATE_LIST_ELEMENT = document.getElementById("duplicate-list");

const TAB_KRAKEN_UUID = (new URL(document.URL)).hostname;
await loadTemplates();
browser.tabs.query({}).then(async tabList => {

    await loadDomainList(tabList);
    await loadDuplicateTabList(tabList);
});

let tabLists = [];

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url?.startsWith(`moz-extension://${TAB_KRAKEN_UUID}`)) {
        return;
    }
    let changedProperties = Object.getOwnPropertyNames(changeInfo);
    if (changedProperties.length === 1 && changedProperties[0] === "title") 
        {
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
    if (!DUPLICATE_LIST_ELEMENT) {
        return;
    }
    DUPLICATE_LIST_ELEMENT.replaceChildren();
    console.debug("clearing duplicate list")
    const siteSet = countSiteNumbersInTabList(fullTabList);
    const duplicateTabList = Object.entries(siteSet.getResultsWithMin(2));
    for (const [key, _] of duplicateTabList) {

        let tabs = fullTabList.filter(tab => tab.url === key);
        
        let tabListElement = new TabItemList(
            tabs, 
            async (includeHidden = false) => await closeAllTabsWithUrl(key, includeHidden), 
            false
        );
        tabListElement.innerText = key;

        DUPLICATE_LIST_ELEMENT.append(tabListElement);
        console.debug("appending duplicate list")

        tabLists.push(tabListElement);
    }
}

async function loadDomainList(tabList) {
    if(!DOMAIN_LIST_ELEMENT) {
        return;
    }
    const generator = await countDomainNumbersInTabList(tabList);

    DOMAIN_LIST_ELEMENT.replaceChildren();


    for await (const [domain, domainTabList] of generator) {
        if (!domain) {
            continue;
        }
        

        let tabListElement = new TabItemList(
            domainTabList, 
            (includeHidden=false) => closeAllTabsInDomain(domain, includeHidden), 
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

async function* countDomainNumbersInTabList(urlList) {

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
            domainTabLists["about"].push(tab);
        }
        else if (tab.url.startsWith("moz-extension://" + TAB_KRAKEN_UUID)) {
            domainCounts.add("Tab Kraken");
            domainTabLists["Tab Kraken"].push(tab);
        }
        else if (tab.url.startsWith("moz-extension://")) {
            
            let url = new URL(tab.url);
            let addOnId = url.hostname;
            // if (extension_list.indexOf(url.hostname) === -1) {
            //     extension_list.push(url.hostname)
            // }

            let foundAddOn = (await browser.management.getAll()).filter(addon => 
                addon.id === addOnId || addon.optionsUrl?.includes(addOnId)
            )[0]

            // domainCounts.add(`Extension ${}`)
            if (foundAddOn) {
                domainCounts.add(foundAddOn.name);
                if (!domainTabLists[foundAddOn.name]) {
                    domainTabLists[foundAddOn.name] = [];
                }
                domainTabLists[foundAddOn.name].push(tab);
            } else {
                domainCounts.add('Extensions');
                domainTabLists["Extensions"].push(tab);
            }
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

async function closeAllTabsInDomain(domain, includeHidden=false) {
    
    const queryParams = { url: `*://${domain}/*`, pinned: false };
    if (!includeHidden) {
        queryParams["hidden"] = false;
    }
    let tabs = await browser.tabs.query(queryParams);
    let tabIds = tabs.map(tab => tab.id);
    await browser.tabs.remove(tabIds);
    await reloadAll();
}

async function closeAllTabsWithUrl(url, includeHidden=false) {
    
    const queryParams = { url: url, pinned: false };
    if (!includeHidden) {
        queryParams["hidden"] = false;
    }
    let tabs = await browser.tabs.query(queryParams);
    let tabIds = tabs.map(tab => tab.id);
    await browser.tabs.remove(tabIds);
}

async function reloadAll() {
    tabLists = [];
    let fullTabList = await browser.tabs.query({});
    await loadDomainList(fullTabList);
    await loadDuplicateTabList(fullTabList);
}
