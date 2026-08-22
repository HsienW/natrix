# Natrix

![license](https://img.shields.io/badge/license-ISC-2f855a)
![language](https://img.shields.io/badge/Vanilla-JavaScript-f7df1e)
![runtime](https://img.shields.io/badge/runtime-fixed%20timestep-2563eb)
![replay](https://img.shields.io/badge/replay-deterministic-7c3aed)
![rendering](https://img.shields.io/badge/rendering-DOM%20%2B%20Canvas-0f766e)
![coverage](https://img.shields.io/badge/coverage-93.31%25%20lines-brightgreen)
![node](https://img.shields.io/badge/node-%3E%3D24%20%3C25-8dd6f9)
![npm](https://img.shields.io/badge/npm-%3E%3D10-cb3837)

<p align="center">
  <a href="./README.md"><strong>English</strong></a> |
  <a href="./README.zh-TW.md">繁體中文</a> |
  <a href="./README.zh-CN.md">简体中文</a>
</p>

Natrix 是一個以「雙人貪食蛇遊戲」為核心所打造的無框架，並用瀏覽器執行環境（runtime）專案。

本專案最初是以原生 JavaScript（Vanilla JavaScript）實作的貪食蛇遊戲，後來被現代化改造為一個精簡的執行環境展示範例，具備：Command-driven input、Fixed-timestep simulation、Deterministic replay、Explicit lifecycle state，以及可替換的 DOM / Canvas 渲染器（renderer）。

沒有使用任何 Framework，也沒有使用遊戲引擎。僅使用瀏覽器 API、JavaScript 模組、測試，以及一個小遊戲介面，讓執行環境的行為易於檢視。

## Demo

[Online play](https://competent-khorana-6f72c1.netlify.app)

你可以在遊戲下方的控制項中，於執行期間切換渲染器（renderer）。Canvas 模式也可以透過網址參數 `?renderer=canvas` 直接指定；若渲染器參數缺失或無效，將會回退（fall back）為 DOM 渲染。

## 核心能力

- **Framework-free browser runtime**：遊戲執行於純 JavaScript、Webpack、DOM、Canvas，以及瀏覽器計時 API 之上。
- **Command-driven input**：鍵盤事件會先被轉換為邏輯指令（logical command），才會傳遞到模擬狀態（simulation state）。
- **Fixed-timestep simulation**：遊戲進行是以穩定的邏輯 tick 速率推進，而非依賴顯示器的更新率（refresh rate）。
- **Explicit lifecycle state**：開始（start）、暫停（pause）、繼續（resume）、結束（finish）、重置（reset），皆由執行環境的狀態機（state machine）管理。
- **Deterministic simulation and replay**：透過帶種子的隨機數產生器（seeded RNG）、以 tick 為索引的指令紀錄、重播（replay）資料，以及狀態雜湊（state hash），使遊戲過程可重現。
- **Renderer boundary**：`DOMRenderer`、`CanvasRenderer` 與 `NullRenderer` 共用相同的 `init / render / resize / destroy` 介面規範。
- **Headless testability**：核心模擬與重播邏輯可以在不進行 DOM 渲染的情況下執行。
- **Regression coverage**：基準遊戲流程、執行環境生命週期、重播、渲染器行為、輸入緩衝（input buffering），以及確定性測試素材（fixture），皆由 Jest 涵蓋測試。

## Gameplay

![Snake gameplay](https://user-images.githubusercontent.com/20525933/132933824-1c4b95b5-2d8f-46ab-9996-38121f5935c2.png)

- 本地雙人對戰貪食蛇，分為紅隊與藍隊。
- 藍色蛇使用方向鍵 ⬆️, ⬅️, ⬇️, ➡️ 控制。
- 紅色蛇使用 `W`、`A`、`S`、`D` 控制。
- 黃色食物：+1 分。
- 綠色食物：+2 分。
- 當蛇撞到牆壁或自己的身體時即死亡。
- 若某一隊的所有蛇都死亡，另一隊立即獲勝。
- 若時間耗盡，分數較高的一隊獲勝。

## Architecture

```text
KeyboardEvent
    -> KeyboardInput
    -> InputBuffer
    -> GameRuntime
    -> FixedTimestepLoop
    -> Simulation step
    -> Render snapshot
    -> DOMRenderer / CanvasRenderer / NullRenderer
```

此執行環境將「意圖（intent）」、「狀態（state）」與「呈現（presentation）」三者分離：

- **Input boundary**：瀏覽器鍵盤事件轉換為邏輯指令。
- **Runtime boundary**：`GameRuntime` 負責管理生命週期、tick 推進、指令紀錄、快照（snapshot），以及渲染器協調。
- **Simulation boundary**：`stepGame(state, commands)` 推進可序列化（serializable）的遊戲狀態，並發出領域事件（domain event）。
- **Replay boundary**：已紀錄的指令與帶種子的設定，可在不依賴瀏覽器 API 的情況下同步重播。
- **Rendering boundary**：渲染器只接收快照，不會直接修改權威（authoritative）遊戲狀態。

### Main Source Areas

| Path | Responsibility |
| --- | --- |
| `src/js/input/` | 鍵盤對應（mapping）、指令緩衝，以及輸入的所有權管理 |
| `src/js/runtime/` | 執行環境外觀（facade）、固定時間步長迴圈，以及生命週期狀態機 |
| `src/js/simulation/` | 移動、計分、碰撞、結束規則，以及純函式式的狀態推進 |
| `src/js/state/` | 可序列化的遊戲狀態、快照、標準狀態（canonical state），以及狀態雜湊 |
| `src/js/replay/` | 指令紀錄、重播編解碼器（codec）、重播執行器，以及資料驗證 |
| `src/js/render/` | 渲染器介面規範、DOM 渲染器、Canvas 渲染器、HUD、渲染器容器（host），以及模式選擇 |
| `test/` | 單元測試、整合測試、渲染器測試、重播測試，以及回歸測試涵蓋範圍 |
| `docs/baseline/` | 歷史遊戲流程與效能基準紀錄 |

## Getting Started

```bash
npm ci
npm start
```

開啟 `http://localhost:8080`。

## Commands

| 指令 | 用途 |
| --- | --- |
| `npm start` | 於 `http://localhost:8080` 啟動 Webpack 開發伺服器 |
| `npm run build` | 建置正式環境打包檔至 `dist/` |
| `npm run preview` | 於 `http://127.0.0.1:4173` 提供正式環境建置版本的預覽 |
| `npm test` | 執行 Jest 測試套件 |
| `npm run test-coverage` | 產生測試涵蓋率報告 |
| `npm run verify:dev-server` | 對開發伺服器進行基本可用性檢查（smoke check） |
| `npm run verify:preview` | 建置完成後，對正式環境預覽進行基本可用性檢查 |

## Verification Baseline

在發布或審查任何執行環境變更之前，請依序執行以下步驟：

```bash
npm ci
npm test
npm run test-coverage
npm run build
npm run preview
```

在 `npm run preview` 執行後，於另一個終端機視窗中執行：

```bash
npm run verify:preview
```

## Design Notes

本程式碼庫僅在真正能描述實際邊界之處採用設計模式：

- **Command**：用於輸入、重播，以及未來可能的傳輸邊界。
- **State Machine**：用於執行環境的生命週期規則。
- **Facade**：用於公開的 `GameRuntime` API。
- **Strategy**：用於渲染器的選擇。
- **Adapter**：包裝與瀏覽器相關的輸入與渲染細節。
- **Memento-style replay payloads**：用於可重現的模擬。

## License

ISC
