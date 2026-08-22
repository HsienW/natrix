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

Natrix 是一个以「双人贪吃蛇游戏」为核心所打造的无框架，并用浏览器执行环境（runtime）项目。

本项目最初是以原生 JavaScript（Vanilla JavaScript）实现的贪吃蛇游戏，后来被现代化改造为一个精简的执行环境展示范例，具备：Command-driven input、Fixed-timestep simulation、Deterministic replay、Explicit lifecycle state，以及可替换的 DOM / Canvas 渲染器（renderer）。

没有使用任何 Framework，也没有使用游戏引擎。仅使用浏览器 API、JavaScript 模块、测试，以及一个小游戏界面，让执行环境的行为易于检视。

## Demo

[Online play](https://competent-khorana-6f72c1.netlify.app)

你可以在游戏下方的控制项中，于执行期间切换渲染器（renderer）。Canvas 模式也可以通过网址参数 `?renderer=canvas` 直接指定；若渲染器参数缺失或无效，将会回退（fall back）为 DOM 渲染。

## 核心能力

- **Framework-free browser runtime**：游戏执行于纯 JavaScript、Webpack、DOM、Canvas，以及浏览器计时 API 之上。
- **Command-driven input**：键盘事件会先被转换为逻辑指令（logical command），才会传递到模拟状态（simulation state）。
- **Fixed-timestep simulation**：游戏进行是以稳定的逻辑 tick 速率推进，而非依赖显示器的更新率（refresh rate）。
- **Explicit lifecycle state**：开始（start）、暂停（pause）、继续（resume）、结束（finish）、重置（reset），皆由执行环境的状态机（state machine）管理。
- **Deterministic simulation and replay**：通过带种子的随机数产生器（seeded RNG）、以 tick 为索引的指令记录、重播（replay）数据，以及状态哈希（state hash），使游戏过程可重现。
- **Renderer boundary**：`DOMRenderer`、`CanvasRenderer` 与 `NullRenderer` 共用相同的 `init / render / resize / destroy` 接口规范。
- **Headless testability**：核心模拟与重播逻辑可以在不进行 DOM 渲染的情况下执行。
- **Regression coverage**：基准游戏流程、执行环境生命周期、重播、渲染器行为、输入缓冲（input buffering），以及确定性测试素材（fixture），皆由 Jest 涵盖测试。

## Gameplay

![Snake gameplay](https://user-images.githubusercontent.com/20525933/132933824-1c4b95b5-2d8f-46ab-9996-38121f5935c2.png)

- 本地双人对战贪吃蛇，分为红队与蓝队。
- 蓝色蛇使用方向键 ⬆️, ⬅️, ⬇️, ➡️ 控制。
- 红色蛇使用 `W`、`A`、`S`、`D` 控制。
- 黄色食物：+1 分。
- 绿色食物：+2 分。
- 当蛇撞到墙壁或自己的身体时即死亡。
- 若某一队的所有蛇都死亡，另一队立即获胜。
- 若时间耗尽，分数较高的一队获胜。

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

此执行环境将「意图（intent）」、「状态（state）」与「呈现（presentation）」三者分离：

- **Input boundary**：浏览器键盘事件转换为逻辑指令。
- **Runtime boundary**：`GameRuntime` 负责管理生命周期、tick 推进、指令记录、快照（snapshot），以及渲染器协调。
- **Simulation boundary**：`stepGame(state, commands)` 推进可序列化（serializable）的游戏状态，并发出领域事件（domain event）。
- **Replay boundary**：已记录的指令与带种子的设定，可在不依赖浏览器 API 的情况下同步重播。
- **Rendering boundary**：渲染器只接收快照，不会直接修改权威（authoritative）游戏状态。

### Main Source Areas

| Path | Responsibility |
| --- | --- |
| `src/js/input/` | 键盘对应（mapping）、指令缓冲，以及输入的所有权管理 |
| `src/js/runtime/` | 执行环境外观（facade）、固定时间步长循环，以及生命周期状态机 |
| `src/js/simulation/` | 移动、计分、碰撞、结束规则，以及纯函数式的状态推进 |
| `src/js/state/` | 可序列化的游戏状态、快照、标准状态（canonical state），以及状态哈希 |
| `src/js/replay/` | 指令记录、重播编解码器（codec）、重播执行器，以及数据验证 |
| `src/js/render/` | 渲染器接口规范、DOM 渲染器、Canvas 渲染器、HUD、渲染器容器（host），以及模式选择 |
| `test/` | 单元测试、集成测试、渲染器测试、重播测试，以及回归测试涵盖范围 |
| `docs/baseline/` | 历史游戏流程与性能基准记录 |

## Getting Started

```bash
npm ci
npm start
```

打开 `http://localhost:8080`。

## Commands

| 指令 | 用途 |
| --- | --- |
| `npm start` | 于 `http://localhost:8080` 启动 Webpack 开发服务器 |
| `npm run build` | 构建正式环境打包文件至 `dist/` |
| `npm run preview` | 于 `http://127.0.0.1:4173` 提供正式环境构建版本的预览 |
| `npm test` | 执行 Jest 测试套件 |
| `npm run test-coverage` | 生成测试涵盖率报告 |
| `npm run verify:dev-server` | 对开发服务器进行基本可用性检查（smoke check） |
| `npm run verify:preview` | 构建完成后，对正式环境预览进行基本可用性检查 |

## Verification Baseline

在发布或审查任何执行环境变更之前，请依序执行以下步骤：

```bash
npm ci
npm test
npm run test-coverage
npm run build
npm run preview
```

在 `npm run preview` 执行后，于另一个终端机窗口中执行：

```bash
npm run verify:preview
```

## Design Notes

本代码库仅在真正能描述实际边界之处采用设计模式：

- **Command**：用于输入、重播，以及未来可能的传输边界。
- **State Machine**：用于执行环境的生命周期规则。
- **Facade**：用于公开的 `GameRuntime` API。
- **Strategy**：用于渲染器的选择。
- **Adapter**：包装与浏览器相关的输入与渲染细节。
- **Memento-style replay payloads**：用于可重现的模拟。

## License

ISC
