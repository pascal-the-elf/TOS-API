function tos_api() {
    var self = this;

    // 初始化
    self.init = async function() {
        await self.cache.init();
        return true;
    };
    // 活動資訊 API
    self.event = {
        get: async function() {
            var events;
            // 如果開啟快取功能，則優先從快取找
            if(self.settings.cache.allow) {
                console.log("已啟用快取功能，查詢快取資料");
                let cache = await self.cache.get("event", null);
                if(cache) events = cache;
            }
            // 如果沒有使用快取資料，則向伺服器請求
            if(!events) {
                console.log("開始向伺服器請求活動資料");
                var response = await fetch(`${self.settings.server}/v1/event/get`).then(r=>r.json());
                if(response.info.success) {
                    console.log("成功向伺服器請求活動資料", response);
                    if(self.settings.cache.allow) {
                        console.log("已啟用快取功能，寫入快取資料");
                        self.cache.set("event", response.data);
                    }
                    events = response.data;
                }
            }
            console.log("回傳活動資料");
            return events;
        }
    };
    // 卡片資訊 API
    self.card = {
        get: async function(id) {
            // 標準化 id 資料格式
            if(typeof id == "string") id = [id];
            else if(typeof id == "number") id = [id.toString()];
            else if(Array.isArray(id) && id.length > 0) {
                id = id.map(item => {
                    if(typeof item == "string") return item;
                    else if(typeof item == "number") return item.toString();
                    else return "";
                });
            }
            else return false;

            var que = [], cards = {};
            // 如果開啟快取功能，則優先從快取找
            if(self.settings.cache.allow) {
                console.log("已啟用快取功能，查詢快取資料");
                let cache = await self.cache.get("card", id);
                que = cache.request;
                cache.local.forEach(item => { cards[item[0]] = item[1] });
            }
            else que = id;
            // 如果有需要請求的資料，則向伺服器請求
            if(que.length > 0) {
                console.log("開始向伺服器請求卡片資料", que);
                var response = await fetch(`${self.settings.server}/v1/card/info?id=${que.join(",")}`).then(r=>r.json());
                if(response.info.success) {
                    console.log("成功向伺服器請求卡片資料", response);
                    if(self.settings.cache.allow) {
                        console.log("已啟用快取功能，寫入快取資料");
                        self.cache.set("card", response.data);
                    }
                    Object.entries(response.data).forEach(card => { cards[card[0]] = card[1] });
                }
            }
            console.log("回傳卡片資料");
            return cards;
        },
        search: async function(filters = {}) {
            Object.entries(filters).forEach(pair => {
                if(Array.isArray(pair[1])) filters[pair[0]] = pair[1].join(",");
            });
            let params = new URLSearchParams(filters);
            try {
                var response = await fetch(`${self.settings.server}/v1/card/search?${params.toString()}`).then(r=>r.json());
                if(response.info.success) {
                    console.log("成功向伺服器搜尋卡片資料", response);
                    return response.data;
                }
                else throw new Error("向 API 搜尋卡片資料時發生未知錯誤");
            } catch(err) { return Promise.reject(new Error("發生錯誤：" + err)) }
        },
        all: async function() {
            return self.card.search({star:[1,2,3,4,5,6,7,8]});
        }
    };
    // 關卡資訊 API
    self.stage = {
        get: async function(name) {
            var stage;
            // 如果開啟快取功能，則優先從快取找
            if(self.settings.cache.allow) {
                console.log("已啟用快取功能，查詢快取資料");
                let cache = await self.cache.get("stage", name);
                if(cache) stage = cache;
            }
            // 如果沒有使用快取資料，則向伺服器請求
            if(!stage) {
                console.log("開始向 API 請求關卡資料");
                var response = await fetch(`${self.settings.server}/v1/stage/info?name=${name}`).then(r=>r.json());
                if(response.info.success) {
                    console.log("成功向 API 請求關卡資料", response);
                    if(self.settings.cache.allow) {
                        console.log("已啟用快取功能，寫入快取資料");
                        self.cache.set("stage", response);
                    }
                    stage = response.data;
                }
            }
            console.log("回傳關卡資料");
            return stage;
        }
    };
    // 快取系統
    self.cache = {
        init: async function() {
            // 檢查是否支援 indexedDB
            if (!window.indexedDB) {
                self.settings.cache.allow = false;
                console.log("瀏覽器不支援 indexedDB，已關閉快取功能");
                return false;
            }

            if(!self.cache.db) self.cache.db = {};
            let caches = [];
            // 建立卡片快取
            if(!self.cache.db.card) self.cache.db.card = indexedDB.open("Card Cache", 1);
            let card = new Promise((s, r) => {
                self.cache.db.card.onsuccess = function () {
                    self.cache.db.card = self.cache.db.card.result;
                    console.log("卡片快取已建立");
                    s(true);
                };
            });
            caches.push(card);
            self.cache.db.card.onupgradeneeded = function (evt) {
                var store = evt.currentTarget.result.createObjectStore("cards", { keyPath: "id" });

                store.createIndex("card", "card", { unique: false });
                store.createIndex("expire", "expire", { unique: false });
                console.log("卡片快取升級完成");
            };
            // 建立活動快取
            if(!self.cache.db.event) self.cache.db.event = indexedDB.open("Event Cache", 1);
            let evt = new Promise((s, r) => {
                self.cache.db.event.onsuccess = function () {
                    self.cache.db.event = self.cache.db.event.result;
                    console.log("活動快取已建立");
                    s(true);
                };
            });
            caches.push(evt);
            self.cache.db.event.onupgradeneeded = function (evt) {
                var store = evt.currentTarget.result.createObjectStore("event", { keyPath: "key" });

                store.createIndex("event", "event", { unique: false });
                store.createIndex("expire", "expire", { unique: false });
                console.log("活動快取升級完成");
            };
            // 建立關卡快取
            if(!self.cache.db.stage) self.cache.db.stage = indexedDB.open("Stage Cache", 1);
            let stage = new Promise((s, r) => {
                self.cache.db.stage.onsuccess = function () {
                    self.cache.db.stage = self.cache.db.stage.result;
                    console.log("關卡快取已建立");
                    s(true);
                };
            });
            caches.push(stage);
            self.cache.db.stage.onupgradeneeded = function (evt) {
                var store = evt.currentTarget.result.createObjectStore("stages", { keyPath: "name" });

                store.createIndex("stage", "stage", { unique: false });
                store.createIndex("expire", "expire", { unique: false });
                console.log("關卡快取升級完成");
            };
            await Promise.all(caches);
            return true;
        },
        get: async function(type, key) {
            if(type == "event") {
                var trx = self.cache.db.event.transaction("event", "readwrite");
                var store = trx.objectStore("event");

                let cached = await new Promise((sol, rej)=>{
                    let r = store.get("events");
                    r.onsuccess = function() {
                        sol(r.result);
                    };
                });

                if(cached && cached.event != null) {
                    if(cached.expire >= Date.now()) {
                        console.log(`已取得符合的活動快取資料，使用快取資料`);
                        return cached.event;
                    } else {
                        store.delete("events");
                        console.log(`符合的活動快取資料已過期，準備請求`);
                        return false;
                    }
                }
                else {
                    console.log(`未取得符合的活動快取資料，準備請求`);
                    return false;
                }
            }
            if(type == "card") {
                var trx = self.cache.db.card.transaction("cards", "readwrite");
                var store = trx.objectStore("cards");

                var request = [], local = [];
                for(let i = 0; i < key.length; i++) {
                    let cached = await new Promise((sol, rej)=>{
                        let r = store.get(key[i]);
                        r.onsuccess = function() {
                            sol(r.result);
                        };
                    });

                    if(cached && cached.card != null) {
                        if(cached.expire >= Date.now()) {
                            console.log(`已取得符合 No.${key[i]} 的卡片快取資料，使用快取資料`);
                            local.push([key[i],cached.card]);
                        } else {
                            store.delete(key[i]);
                            console.log(`符合 No.${key[i]} 的卡片快取資料已過期，加入請求儲列`);
                            request.push(key[i]);
                        }
                    }
                    else {
                        console.log(`未取得符合 No.${key[i]} 的卡片快取資料，加入請求儲列`);
                        request.push(key[i]);
                    }
                }
                return {request, local};
            }
            if(type == "stage") {
                var trx = self.cache.db.stage.transaction("stages", "readwrite");
                var store = trx.objectStore("stages");

                let cached = await new Promise((sol, rej)=>{
                    let r = store.get(key);
                    r.onsuccess = function() {
                        sol(r.result);
                    };
                });

                if(cached && cached.stage != null) {
                    if(cached.expire >= Date.now()) {
                        console.log(`已取得符合的關卡快取資料，使用快取資料`);
                        return cached.stage;
                    } else {
                        store.delete("events");
                        console.log(`符合的關卡快取資料已過期，準備請求`);
                        return false;
                    }
                }
                else {
                    console.log(`未取得符合的關卡快取資料，準備請求`);
                    return false;
                }
            }
        },
        set: async function(type, data) {
            if(type == "event") {
                new Promise((ok, reject) => {
                    var e = {
                        key: "events",
                        expire: Date.now() + self.settings.cache.expire.event,
                        event: data
                    };
                    var trx = self.cache.db.event.transaction("event", "readwrite");
                    var store = trx.objectStore("event");
                    var r = store.put(e);
                    r.onsuccess = function() { ok(e) };
                })
                .then(rsp => {rsp ? console.log("已寫入快取資料", rsp) : console.error("寫入快取資料失敗")})
                .catch(err => {console.error("寫入快取資料失敗", err)});
            }
            if(type == "card") {
                Object.entries(data).forEach(card => {
                    new Promise((ok, reject) => {
                        var c = {
                            id: card[0],
                            expire: Date.now() + self.settings.cache.expire.card,
                            card: card[1]
                        };
                        var trx = self.cache.db.card.transaction("cards", "readwrite");
                        var store = trx.objectStore("cards");
                        var r = store.put(c);
                        r.onsuccess = function() { ok(c) };
                    })
                    .then(rsp => {rsp ? console.log("已寫入快取資料", rsp) : console.error("寫入快取資料失敗")})
                    .catch(err => {console.error("寫入快取資料失敗", err)});
                });
            }
            if(type == "stage") {
                new Promise((ok, reject) => {
                    var e = {
                        name: data.info.request.params.name,
                        expire: Date.now() + self.settings.cache.expire.event,
                        stage: data.data
                    };
                    var trx = self.cache.db.stage.transaction("stages", "readwrite");
                    var store = trx.objectStore("stages");
                    var r = store.put(e);
                    r.onsuccess = function() { ok(e) };
                })
                .then(rsp => {rsp ? console.log("已寫入快取資料", rsp) : console.error("寫入快取資料失敗")})
                .catch(err => {console.error("寫入快取資料失敗", err)});
            }
        },
        info: async function() {
            var get_table_size = function(db, dbName){
                return new Promise((resolve, reject) => {
                    var size = 0;
                    var trx = db.transaction([dbName]).objectStore(dbName).openCursor();

                    trx.onsuccess = function(event) {
                        var cursor = event.target.result;
                        if(cursor) {
                            var storedObject = cursor.value;
                            var json = JSON.stringify(storedObject);
                            size += json.length;
                            cursor.continue();
                        }
                        else {
                            resolve(size);
                        }
                    }.bind(this);
                    trx.onerror = function(err) {
                        reject("error: " + err);
                    }
                });
            };

            var human_readable_size = function(bytes) {
                var thresh = 1024;
                if(Math.abs(bytes) < thresh) {
                    return bytes + ' B';
                }
                var units = ["KB","MB","GB"];
                var u = -1;
                do {
                    bytes /= thresh;
                    ++u;
                } while(Math.abs(bytes) >= thresh && u < units.length - 1);
                return bytes.toFixed(1)+' '+units[u];
            }

            let db_names = ["card", "event", "stage"];
            let result = {}, sum = 0;
            for(let i = 0; i < db_names.length; i++) {
                let db_name = db_names[i];
                let db = self.cache.db[db_name];
                var table_names = [...db.objectStoreNames];
                var table_size_getters = table_names.reduce((acc, table_name) => {
                    acc.push( get_table_size(db, table_name) );
                    return acc;
                }, []);
                let total = 0;
                await Promise.all(table_size_getters).then(size => {
                    total += Number(size);
                });
                result[db_name] = total;
                sum += total;
            }
            result["TOTAL"] = sum;
            result["READABLE"] = human_readable_size(sum);
            return result;
        },
        clear: function() {
            indexedDB.deleteDatabase("Card Cache");
            indexedDB.deleteDatabase("Event Cache");
            indexedDB.deleteDatabase("Stage Cache");
            console.log("已清除快取資料");
        }
    };
    // 設定
    self.settings = {
        server: "https://tos-api.pascaltheelf.tk",
        cache: {
            allow: true,
            expire: {
                event: 1*60*1000,
                card: 60*60*1000,
                stage: 5*60*1000
            }
        }
    };

}
