import "../external/browser-polyfill.min.js"
import StringCounter from "../js_utils/StringCounter.js"

const DOMAIN_LIST_ELEMENT = document.getElementById("domain-list");
const DUPLICATE_LIST_ELEMENT = document.getElementById("duplicate-list");

browser.tabs.query({}).then(async tabList => {
    // console.table(tabList, ["url"])

    // let urls = tabList.map(tab => tab.url)
    // console.log(urls)
    loadDomainList(tabList);

    await loadDuplicateTabList(tabList);
});


async function loadDuplicateTabList(fullTabList) {
    DUPLICATE_LIST_ELEMENT.textContent  = '';
    const siteSet = countSiteNumbersInTabList(fullTabList);
    for (const [key, count] of Object.entries(siteSet.getResultsWithMin(2))) {

        let tabs = await getTabsWithUrlAsync(key);
        

        let url_li = document.createElement("li");
        url_li.innerText = `${key}: ${count}`;

        let inner_list = document.createElement("ul");
        for (let tab of tabs) {
            let li = new TabItem(tab);
            inner_list.appendChild(li);
        }
        url_li.appendChild(inner_list);

        DUPLICATE_LIST_ELEMENT.append(url_li);
    }
}

function loadDomainList(tabList) {
    const domainSet = countDomainNumbersInTabList(tabList);
    console.log(domainSet.getAll());
    DOMAIN_LIST_ELEMENT.textContent  = '';

    for (const [domain, count] of Object.entries(domainSet.getAll())) {

        let li = document.createElement("li");
        li.innerText = `${domain}: ${count}`;
        let button = document.createElement("button");
        button.innerText = '✖';
        button.onclick = () => closeAllTabsInDomain(domain);
        li.appendChild(button);
        DOMAIN_LIST_ELEMENT.append(li);
    }
}

function createListItemForTab(tab) {
    const timeDifference = Date.now() - tab.lastAccessed;
    let secondsDiff = timeDifference/60000
    let minutesDiff = secondsDiff/60;
    let hoursDiff = minutesDiff/60
    let daysDiff = hoursDiff/24;

    let timeString;
    if (daysDiff >= 1){
        timeString = `${Math.floor(daysDiff)} days ago`
    } else if (hoursDiff >= 1) {
        timeString = `${Math.floor(hoursDiff)} hours ago`
    } else if (minutesDiff >= 1) {
        timeString = `${Math.floor(minutesDiff)} minutes ago`
    } else {
        timeString = "just now"
    }

    let li = document.createElement("tab-item");
    li.className = "tab-item"
    li.id = `tab-${tab.id}`
    li.innerText = `Last accessed ${timeString} ${tab.pinned ? '📌' : ''}`;
    let button = document.createElement("button");
    button.innerText = '✖';
    button.onclick = () => closeTabById(tab.id);
    li.appendChild(button);
    return li;
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
    return await browser.tabs.query({url: url})
}

async function closeTabById(id) {
    await browser.tabs.remove(id);
    document.getElementById(`tab-${id}`).remove();
    let fullTabList = await browser.tabs.query({});
    await loadDuplicateTabList(fullTabList)
    return;
}

async function closeAllTabsInDomain(domain) {
    
    let tabs = await browser.tabs.query({url: `*://${domain}/*`, pinned: false, hidden: false});
    let tabIds = tabs.map(tab => tab.id);
    await browser.tabs.remove(tabIds);
    let fullTabList = await browser.tabs.query({});
    loadDomainList(fullTabList);
    return await loadDuplicateTabList(fullTabList);
        
}

class TabItem extends HTMLLIElement {
    

    constructor(tab) {
        super();
        let template = document.getElementById("tab-item");
        let templateContent = template.content;
        // const shadowRoot = this.attachShadow({ mode: "open" });
        // shadowRoot.appendChild(templateContent.cloneNode(true));
        if (!tab) {
            return 
        }
        const timeDifference = Date.now() - tab.lastAccessed;
        let secondsDiff = timeDifference/60000
        let minutesDiff = secondsDiff/60;
        let hoursDiff = minutesDiff/60
        let daysDiff = hoursDiff/24;

        let timeString;
        if (daysDiff >= 1){
            timeString = `${Math.floor(daysDiff)} days ago`
        } else if (hoursDiff >= 1) {
            timeString = `${Math.floor(hoursDiff)} hours ago`
        } else if (minutesDiff >= 1) {
            timeString = `${Math.floor(minutesDiff)} minutes ago`
        } else {
            timeString = "just now"
        }

        
        this.className = "tab-item"
        this.id = `tab-${tab.id}`
        this.innerText = `Last accessed ${timeString} ${tab.pinned ? '📌' : ''}`;
        let button = document.createElement("button");
        button.innerText = '✖';
        button.onclick = () => closeTabById(tab.id);
        this.appendChild(button);
    }
}
customElements.define('tab-item', TabItem, {extends: 'li'});