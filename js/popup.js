import AppManager from "./appManager.js";
//data layer
let appManager;


async function _initApp() {

    appManager = new AppManager();
    await appManager.initAsync();
    //_initEvents();
}

window.addEventListener("DOMContentLoaded", async () => {
    await _initApp();
});

