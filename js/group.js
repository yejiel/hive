
import Item from './item.js';
import CONSTS from './consts.js';
import ContextMenu from "./contextMenu.js";


class Group {

    #name;
    #displayNameToItemMap;
    #contextMenu;
    #domElemRef;
    #appManagerRef;

    constructor(groupName, appManagerRef) {

        this.#appManagerRef = appManagerRef;
        if(!appManagerRef) {
            throw new Error('groupsManager@ctor: appManagerRef was not supplied');
        }
        this.#name = groupName;
        this.#displayNameToItemMap = {};
        this.#contextMenu = this.#initContextMenu();
        this.#drawGroupButton();

    }

    get name() {
        return this.#name;
    }

    getDisplayNamesArr() {

        return Object.keys(this.#displayNameToItemMap);
    }
    addItem(itemObj, appManagerRef) {

        if(itemObj.displayName.includes('_dummy_')) {
            return;
        }
        const displayName = itemObj.displayName;
        let item = null;
        if(!this.#displayNameToItemMap[displayName]) {

            item = new Item(itemObj, appManagerRef);
            this.#displayNameToItemMap[displayName] = item
        }else{
            throw new Error(`groupsManager@addItem: displayName: ${displayName} already exists in group: ${this.#name}`)
        }
        if(this.#isSelected()) {
            item.draw();
        }
    }

    removeItem(displayName) {

        if(this.#displayNameToItemMap[displayName]) {

            delete this.#displayNameToItemMap[displayName];
        }else{
            throw new Error(`groupsManager@removeItem: displayName: ${JSON.stringify(displayName)} doesn't exist in group: ${this.#name}`)
        }
    }

    select() {

        this.#renderGroupSelectedStyle(event);
        CONSTS.DOM_ELEMENTS.ITEMS_SECTION.innerHTML = "";

        for( let displayName in this.#displayNameToItemMap) {

            const item = this.#displayNameToItemMap[displayName];
            item.draw();
        }
    }

    getItem(itemName) {

        return this.#displayNameToItemMap[itemName];
    }
    #drawGroupButton = () => {

        const elemToAdd = document.createElement("div");
        elemToAdd.classList.add("sideBarItem");
        elemToAdd.innerText = this.#name;

        //elemToAdd.id = groupName.replace(/ /g, "_").replace(/()/g "Xx");
        elemToAdd.setAttribute("groupName", this.#name);
        elemToAdd.addEventListener("click", () => this.select());
        elemToAdd.addEventListener(
            "contextmenu",
            (e) => this.#contextMenu.openContextMenu(e),
            false
        );
        elemToAdd.addEventListener("dragover", (e) => console.log("over"));
        elemToAdd.addEventListener("dragleave", (e) => console.log("leave"));
        elemToAdd.addEventListener("drop", async (e) => {

            e.preventDefault();
            //debugger;
            if (e.target.className === "sideBarItem") { // move dragged item to this group
                const itemObjToMoveToNewGroup = JSON.parse(e.dataTransfer.getData("text"));
                //_handleItemTransferAsync(draggedItem, groupName);
                const item = this.#appManagerRef.getItem(itemObjToMoveToNewGroup.group,itemObjToMoveToNewGroup.displayName);
                await item.moveToNewGroupAsync(this.#name);
            }
        });
        this.#domElemRef = elemToAdd;
        CONSTS.DOM_ELEMENTS.GROUPS_SECTION.insertBefore(elemToAdd, document.querySelector(".addGroupBtn"));
    };

    #initContextMenu = () => {

        return new ContextMenu({
            theme: "default", // or 'blue'

            items: [
                {
                    icon: "import",
                    name: "Import to group",
                    action: () => console.log("jQuery"),
                },

                {
                    icon: "export",
                    name: "Export group",
                    action: async () => this.#appManagerRef.exportAsync([this.#name])
                },

                {icon: "trash", name: "Delete group", action: async () => this.#appManagerRef.removeGroupAsync(this.#name)},
            ],
        }, this.#appManagerRef);
    };

    #renderGroupSelectedStyle = () => {
        document
            .querySelectorAll(".sideBarItem")
            .forEach((item) => item.classList.remove("active"));
        this.#domElemRef.classList.add("active");
    };

    #isSelected = () => {

        return this.#domElemRef.classList.contains('active');
    }

}

export default Group;