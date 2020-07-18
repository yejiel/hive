//Singleton

let instance;

class StorageManager {

    constructor() {

        if(!instance) {
            instance = this;
        }
        return instance;
    }

    async getItemAsync(displayName = null) {

        try{
            const item = await this.#getAsync(displayName);
            return item;

        }catch (e) {
            throw new Error(`StorageManager@getItemAsync: get failure (${e.message})`);

        }
    }

    async upsertItemAsync(itemObj) {

        if(itemObj.displayName && typeof itemObj.displayName === 'string') {
            try{
                await this.#setItemAsync(itemObj.displayName, itemObj);
            }catch (e) {
                throw new Error('StorageManager@upsertItemAsync: upsert failure');
            }

        }else{
            throw new Error('StorageManager@upsertItemAsync: invalid item');
        }
    }

    async setDataAsync(dataObj) {
        await this.#setAsync(dataObj);
    }

    async deleteItemAsync(displayName) {

        if(displayName && typeof displayName === 'string') {
            try{
                await this.#deleteAsync(displayName);
            }catch (e) {
                throw new Error('StorageManager@deleteItemAsync: delete failure');
            }

        }else{
            throw new Error('StorageManager@deleteItemAsync: invalid item');
        }
    }

    async getAllItemsAsync() {

        const allItems = await this.getItemAsync();
        return allItems;
    }

    async clearAllItemsAsync() {

        try{
            this.#clearAsync();
        }catch (e) {
            throw new Error('StorageManager@clearAllItemsAsync: clear failure');
        }

    }
    // private --!

    #getAsync = (key = null) => {

        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(key, (obj) => {
                if (chrome.runtime.lastError) {
                    reject();
                } else {
                    resolve(obj);
                }
            });
        });
    };

    #setItemAsync = (key, data) => {

        return new Promise((resolve, reject) => {
            chrome.storage.sync.set({[key]: data}, () => {
                if (chrome.runtime.lastError) {
                    reject();
                } else {
                    resolve();
                }
            });
        });
    };

    #setAsync = (data) => {

        return new Promise((resolve, reject) => {
            chrome.storage.sync.set(data, () => {
                if (chrome.runtime.lastError) {
                    reject();
                } else {
                    resolve();
                }
            });
        });
    };

    #deleteAsync = (key) => {

        return new Promise((resolve, reject) => {
            chrome.storage.sync.remove(key, () => {
                if (chrome.runtime.lastError) {
                    reject();
                } else {
                    resolve();
                }
            });
        });
    };

    #clearAsync = () => {

        return new Promise((resolve, reject) => {
            chrome.storage.sync.clear(() => {
                if (chrome.runtime.lastError) {
                    reject();
                } else {
                    resolve();
                }
            });
        });
    }


}
instance = new StorageManager();
Object.freeze(instance);
export default instance;