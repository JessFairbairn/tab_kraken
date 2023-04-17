
import { timeDifferenceString } from "../js_utils/timeDifferenceString.js";

export class TabItemList extends HTMLElement {
    constructor(tabList) {
        super();
        let template = document.getElementById("tab-item-list-template");
        let templateContent = template.content;
        this.className = "cool-list"

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
            tabUl.appendChild(new TabItem(tab));
        }
    }
}

export class TabItem extends HTMLLIElement {
    
    constructor(tab) {
        super();
        let template = document.getElementById("tab-item-template");
        // let templateContent = template.content;
        // const shadowRoot = this.attachShadow({ mode: "open" });
        // shadowRoot.appendChild(templateContent.cloneNode(true));
        if (!tab) {
            return;
        }
        let timeString = timeDifferenceString(tab.lastAccessed);

        
        this.classList.add("tab-item", "flex-bar");
        this.id = `tab-${tab.id}`
        this.innerText = `Last accessed ${timeString} ${tab.pinned ? '📌' : ''}`;
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