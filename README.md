# 服飾品牌落地頁（前端骨架）

純靜態網站，無需建置。所有檔案都放在最上層。

## 本機預覽
python3 -m http.server 8000，然後開 http://localhost:8000

## 檔案
- index.html：頁面骨架
- style.css：版型；theme.css：品牌色票（改這個換色）
- app.js：api 物件是後端接口，目前讀同資料夾的 json
- products.json、nav.json、faq.json、reviews.json：假資料
- 商品圖是 app.js 內自繪的 SVG 插畫，換成實拍圖時在 products.json 加 image 欄位並調整 renderPlans

## 注意
- 頁面已加 noindex 與 robots.txt，請搜尋引擎不要收錄（不等於私密）。
- 頁面上標示「範例」的文案、數據、檢驗項目皆為假資料，上線前請換成實際內容。
