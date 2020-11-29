# 非官方神魔之塔資訊 API
提供現時活動、卡片資訊、關卡資訊等

支援 CORS (Cross-Origin Resource Sharing)

## 使用
無需付費、無需註冊、無需驗證

只需發送 HTTP GET 請求至伺服器即可取得所有資訊

[想嘗試看看嗎？請至測試網站！](https://app.swaggerhub.com/apis-docs/JacobLinCool/TOS-API/1.0.0/)

如果在你的作品中用到此 API 也可註記一下，提個 Issue 告訴我，我看到可能會幫你分享

### 上限
基於設備及系統限制，此 API 有以下限制：
```
全伺服器請求上限： 100,000 次/日
且同時還有 1,000 次/分鐘 的攻擊防護限制
```
請不要濫用 API，希望能讓大家都可以正常使用
* 濫用者會每次都保底喔，還會關鍵時刻斷 Combo 沒天降喔！

### Javascript API
提供 JS 開發環境一個更簡潔的使用方式，並內建快取機制。

[詳情請至此頁面查看](https://github.com/pascal-the-elf/TOS-API/tree/main/API/js)

## 錯誤回報及新功能構想
遇到錯誤可以直接提 Issue 到這個 Repo，最好包含請求的 URL 方便除錯（如果使用 JS API 請提供請求參數及版本）

有新想法的也歡迎提 PR 或 Issue！

## 來源
部分資料是從 [神魔之塔官方圖鑑](https://gallery.tosgame.com/) 抓來的，也有部分資料是從 [神魔之塔 繁中維基](https://tos.fandom.com/zh/wiki/) 抓來的

感謝所有為 [神魔之塔 繁中維基](https://tos.fandom.com/zh/wiki/) 社群貢獻的朋友們，祝你們都送抽就中 1% 大獎！
