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

内置模式白名单（28 式 + 停止）：`wave` `pulse` `tease` `edge` `deep` `devour` `chaos` `storm` `gentle` `climb` `breathe` `heartbeat` `gspot` `alternate` `denial` `random` `tide` `punish` `ruin` `afterglow` `stairs` `countdown` `knock` `swing` `tremble` `lock` `doubletap` `mercy` `stop`。修改白名单直接编辑 `index.js` 顶部的 `MODES` 数组（用 MCP 的话 `mcp_server.py` 里的 `MODES` 也要同步），与你服务器端的模式名保持一致。

## 服务器端约定

- `GET /set?mode=xxx` — 切换模式
- `GET /state` — 返回 `{"mode":"xxx"}`（「测试连接」按钮用）

扩展用 no-cors 模式发请求，服务器不配 CORS 头也能收到指令。

## MCP 接入（可选）

仓库附带 [mcp_server.py](mcp_server.py)：把同一个控制服务器暴露成 MCP 工具，让任何支持 MCP 的 AI 客户端（Claude Desktop、NuOS 等）也能驱动玩具，与酒馆扩展并行的第二入口，二者可同时使用。

```
pip install fastmcp
python mcp_server.py      # 控制服务器需先在 9090 端口运行
```

MCP 客户端地址填 `http://127.0.0.1:9091/mcp`（Streamable HTTP，注意带 `/mcp` 路径）。暴露三个工具：`set_toy_mode(mode)`（白名单校验）、`stop_toy()`、`get_toy_state()`。文件本身不含任何蓝牙/设备逻辑，只做 HTTP 转发，遵循上面同一套服务器契约。注意：MCP 入口给了 AI 直接控制权，急停三条路（顶栏图标/面板按钮/浏览器访问 `/stop`）对它发起的模式同样有效。

## 安全设计

- 顶栏常驻 🎮 急停图标，单击立即停止，禁用状态下同样有效
- 关闭扩展总开关时自动发送一次 `stop`
- 设置面板常驻「⏹ 立即停止」按钮
- 模式名走白名单校验，未知标记直接忽略

## 更新说明

- 模式白名单从 16 式扩到 28 式（酒馆扩展与 `mcp_server.py` 同步），新增：`tide` 潮汐、`punish` 惩罚、`ruin` 毁掉、`afterglow` 余韵、`stairs` 台阶、`countdown` 倒数、`knock` 敲门、`swing` 秋千、`tremble` 颤抖、`lock` 锁潮、`doubletap` 双击、`mercy` 求饶。扩展仍只转发模式名，节奏由你的服务器端实现，服务器要认得新名字才会动；MCP 的 `set_toy_mode` 说明里的模式列表也已同步，AI 侧能直接看到新模式。

## License

MIT
