
import { timeDifferenceString } from "../js_utils/timeDifferenceString.js";

export class TabItemList extends HTMLElement {
    constructor(tabList, closeFunction, displayTabLabel = false) {
        super();
        let template = document.getElementById("tab-item-list-template");
        let templateContent = template.content;
        // this.className = "cool-list"

        // let url_li = document.createElement("li");
        // let div = document.createElement("div");
        // div.className = "flex-bar";
        // // div.innerText = `${key}: ${count}`;
        // url_li.appendChild(div)

        // let button = document.createElement("button");
        // button.innerText = '✖';
        // button.onclick = async () => await closeAllTabsWithUrl(key);
        // div.appendChild(button);
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(templateContent.cloneNode(true));
        if (!tabList) {
            return;
        }

        this.shadowRoot
          .querySelector("slot[name='number']")
          .append(tabList.length);
        
        const tabUl = shadowRoot.getElementById("tab-list");
        for (let tab of tabList) {
            tabUl.appendChild(new TabItem(tab, displayTabLabel));
        }

        this.shadowRoot.querySelector("#closeAllButton").onclick = closeFunction;
    }
}

export class TabItem extends HTMLLIElement {
    
    constructor(tab, displayTabLabel = false) {
        super();
        let template = document.getElementById("tab-item-template");
        // let templateContent = template.content;
        // const shadowRoot = this.attachShadow({ mode: "open" });
        // shadowRoot.appendChild(templateContent.cloneNode(true));

        let tabMap = new WeakMap();

        if (!tab) {
            return;
        }
        let timeString = timeDifferenceString(tab.lastAccessed);

        
        this.classList.add("tab-item", "flex-bar");
        this.id = `tab-${tab.id}`

        let title = tab.title !== "Server Not Found" ? tab.title : tab.url
        let tabLabel = displayTabLabel ? title + ' ' : '';
        let description = `Last accessed ${timeString} ${tab.pinned ? '<span class="emoji">📌</span>' : ''}${tab.hidden ? '<img src="../icons/eye-no-icon-original.svg"></img>' : ''}`;
        this.innerText = tabLabel + description;

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