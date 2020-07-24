
import StorageManager from './storageManager.js';
import Group from './group.js';
import CONSTS from './consts.js';
import ContextMenu from "./contextMenu.js";

class AppManager {

    #groupsMap;
    #displayNameSet;
    #aliasSet = new Set(); // consider
    #openedContextMenuRef = null;
    #fileReader = new FileReader();
    #optionsBtnDomRef = document.querySelector('#optionsBtn');

    constructor() {}

    get openedContextMenuRef() {

        return this.#openedContextMenuRef;
    }

    set openedContextMenuRef(contextMenuRef) {
        this.#openedContextMenuRef = contextMenuRef;
    }

    async removeGroupAsync(groupName) {

        if(this.#groupsMap === 'General') {
            return;
        }
        const groupInstance = this.#groupsMap[groupName];
        const itemsArrToRemoveFromStorage = groupInstance.getDisplayNamesArr();

        itemsArrToRemoveFromStorage.forEach(async displayName => {
            await StorageManager.deleteItemAsync(displayName, groupName);
        });
        await StorageManager.deleteItemAsync(`_${groupName}_dummy_`, groupName);

        delete this.#groupsMap[groupName];
        await this.initAsync();
    }

    async importAsync() {

        debugger;
        const groupsMap = this.#groupsMap;
        const displayNameSet = this.#displayNameSet;
        const files = CONSTS.DOM_ELEMENTS.SELECT_FILES.files;
        const that = this;
        let extraMsg = "";

        function _getNewGroupNameAux(originalGroupName, set, map) {

            let res = null;

            if (map[originalGroupName]) {
                res = map[originalGroupName];
            } else {
                let counter = 1;
                let temp = originalGroupName;
                while (groupsMap.hasOwnProperty(temp)) {
                    temp = `${originalGroupName} (${counter++})`;
                }
                set.add(temp);
                map[originalGroupName] = temp;
                res = temp;
            }

            return res;
        }

        try {

            if (files.length <= 0) {

                return false;
            }

            this.#fileReader.onload = async function (e) {

                try {

                    let newData = await StorageManager.getAllItemsAsync();
                    const importedData = JSON.parse(e.target.result);
                    const newGroupNamesSet = new Set();
                    const nameConversionMap = {};

                    for (let displayName in importedData) {

                        const item = importedData[displayName];
                        let groupName = String(item.group).trim();

                        if (!displayNameSet.has(item.displayName)) {
                            // add unique displayName only
                            if (
                                groupsMap.hasOwnProperty(groupName) &&
                                !newGroupNamesSet.has(groupName)
                            ) { // imported groupName already exist -> get a new name
                                groupName = _getNewGroupNameAux(
                                    groupName,
                                    newGroupNamesSet,
                                    nameConversionMap
                                );
                                item.group = groupName;
                            }
                            newData[item.displayName] = item;
                            displayNameSet.add(item.displayName);
                        }else { // item couldn't be added due to existing displayName

                            if(!extraMsg.includes('items')) {

                                extraMsg += `(notice that some items couldn't be imported due to existing displayName (must be unique))`
                            }
                        }
                    }
                    await StorageManager.setDataAsync(newData);
                    await that.initAsync();

                    Swal.fire("Success!", `Import process ended successfully ${extraMsg}`, "success");
                } catch (e) {
                    console.error(`@handleImportAsync: ${e.message}`);
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text:
                            "Something went wrong! Please make sure to load an '.smd' file and try again",
                    });
                }
            };

            this.#fileReader.readAsText(files.item(0));
        } catch (e) {}
    }

    async exportAsync (includedGroupsArr) {

        function removeUnwantedKeys(obj) {

            for (let displayName in obj) {
                if(!includedGroupsArr.includes(obj[displayName].group)) { // closure :)
                    obj[displayName] = undefined;
                }
            }
        }

        const d = new Date();
        let obj = await StorageManager.getAllItemsAsync();
        if(includedGroupsArr) {
            removeUnwantedKeys(obj);
        }

        this.#downloadObjectAsJson(
            obj,
            `Aliases Backup ${
            d.getUTCMonth() + 1
                }/${d.getUTCDate()}/${d.getUTCFullYear()}`
        );

    }

    async initAsync() { // todo also update async

        try {
            this.#initGroupSection(); // create 'newGroup' btn and its eventListener
            this.#initGroupsMap(); // create 'General' group
            this.#initDisplayNameSet();
            this.#initOptionsBtn();
            const allItems = await StorageManager.getAllItemsAsync();
            console.log(allItems);
            for(let displayName in allItems) {

                const item = allItems[displayName];
                const groupName = item.group;
                if(groupName) {
                    if (!this.isGroupExist(groupName)) { // new to groupsMap? first create entry
                        this.#groupsMap[groupName] = new Group(groupName, this);
                    }
                    this.#groupsMap[groupName].addItem(item, this);
                    this.#displayNameSet.add(displayName);
                }
            }
            this.#groupsMap['General'].select();
        }catch (e) {

            throw new Error(`GroupsManager@initAsync: failure (${e.message})`);
        }
    }

    async addItemAsync() {

        const groupsMap = this.#groupsMap;
        const displayNameSet = this.#displayNameSet;
        const addItemAsync = this.#addItemAsync;
        const appManagerRef = this;
        let title;
        let url;
        let favIconUrl;

        //async func
        chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {

            debugger;
            if (tabs[0] != null) {

                title = tabs[0].title;
                url = tabs[0].url;
                favIconUrl = tabs[0].favIconUrl;
            }

            Swal.fire({
                title: "<strong>ADD NEW SITE </strong>",
                icon: "info",
                html: `<div align="left">Display name: <input type="text" id="displayNameInput" class="swal2-input" name="displayName" value="${title}" required><br> 
                    Group: <select class="swal2-input"  id="groupSelect" name="fname">
                    ${(() => {
                    let t = "";
                    for (let opt in groupsMap) {
                        t += `<option value=${opt}>${opt}</option>`;
                    }
                    return t;
                })()}</select><br> 
                    Alias (optional): <input class="swal2-input"type="text" id="aliasInput" name="fname"><br></div>`,
                showCloseButton: true,
                showCancelButton: true,
                focusConfirm: true,
                confirmButtonText: "SAVE",
                cancelButtonText: "Cacel",
                preConfirm: () => {
                    let displayName = Swal.getPopup().querySelector("#displayNameInput")
                        .value;
                    if (!displayName) {
                        Swal.showValidationMessage(`Display name must be provided.`);
                    }
                    if (displayNameSet.has(displayName)) {
                        Swal.showValidationMessage(
                            `DisplayName already exists. please choose another`
                        );
                    }
                },
            }).then(async (res) => {

                if (res && res.value) {

                    const groupSelectElem = document.querySelector("#groupSelect");
                    const group =
                        groupSelectElem.options[groupSelectElem.selectedIndex].value;
                    const displayName = document.querySelector("#displayNameInput").value;
                    const alias = document.querySelector("#aliasInput").value;
                    await addItemAsync({alias, url, displayName, group, favIconUrl}, appManagerRef);
                }
            });
        });
    }

    async clearAllItemsAsync() {

        try{
            Swal.mixin({ // todo export to SWAL static class (like storage manager). will be imported via this class only and not from popup.html
                customClass: {
                    confirmButton: "button success",
                    cancelButton: "button danger",
                },
                buttonsStyling: false,
            })
                .fire({
                    title: "Are you sure?",
                    text: "You're about do clear your alias list",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, delete it!",
                    cancelButtonText: "Cancel",
                    reverseButtons: true,
                })
                .then(async (result) => {
                    if (result.value) {
                        await StorageManager.clearAllItemsAsync();
                        Swal.fire("Success!", "Clear Succedded", "success");
                        this.#initGroupSection();
                        this.#initGroupsMap();
                        this.#initDisplayNameSet();
                        CONSTS.DOM_ELEMENTS.ITEMS_SECTION.innerHTML ='';
                    } else if (
                        /* Read more about handling dismissals below */
                        result.dismiss === Swal.DismissReason.cancel
                    ) {
                    }
                });

        }catch (e) {

        }
    }

    async removeItemAsync(displayName, groupName) {

        await StorageManager.deleteItemAsync(displayName);
        const group = this.#groupsMap[groupName];
        group.removeItem(displayName);
        group.select();

    }

    async editItemAsync(item) { // todo neater

        const oldGroup = item.groupName;
        const oldDisplayName = item.displayName;
        const oldAlias = item.alias;

        const res = await Swal.fire({
            title: "<strong>Edit </strong>",
            icon: "info",
            html: `<div align="left">Display name: <input type="text" id="displayNameInput" class="swal2-input" name="displayName" value="${oldDisplayName}" required><br> 
                  Group: <select class="swal2-input"  id="groupSelect" name="fname">
                  ${(() => {
                let t = "";
                for (let opt in this.#groupsMap) {
                    t += `<option value=${opt} ${
                        opt === oldGroup ? "selected" : ""
                        }>${opt}</option> `;
                }
                return t;
            })()}</select><br> 
                          Alias (optional): <input class="swal2-input"type="text" id="aliasInput" name="fname" value=${
                oldAlias ? oldAlias : ""
                } ><br></div>`,
            showCloseButton: true,
            showCancelButton: true,
            focusConfirm: true,
            confirmButtonText: "SAVE",
            cancelButtonText: "Cancel",
            preConfirm: () => {
                let displayNameFromInput = Swal.getPopup().querySelector(
                    "#displayNameInput"
                ).value;
                // let groupFromInput = Swal.getPopup().querySelector("#groupSelect").value;
                // let aliasFromInput = Swal.getPopup().querySelector("#aliasInput").value;
                if (!displayNameFromInput) {
                    Swal.showValidationMessage(`Display name must be provided.`);
                }
                if (
                    this.#displayNameSet.has(displayNameFromInput) &&
                    displayNameFromInput !== oldDisplayName
                ) {
                    Swal.showValidationMessage(
                        `DisplayName already exists. please choose another`
                    );
                }
            },
        });

        if (res && res.value) {

            const groupSelectElem = document.querySelector("#groupSelect");
            const newGroup =
                groupSelectElem.options[groupSelectElem.selectedIndex].value;
            const newDisplayName = document.querySelector("#displayNameInput").value;
            const newAlias = document.querySelector("#aliasInput").value;

            if(newGroup !== oldGroup) {
                await item.moveToNewGroupAsync(newGroup);
            }else {
                if (newDisplayName !== oldDisplayName) {
                    this.#displayNameSet.delete(oldDisplayName);
                }
                const itemObj = item.generateItemObj();
                itemObj.group = newGroup;
                itemObj.displayName = newDisplayName;
                itemObj.alias = newAlias;
                await this.removeItemAsync(item.displayName, item.groupName);
                await StorageManager.upsertItemAsync(itemObj);
                const oldGroupRef = this.getGroup(oldGroup);
                oldGroupRef.addItem(itemObj,this);
                oldGroupRef.select();
            }
            this.#displayNameSet.add(newDisplayName);

        }

    }

    getItem(groupName, displayName) {

        return this.getGroup(groupName).getItem(displayName);
    }

    getGroup(groupName) {

        return this.#groupsMap[groupName];
    }

    isGroupExist(groupName) {

        if(!groupName ) {
            return false;
        }
        return this.#groupsMap.hasOwnProperty(groupName.trim());
    }

    addNewGroup (){
        Swal.fire({
            title: "<strong>ADD GROUP </strong>",
            icon: "info",
            html: `Group name: <input type="text" class="swal2-input" id="groupName">`,
            showCloseButton: true,
            showCancelButton: true,
            focusConfirm: false,
            confirmButtonText: "Add group",
            cancelButtonText: "Cancel",
            preConfirm: () => {
                let groupName = String(Swal.getPopup().querySelector("#groupName").value);
                if (!groupName) {
                    Swal.showValidationMessage(`A group name must be provided.`);
                }
                if (this.isGroupExist(groupName)) {
                    Swal.showValidationMessage(
                        `Group name already exists. please choose another`
                    );
                }
            },
        }).then(async (res) => {
            if (res && res.value) {
                const groupName = String(
                    document.querySelector("#groupName").value
                ).trim();
                if (!this.isGroupExist()) {
                    const group = new Group(groupName, this);
                    this.#groupsMap[groupName] = group;

                    //group.drawGroupButton();
                    await StorageManager.upsertItemAsync({displayName:`_${groupName}_dummy_`, url: '_dummy_', alias: '_dummy_', group:groupName});
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: "Your group name is already taken. Please try another one",
                    });
                }
            }
        });

    }

    #initGroupSection = () => {

        CONSTS.DOM_ELEMENTS.GROUPS_SECTION.innerHTML = '<div class="addGroupBtn">newGroup</div>'; // cleans
        document
            .querySelector(".addGroupBtn")
            .addEventListener("click", () => this.addNewGroup());
    };

    #addItemAsync = async (item) => {
        // displayName must be unique (or un-expected behavior)
        const groupName = item.group;
        if(this.isGroupExist(groupName)) {
            this.#groupsMap[groupName].addItem(item, this);
        }else { // can't reach
            const groupInstance = new Group(groupName, this);
            groupInstance.addItem(item, this);
        }
        await StorageManager.upsertItemAsync(item);
        this.#displayNameSet.add(item.displayName);

    };

    #initGroupsMap = () => {

        this.#groupsMap = {General: new Group('General', this) };
    };

    #initOptionsBtn = () => {

        const contextMenu = new ContextMenu({
            theme: "blue", // or 'blue'

            items: [

                {
                    icon: "export",
                    name: "Export items",
                    action: async () => this.exportAsync()
                },
                {
                    icon: "import",
                    name: "import items",
                    action: async () => document.querySelector('#selectFiles').click()
                },

                {icon: "trash", name: "Clear all items", action: async () => this.clearAllItemsAsync()},

                {icon: "trash", name: "Preference", action: ()=>{}},

            ],
        }, this);

        this.#optionsBtnDomRef.addEventListener(
            "click",
            (e) => contextMenu.openContextMenu(e),
            false
        );
    };

    #initDisplayNameSet = () => {

        this.#displayNameSet = new Set();
    };

    #downloadObjectAsJson = (exportObj, exportName) => {
        const dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(exportObj));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", exportName + ".smd");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

}

export default AppManager;