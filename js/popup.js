import AppManager from "./appManager.js";
//data layer
let appManager;
let groupsMap = {};
let displayNameSet = new Set();
//dom elements
let aliases;
let groupsSideBar;
//etc
let groupContextMenu;
let itemContextMenu;
let contextMenuTarget;
let menus;

async function _init() {

    appManager = new AppManager();
    await appManager.initAsync();
    _initEvents();
}

window.addEventListener("DOMContentLoaded", async () => {
    await _init();
});

const swalAlert = Swal.mixin({
  customClass: {
    confirmButton: "button success",
    cancelButton: "button danger",
  },
  buttonsStyling: false,
});

function remove(alias) {
  swalAlert
    .fire({
      title: "Are you sure?",
      text: `Delete '${alias}' ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
      reverseButtons: true,
    })
    .then((result) => {
      if (result.value) {
        chrome.storage.sync.remove(alias, function () {
          $(`[id='${alias}']`).remove();
        });
        Swal.fire("Success!", `'${alias}' was deleted successfully`, "success");
      } else if (
        /* Read more about handling dismissals below */
        result.dismiss === Swal.DismissReason.cancel
      ) {
      }
    });
}
function _removeItemFromGroupsMap(group, displayName) {
  const index = groupsMap[group].findIndex(
    (item) => item.displayName === displayName
  );
  if (index > -1) {
    groupsMap[group].splice(index, 1);
  }
}
function _storeDataAsync(data) { // todo done
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(data, () => {
      if (chrome.runtime.lastError) {
        reject();
      } else {
        resolve();
      }
    });
  });
}

function _initDomReferences() {
  aliases = document.querySelector("#aliases");
  groupsSideBar = document.querySelector("#rightSideBar");
}

function _initEvents() {
  document
    .querySelector("#export")
    .addEventListener("click", async () => await appManager.exportAsync());

  document
    .querySelector("#selectFiles")
    .addEventListener("change", async () => await appManager.importAsync());

  document
    .querySelector("#clear")
    .addEventListener("click", async () => await appManager.clearAllItemsAsync());

  document
    .querySelector(".addSiteBtn")
    .addEventListener("click", async () => await appManager.addItemAsync());

  document
    .querySelector(".addGroupBtn")
    .addEventListener("click", () => appManager.addNewGroup());

  //allow dragging
  document.addEventListener("dragover", function (event) {
    event.preventDefault();
  });
}

function _clearActiveGroupItems() {
  //const activeGroupName = _getActiveGroupName();


}

//clear();

