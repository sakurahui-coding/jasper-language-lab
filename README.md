# Jasper Language Lab

Jasper Language Lab is a mobile-first personal learning site for Jasper. It combines WordPress.com for public lesson posts and a GitHub Pages static site for interactive English, Japanese, German, and school-subject practice.

The first version uses only HTML5, CSS3, Vanilla JavaScript, JSON, and `localStorage`. It does not require WordPress plugins, PHP changes, a database, paid APIs, secret keys, or a backend server.

## 功能

- 首頁學習儀表板：今日進度、待複習單字、連續學習天數、最近閱讀與快速入口。
- 教材索引：從 `web/data/lessons.json` 載入多篇教材，支援搜尋、語言、程度與主題篩選。
- 閱讀頁：透過 `reading.html?lesson=lesson-slug` 載入教材、學習目標、單字卡、片語、文法、重要句子、練習、Web Speech API 發音、收藏、翻譯切換、字級調整、單句朗讀。
- 單字庫：搜尋、語言篩選、詞性篩選、熟悉程度篩選、收藏日期、來源文章、熟悉程度更新、刪除確認、JSON 匯出與匯入。
- 複習頁：看單字選意思、看意思選單字、例句填空、翻卡模式、答題紀錄、簡化間隔複習。
- 學習進度：收藏數、今日複習、掌握數、本週複習、答對率、熟悉程度分布、語言分布、弱點單字與 14 天複習日曆。
- YouTube 頁：合法影片 ID 解析、官方 YouTube embed、手動字幕/句子、時間點跳轉原型、收藏學習句、AB Repeat 原型、跟讀練習區。
- 歌曲頁：官方 YouTube embed、使用者自行貼入合法歌詞或句子、單句循環原型、聽力填空、跟唱錄音入口、版權提示。
- WordPress 教材模板：HTML 與 Markdown 版本，可人工貼入 WordPress 區塊編輯器。

## 資料夾結構

```text
jasper-language-lab/
├── docs/
├── content/
├── templates/
├── wordpress/
├── web/
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   └── data/
└── tests/
```

## 本機預覽方式

從專案根目錄啟動靜態伺服器：

```bash
cd jasper-language-lab/web
python3 -m http.server 8080
```

然後打開：

```text
http://localhost:8080/
```

也可以直接打開 `web/index.html`，但部分瀏覽器會限制本機 JSON 讀取，因此建議使用本機伺服器預覽。

## GitHub Pages 部署方式

1. 在 GitHub 建立 repository，例如 `jasper-language-lab`。
2. 將本專案推送到 `main` branch。
3. 到 GitHub repository 的 Settings -> Pages。
4. Source 選擇 GitHub Actions。
5. 等待 `Deploy GitHub Pages` workflow 完成。Workflow 會檢查必要檔案、JSON 語法、JavaScript 語法與 root-relative HTML asset paths，然後部署 `web/` 資料夾。
6. 在 workflow summary 或 Settings -> Pages 找到網站公開網址。
7. 開啟首頁、`lessons.html`、`reading.html?lesson=europe-dam-removal`，確認 CSS、JavaScript 與 JSON 都正常載入。

此專案使用相對路徑，不假設部署在網域根目錄，因此可在 GitHub Pages repository 子路徑運作。

## 新增教材的方法

1. 複製 `templates/lesson-template.md` 建立新的教材草稿。
2. 在 `web/data/lessons/` 建立新的教材 JSON，例如 `my-new-lesson.json`。
3. 在 `web/data/lessons.json` 新增索引項目，填入 `slug`、`title`、`language`、`level`、`topic`、`estimatedTime`、`tags`、`featured` 與 `dataFile`。
4. 教材網址格式為 `reading.html?lesson=你的-slug`。
5. 在 WordPress 使用 `wordpress/block-editor-template.html` 或 `templates/wordpress-lesson-template.html` 人工貼上正式文章。
6. 在 WordPress 文章加入 GitHub Pages 的互動練習連結。

## 修改品牌顏色的方法

主要顏色集中在 `web/assets/css/variables.css`：

```css
:root {
  --color-primary: #6658E8;
  --color-primary-light: #EFEDFF;
}
```

修改 CSS variables 後，所有頁面會一起更新。

## WordPress 人工發布流程

1. 在本機完成教材草稿與互動頁測試。
2. 使用 WordPress 教材模板整理文章。
3. 手動登入 WordPress.com。
4. 新增文章，貼入 Markdown 或 Custom HTML 區塊。
5. 設定分類、標籤、精選圖片與摘要。
6. 加入 YouTube 官方嵌入與 GitHub Pages 互動練習連結。
7. 預覽手機與桌面版後再手動發布。

## 資料備份方式

- 定期備份 `content/`、`web/data/`、`templates/`、`wordpress/`。
- 匯出 WordPress 內容備份。
- 不把密碼、Cookie、Token 或私人資料放進 repository。
- `localStorage` 只適合個人瀏覽器暫存，重要單字可在單字庫頁匯出為 `jasper-language-lab-vocabulary-YYYY-MM-DD.json`。
- 匯入 JSON 會先驗證 schema、必要欄位與單字資料，並顯示新增、重複、衝突與無效資料數量。

## 已知限制

- `localStorage` 只存在同一瀏覽器與同一網域。
- Web Speech API 的聲音與支援度依瀏覽器不同。
- YouTube 跳轉與 AB Repeat 第一版是介面原型，不直接控制 YouTube Player API。
- 歌詞與文章內容需由使用者確認授權，不內建完整受版權保護內容。
- 免費 WordPress.com 不能安裝自訂外掛或任意執行 JavaScript。
- 學習進度中的閱讀進度以最後選取的段落估算，第一版不追蹤精準字數位置。

## 隱私與版權注意事項

本專案不需要帳號密碼或秘密金鑰。請勿提交 WordPress 密碼、API Token、Cookie、學生私人資料、完整受版權保護文章或完整歌詞。YouTube 僅使用官方嵌入方式。
