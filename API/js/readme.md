# TOS API 的 Javascript API
提供 JS 開發環境一個更簡潔的使用方式，並內建快取機制。

## 使用
1. 直接下載 [tos_api.js](https://github.com/pascal-the-elf/TOS-API/raw/main/API/js/tos_api.js) 或 [tos_api.min.js](https://github.com/pascal-the-elf/TOS-API/raw/main/API/js/tos_api.min.js)
2. [使用 CDN](https://cdn.jsdelivr.net/gh/pascal-the-elf/TOS-API@latest/API/js/tos_api.min.js)

```javascript
// 先建立一個 API 物件
let api = new tos_api();

// 設定快取（如需要）
api.settings.cache.allow = false; // 預設是 true，表示允許
api.settings.cache.expire.event = 60000; // 預設是 1*60*1000， 即 1 分鐘
api.settings.cache.expire.card = 60000; // 預設是 60*60*1000， 即 1 小時
api.settings.cache.expire.stage = 60000; // 預設是 5*60*1000， 即 5 分鐘

// 獲取現時活動資訊
api.event.get().then(console.log); // 獲取資訊，並在取得後顯示於 console

// 獲取卡片資訊
api.card.get([2565, 2566, 2567, 2568, 2569, 2570]).then(console.log); // 獲取資訊，並在取得後顯示於 console

// 搜尋卡片
api.card.search({star: 8}).then(console.log); // 獲取資訊，並在取得後顯示於 console

// 列出所有卡片
api.card.all().then(console.log); // 獲取資訊，並在取得後顯示於 console

// 獲取關卡資訊
api.stage.get("封王挑戰關卡").then(console.log); // 獲取資訊，並在取得後顯示於 console

```
