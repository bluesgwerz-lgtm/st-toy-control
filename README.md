# ST Toy Control

SillyTavern 扩展：监听 AI 回复中的 `‹toy:模式›` 标记，转发到本地控制服务器，实现剧情驱动的设备控制。

扩展本身不含任何蓝牙逻辑，只做一件事：从 AI 消息里提取标记，向你自己的本地 HTTP 服务发 `GET /set?mode=xxx`。配套的控制服务器和蓝牙桥接页面需自备。

## 安装

SillyTavern → 扩展面板 → Install extension → 粘贴本仓库地址。

或手动：把本仓库放入 `SillyTavern/public/scripts/extensions/third-party/st-toy-control/`。

## 使用

1. 扩展设置里填你的控制服务器地址（默认 `http://localhost:9090`）
2. 让你的预设/角色卡指导 AI 在回复中插入标记，如 `‹toy:wave›`
3. 消息完成时扩展自动提取标记并转发；聊天界面中标记默认隐藏

装好后酒馆顶栏会多一个 🎮 图标（状态灯 + 急停键，位于角色管理图标左侧倒数第二位）：灰色=已禁用、正常色=待机、粉色跳动=播放中。**单击=立即发送停止**（禁用状态下也有效），双击或长按约 0.6 秒=启用⇄禁用总开关。

## 标记格式

`‹toy:模式名›`（兼容半角 `<toy:模式名>`）。一条回复含多个标记时最后一个生效。

内置模式白名单：`wave` `pulse` `tease` `edge` `deep` `devour` `chaos` `storm` `gentle` `climb` `breathe` `heartbeat` `gspot` `alternate` `denial` `random` `stop`。修改白名单直接编辑 `index.js` 顶部的 `MODES` 数组，与你服务器端的模式名保持一致。

## 服务器端约定

- `GET /set?mode=xxx` — 切换模式
- `GET /state` — 返回 `{"mode":"xxx"}`（「测试连接」按钮用）

扩展用 no-cors 模式发请求，服务器不配 CORS 头也能收到指令。

## 安全设计

- 顶栏常驻 🎮 急停图标，单击立即停止，禁用状态下同样有效
- 关闭扩展总开关时自动发送一次 `stop`
- 设置面板常驻「⏹ 立即停止」按钮
- 模式名走白名单校验，未知标记直接忽略

## License

MIT
