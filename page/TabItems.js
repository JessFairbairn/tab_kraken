
import { timeDifferenceString } from "../js_utils/timeDifferenceString.js";

export class TabItemList extends HTMLElement {

    constructor(tabList, closeFunction, displayTabLabel, collapseList = false) {
        super();
        let template = document.getElementById("tab-item-list-template");
        let templateContent = template.content;

        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(templateContent.cloneNode(true));
        if (!tabList) {
            return;
        }

        this.shadowRoot
          .querySelector("slot[name='number']")
          .append(tabList.length);
        
        this.tabMap = {};

        const tabUl = shadowRoot.getElementById("tab-list");
        for (let tab of tabList) {
            const tabItem = new TabItem(tab, displayTabLabel);
            tabUl.appendChild(tabItem);

            this.tabMap[tab.id] = tabItem;
        }

        this.shadowRoot.querySelector("#closeAllButton").onclick = closeFunction;
        this.shadowRoot.querySelector("#collapseButton").onclick = this.toggleCollapse;

        this.collapseList = collapseList;
        if (this.collapseList) {
            shadowRoot.getElementById("tab-list").classList.add("collapsed");
        }

    }

    toggleCollapse() {
        let shadowRoot = this.getRootNode();
        shadowRoot.host.collapseList = !shadowRoot.host.collapseList;
        if (shadowRoot.host.collapseList) {
            shadowRoot.getElementById("tab-list").classList.add("collapsed");
        } else {
            shadowRoot.getElementById("tab-list").classList.remove("collapsed");
        }
    }

    tabClosedAction(tabId) {
        let tabElement = this.tabMap[tabId];
        if (tabElement) {
            tabElement.remove();
            delete this.tabMap[tabId];
            this.shadowRoot
                .querySelector("slot[name='number']")
                .innerText = Object.keys(this.tabMap).length;
        }

        
    }
}

export class TabItem extends HTMLLIElement {
    
    constructor(tab, displayTabLabel = false) {
        super();
        let template = document.getElementById("tab-item-template");

        if (!tab) {
            return;
        }
        let timeString = timeDifferenceString(tab.lastAccessed);

        
        this.classList.add("tab-item", "flex-bar");
        this.id = `tab-${tab.id}`

        let title = tab.title !== "Server Not Found" ? tab.title : tab.url
        title = title.slice(0,50);
        this.innerText = displayTabLabel ? title + ' ' : '';
        
        let description = `Last accessed ${timeString} ${tab.pinned ? '<span class="emoji">📌</span>' : ''}${tab.hidden ? '<img src="../icons/eye-no-icon-original.svg"></img>' : ''}`;
        this.innerHTML = this.innerHTML + description;

        let button = document.createElement("button");
        button.innerText = '✖';
        button.onclick = async () => {
            await closeTabById(tab.id);
            this.remove();
        }
        this.appendChild(button);
    }
}

customElements.define('tab-item-list', TabItemList);
customElements.define('tab-item', TabItem, {extends: 'li'});


async function closeTabById(id) {
    await browser.tabs.remove(id);
}