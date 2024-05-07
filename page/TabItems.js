
import { timeDifferenceString } from "../js_utils/timeDifferenceString.js";

export async function loadTemplates() {
    const TEMPLATES = document.createElement("div");
    const template_file = await fetch( '/page/templates.html' );
    TEMPLATES.innerHTML = await template_file.text();
    document.body.append(TEMPLATES);
}

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
            tabItem.classList.add("flex-bar");
            tabUl.appendChild(tabItem);

            this.tabMap[tab.id] = tabItem;
        }

        this.shadowRoot.querySelector("#closeAllButton").onclick = closeFunction;
        this.shadowRoot.querySelector("#collapseButton").onclick = this.toggleCollapse;

        this.collapseList = collapseList;
        if (this.collapseList) {
            shadowRoot.getElementById("tab-list").classList.add("collapsed");
            shadowRoot.querySelector("#collapseButton img")
            .setAttribute("src", "../icons/chevron-down.svg");
        }
        shadowRoot.getElementById("collapseButton")
                .setAttribute("aria-expanded", String(!this.collapseList));

    }

    toggleCollapse() {
        let shadowRoot = this.getRootNode();
        shadowRoot.host.collapseList = !shadowRoot.host.collapseList;
        if (shadowRoot.host.collapseList) {
            shadowRoot.getElementById("tab-list").classList.add("collapsed");
            shadowRoot.querySelector("#collapseButton img")
                .setAttribute("src", "../icons/chevron-down.svg");
            shadowRoot.getElementById("collapseButton")
                .setAttribute("aria-expanded", "false");
        } else {
            shadowRoot.getElementById("tab-list").classList.remove("collapsed");
            shadowRoot.querySelector("#collapseButton img")
                .setAttribute("src", "../icons/chevron-up.svg");
            shadowRoot.getElementById("collapseButton")
                .setAttribute("aria-expanded", "true");
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
        this.tab = tab;
        this.displayTabLabel = displayTabLabel;
    }

    connectedCallback() {

        let template = document.getElementById("tab-item-template");
        let templateContent = template.content;

        // const shadowRoot = this.attachShadow({ mode: "open" });
        const containerNode = (templateContent.cloneNode(true));


        if (!this.tab) {
            return;
        }
        this.id = `tab-${this.tab.id}`

        let title;
        if (this.tab.title && this.tab.title !== "Server Not Found") {
            title = this.tab.title;
        } else {
            title = this.tab.url;
        }
        title = title.slice(0,50);
        let slotNode = containerNode.querySelector("slot")
        slotNode.append(this.displayTabLabel ? title + ' ' : '');
        
        let description = "";
        if (!this.tab.discarded) {
            description = `Last accessed ${timeDifferenceString(this.tab.lastAccessed)}`;
        } 
        else {
            description = "Inactive"
        }
        containerNode.querySelector("slot[name=description]").append(description);
        
        if (this.tab.pinned) {
            let pinSpan = document.createElement("span");
            pinSpan.classList.add("emoji")
            pinSpan.innerText = "📌";
            containerNode.querySelector(".indicator-wrapper").append(pinSpan);
        }

        if (this.tab.hidden) {
            let hiddenImage = document.createElement("img")
            hiddenImage.src = "../icons/eye-no-icon-original.svg"
            containerNode.querySelector(".indicator-wrapper").append(hiddenImage);
        }

        let button = containerNode.querySelector("button");

        button.onclick = async event => {
            event.stopPropagation();
            await closeTabById(this.tab.id);
            this.remove();
        }
        this.title = this.tab.url;
        if (!this.tab.hidden) {
            // let labelWrapper = containerNode.querySelector(".label-wrapper");
            this.classList.add("clickable");
            this.onclick = async () => {
                await browser.tabs.update(this.tab.id, {active: true});
            }
        }

        this.append(containerNode);
    }

}

customElements.define('tab-item-list', TabItemList);
customElements.define('tab-item', TabItem, {extends: 'li'});


async function closeTabById(id) {
    await browser.tabs.remove(id);
}