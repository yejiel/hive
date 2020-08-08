import CONSTS from './consts.js';
import ContextMenu from "./contextMenu.js";
import StorageManager from './storageManager.js';


class Item {

    #displayName;
    #url;
    #alias;
    #groupName;
    #group;
    #favIconUrl;
    #contextMenu;
    #appManagerRef;

    constructor(itemObj, appManagerRef) {

        this.#appManagerRef = appManagerRef;
        const {displayName, url, alias, group, favIconUrl} = itemObj;
        this.#displayName = displayName;
        this.#url = url;
        this.#alias = alias;
        this.#groupName = group;
        this.#favIconUrl = favIconUrl;
        this.#contextMenu = this.#initContextMenu();

    }


    get displayName() {
        return this.#displayName;
    }
    get url() {
        return this.#url;
    }
    get alias() {
        return this.#alias;
    }
    get groupName() { return this.#groupName};

    generateItemObj()  {
        return {
            displayName: this.#displayName,
            url: this.#url,
            group: this.#groupName,
            alias: this.#alias,
            favIconUrl: this.#favIconUrl
        }
    }
    draw() {

        const divElemToAdd = document.createElement("div");
        divElemToAdd.classList.add("card");
        divElemToAdd.setAttribute("displayName", this.#displayName);
        divElemToAdd.setAttribute("group", this.#group);
        divElemToAdd.setAttribute("draggable", true);
        divElemToAdd.addEventListener(
            "contextmenu",
            (e) => this.#contextMenu.openContextMenu(e),
            false
        );
        divElemToAdd.innerHTML = `<div class="detailsSection"><h4>${this.#displayName}</h4><span>${this.#alias? `<h4 style="margin-right: 3px;">Alias:</h4>${this.#alias}`: ""}</span></div>`;
        const img = new Image();
        img.src = this.#favIconUrl;
        img.loading = 'lazy';
        divElemToAdd.prepend(img);
        setTimeout
        (
            function()
            {
                if ( !img.complete || !img.naturalWidth)
                {
                    img.src = "../img/default_favicon.jpg";
                }
            },
            200
        );
        divElemToAdd.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", JSON.stringify(this.generateItemObj())); // add draggedItem to event
            event.target.style.opacity = 0.5;
        });
        divElemToAdd.addEventListener("click", () => {
            chrome.tabs.create({url:this.#url}, ()=>{})
        });
        divElemToAdd.addEventListener("dragend", (e) => {
            e.dataTransfer.setData("text/plain", JSON.stringify(this.generateItemObj())); // add draggedItem to event
            event.target.style.opacity = 1;
        });

        CONSTS.DOM_ELEMENTS.ITEMS_SECTION.appendChild(divElemToAdd);
    }

    async moveToNewGroupAsync(newGroupName) {

        debugger;
        // remove from old group
        const oldGroup = this.#appManagerRef.getGroup(this.#groupName);
        oldGroup.removeItem(this.#displayName);
        // generate new itemObj
        this.#groupName = newGroupName;
        const newItemObj = this.generateItemObj();
        // add to new group
        const newGroup = this.#appManagerRef.getGroup(newGroupName);
        newGroup.addItem(newItemObj, this.#appManagerRef);

        await StorageManager.upsertItemAsync(newItemObj);
        oldGroup.select();
    }

    #initContextMenu = () => {

        return new ContextMenu(
            {
                theme: "default", // or 'blue'
                items: [
                    {
                        icon: "trash",
                        name: "Delete item",
                        action: async () =>
                            await this.#appManagerRef.removeItemAsync(this.#displayName, this.#groupName)
                        ,
                    },

                    {
                        icon: "edit",
                        name: "Edit item",
                        action: async () => await this.#appManagerRef.editItemAsync(this)
                    },
                ],
            }, this.#appManagerRef);
    };





}

export default Item;