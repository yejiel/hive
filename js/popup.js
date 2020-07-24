import AppManager from "./appManager.js";
//data layer
let appManager;


async function _init() {

    appManager = new AppManager();
    await appManager.initAsync();
    _initEvents();
}

window.addEventListener("DOMContentLoaded", async () => {
    await _init();
});

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

