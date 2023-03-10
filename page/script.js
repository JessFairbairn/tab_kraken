import "../external/browser-polyfill.min.js"
import StringCounter from "../js_utils/StringCounter.js"
import { timeDifferenceString } from "../js_utils/timeDifferenceString.js";
import delayPromise from "../js_utils/delayPromise.js";

const DOMAIN_LIST_ELEMENT = document.getElementById("domain-list");
const DUPLICATE_LIST_ELEMENT = document.getElementById("duplicate-list");

browser.tabs.query({}).then(async tabList => {
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
    console.log("clearing duplicate list")
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
        console.log("appending duplicate list")
    }
}

function loadDomainList(tabList) {
    const domainSet = countDomainNumbersInTabList(tabList);
    console.log(domainSet.getAll());
    DOMAIN_LIST_ELEMENT.innerHTML  = '';

    for (const [domain, count] of Object.entries(domainSet.getAll())) {

        let li = document.createElement("li");
        li.className = "flex-bar"
        li.innerText = `${domain}: ${count}`;
        let button = document.createElement("button");
        button.innerText = '✖';
        button.onclick = () => closeAllTabsInDomain(domain);
        li.appendChild(button);
        DOMAIN_LIST_ELEMENT.append(li);
    }
}

function countDomainNumbersInTabList(urlList) {
    
    let domainCounts = new StringCounter();
    for (let tab of urlList) {
        if (tab.url.startsWith("about:")) {
            domainCounts.add("about:");
        } 
        else if (tab.url.startsWith("moz-extension://")) {
            domainCounts.add("Extensions")
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
}

async function closeAllTabsInDomain(domain) {
    
    let tabs = await browser.tabs.query({url: `*://${domain}/*`, pinned: false, hidden: false});
    let tabIds = tabs.map(tab => tab.id);
    await browser.tabs.remove(tabIds);
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
    li.innerText = `Last accessed ${timeString} ${tab.pinned ? '📌' : ''}`;
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