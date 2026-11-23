# 90s 止滑劑｜單品募資頁（前端骨架）

純 HTML / CSS / JavaScript 的單一商品募資長頁，無框架。所有金額、方案與庫存都是假資料；後端尚未串接。

## 結構
- `index.html`：整頁內容與各區塊
- `theme.css`：配色變數（改這裡可換整站色系）
- `style.css`：版面與響應式（RWD）
- `app.js`：互動（募資進度、倒數、前後對比拉桿、購物車、結帳、登入）
- `campaign.json` / `plans.json` / `faq.json` / `reviews.json`：假資料
- `img/`：頁面使用的圖片與動態圖

## 接後端
在 `app.js` 搜尋 `TODO`，把 `api` 物件裡的實作換成你的 API：
`GET /campaign`、`GET /plans`、`GET /faq`、`GET /reviews`、`POST /auth/login`、`POST /auth/register`、`POST /orders`。

## 預覽
GitHub Pages（Deploy from branch → main / root）。`robots.txt` 與 `noindex` 已設定不被搜尋引擎收錄。
