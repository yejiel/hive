import StorageManager from './storageManager.js';

const aliasesMap = {};
const link = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

async function _updateAliasesMap() {

    const data = await StorageManager.getAllItemsAsync();

    if (data) {
        for(let item in data) {
            // handle alias
            const itemAlias = data[item].alias;

            if (itemAlias && itemAlias !== "_dummy_") {

                aliasesMap[itemAlias] = data[item].url;
            }
        }
    }
}

(async () => await _updateAliasesMap())(); // when browser up -> update aliases map
chrome.storage.onChanged.addListener( () =>  _updateAliasesMap()); // on every storage change -> update aliases map

// called on every key stroke in the omnibox
chrome.omnibox.onInputChanged.addListener(function (text, suggest) {

    const suggestions = [];

    for (let key in aliasesMap) { // prepare all suggestions

        if (text && key.startsWith(text)) {

            const url = aliasesMap[key];
            const description = `<match>${text}: </match><dim>${key}</dim>`;
            const suggestResult = {content: url, description};
            suggestions.push(suggestResult);
        }
    }

        if (suggestions.length > 0) {
        const first = suggestions.splice(0, 1)[0];
        chrome.omnibox.setDefaultSuggestion({description: first["description"]});
    }


    // else {
    //     chrome.omnibox.setDefaultSuggestion({
    //         description: `<match>${text}: </match><dim> - Google Search</dim>`,
    //     });
    // }
    if(suggestions.length) {

        suggest(suggestions);
    }
});

// User has accepted what is typed into the omnibox. (by pressing enter)
chrome.omnibox.onInputEntered.addListener(function (text) {
    if (text in aliasesMap) {
        chrome.tabs.update({url: aliasesMap[text]});
    } else if (text.match(link)) {
        chrome.tabs.update({url: text});
    }
    // else if (text.match(re)) {
    //     var result = eval(text).toString();
    //     chrome.tabs.update({url: `https://google.com/search?q=${result}`});
    // } else {
    //     chrome.tabs.update({url: `https://google.com/search?q=${text}`});
    // }
});
