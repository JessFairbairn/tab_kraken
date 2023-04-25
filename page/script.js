import "../external/browser-polyfill.min.js"
import StringCounter from "../js_utils/StringCounter.js"
import { timeDifferenceString } from "../js_utils/timeDifferenceString.js";
import delayPromise from "../js_utils/delayPromise.js";
import { TabItem, TabItemList } from "./TabItems.js";

const DOMAIN_LIST_ELEMENT = document.getElementById("domain-list");
const DUPLICATE_LIST_ELEMENT = document.getElementById("duplicate-list");

const TAB_KRAKEN_UUID = (new URL(document.URL)).hostname;

browser.tabs.query({}).then(async tabList => {
    // let testList = new TabItemList(tabList, async () => closeAllTabsWithUrl("https://example.com/"), true);
    // testList.innerText = "Test list"
    // document.getElementById("test-box").append(testList)

    loadDomainList(tabList);
    await loadDuplicateTabList(tabList);
});

browser.tabs.onUpdated.addListener(reloadAll);
browser.tabs.onCreated.addListener(reloadAll);
browser.tabs.onRemoved.addListener(() => {
    delayPromise(100).then(reloadAll);
});


async function loadDuplicateTabList(fullTabList) {
    DUPLICATE_LIST_ELEMENT.innerHTML  = '';
    console.debug("clearing duplicate list")
    const siteSet = countSiteNumbersInTabList(fullTabList);
    const duplicateTabList = Object.entries(siteSet.getResultsWithMin(2));
    for (const [key, count] of duplicateTabList) {

        let tabs = fullTabList.filter(tab => tab.url === key);

        let url_li = document.createElement("li");
        let div = document.createElement("div");
        div.className = "flex-bar";
        div.innerText = `${key}: ${count}`;
        url_li.appendChild(div)

        let button = document.createElement("button");
        button.innerText = '✖';
        button.onclick = async () => await closeAllTabsWithUrl(key);
        div.appendChild(button);

        let inner_list = document.createElement("ul");
        for (let tab of tabs) {
            let li = createListItemForTab(tab);
            inner_list.appendChild(li);
        }
        url_li.appendChild(inner_list);

        DUPLICATE_LIST_ELEMENT.append(url_li);
        console.debug("appending duplicate list")
    }
}

function loadDomainList(tabList) {
    const domainSet = countDomainNumbersInTabList(tabList);
    console.table(domainSet.getAll());
    DOMAIN_LIST_ELEMENT.innerHTML  = '';

    let dict = domainSet.getAll();
    
    let items = Object.entries(dict);
    // Sort the array based on the second element
    items.sort(function(first, second) {
        return second[1] - first[1];
    });

    for (const [domain, count] of items) {

        // let li = document.createElement("li");
        // li.className = "flex-bar"
        // li.innerText = `${domain}: ${count}`;
        // let button = document.createElement("button");
        // button.innerText = '✖';
        // button.onclick = () => closeAllTabsInDomain(domain);
        // li.appendChild(button);
        // DOMAIN_LIST_ELEMENT.append(li);

        let domainTabs = tabList.filter(tab => tab.url.includes(domain))

        let tabListElement = new TabItemList(
            domainTabs, 
            () => closeAllTabsInDomain(domain), 
            true
        );
        if (domain === "moz-extension://" + TAB_KRAKEN_UUID){
            tabListElement.innerText = "Tab Kraken"
        } else {
            tabListElement.innerText = domain;
        }
        DOMAIN_LIST_ELEMENT.append(tabListElement);
    }
}

function countDomainNumbersInTabList(urlList) {

    let extension_list = []
    
    let domainCounts = new StringCounter();
    for (let tab of urlList) {
        if (tab.url.startsWith("about:")) {
            domainCounts.add("about:");
        }
        else if (tab.url.startsWith("moz-extension://" + TAB_KRAKEN_UUID)) {
            domainCounts.add("moz-extension://" + TAB_KRAKEN_UUID);
        }
        else if (tab.url.startsWith("moz-extension://")) {
            
            // let url = new URL(tab.url);
            // if (extension_list.indexOf(url.hostname) === -1) {
            //     extension_list.push(url.hostname)
            // }

            // domainCounts.add(`Extension ${}`)
            domainCounts.add('Extensions');
        }
        else {
            let url = new URL(tab.url);
            domainCounts.add(url.hostname);
        }
        
    }
    return domainCounts;
}

function countSiteNumbersInTabList(urlList) {
    
    let siteCounts = new StringCounter();
    for (let tab of urlList) {        
        siteCounts.add(tab.url);
    }
    return siteCounts;
}

async function getTabsWithUrlAsync(url) {
    debugger
    return await browser.tabs.query({url: url})
}

async function closeTabById(id) {
    await browser.tabs.remove(id);
    document.getElementById(`tab-${id}`).remove();
    await reloadAll();
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

function createListItemForTab(tab) {
    let timeString = timeDifferenceString(tab.lastAccessed);

    let li = document.createElement("li");
    li.className = "flex-bar";
    li.id = `tab-${tab.id}`;
    li.innerHTML = `Last accessed ${timeString} ${tab.pinned ? '<span class="emoji">📌</span>' : ''}${tab.hidden ? '<img src="../icons/eye-no-icon-original.svg"></img>' : ''}`;
    let button = document.createElement("button");
    button.innerText = '✖';
    button.onclick = () => closeTabById(tab.id);
    li.appendChild(button);
    return li;
}

async function reloadAll() {
    let fullTabList = await browser.tabs.query({});
    loadDomainList(fullTabList);
    await loadDuplicateTabList(fullTabList);
}
