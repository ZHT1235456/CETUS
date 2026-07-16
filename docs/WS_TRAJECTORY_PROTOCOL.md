# CETUS WebSocket 轨迹协议 V1

## 网络约定

- 协同计算机上的 Python 发送端作为 **WebSocket 服务端**，默认监听 `0.0.0.0:5005`。
- CETUS 网页端与 Tauri 桌面端均作为 **WebSocket 客户端**连接同一服务，因此两边轨迹天然同步。
- 默认连接地址为 `ws://127.0.0.1:5005`。跨机器时在云端页右侧「发送端」输入 Python 电脑的局域网 IP 与端口，点「连接」即可；设置会写入浏览器/桌面本地存储。
- 单帧 UTF-8 JSON 建议不超过 64 KiB。
- 发送端停止约 2 秒后，客户端冻结最后一帧并显示 `WS · TIMEOUT`，同时自动重连。

## 消息

每个 WebSocket 文本帧是一帧完整编队数据：

```json
{
  "version": 1,
  "type": "fleet",
  "streamId": "f62a6c1d-46ca-4410-838e-090c62bf1a08",
  "seq": 0,
  "sentAtMs": 1784172000000,
  "frame": {
    "USV-1": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0,
      "heading": 0.0,
      "speed": 1.0,
      "isFault": false,
      "health": 100.0
    },
    "USV-2": {},
    "USV-3": {},
    "USV-4": {},
    "USV-5": {},
    "USV-6": {}
  }
}
```

实际数据中六个艇对象均必须包含示例中 `USV-1` 的全部字段。`frame` 必须且只能包含 `USV-1` 至 `USV-6`。

- `streamId`：发送脚本每次启动时生成的新 UUID。
- `seq`：同一数据流内从 0 开始单调递增。
- `sentAtMs`：Unix 毫秒时间戳。
- `x/y/z`：X=北、Y=东、Z=天。
- `heading`：弧度，0 表示正北（+X），正方向朝东（+Y）。
- `speed`：非负坐标单位/秒。
- `health`：0 至 100。
- 所有数值必须是有限 JSON 数值；禁止 `NaN` 与 `Infinity`。

## CSV 发送器

先安装依赖，再在项目根目录运行：

```powershell
pip install -r tools/requirements.txt
python tools/send_trajectory.py --loop
```

可选参数：`--host 0.0.0.0`、`--port 5005`、`--hz 20`、`--loop`、`--trajectory-dir <目录>`。

默认轨迹目录为 `assets/trajecytory`，默认播放一次后停止。客户端会自动重连；停止 2 秒后界面显示 `WS · TIMEOUT`。
