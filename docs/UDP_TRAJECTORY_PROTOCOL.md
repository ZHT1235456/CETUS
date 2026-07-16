# CETUS UDP 轨迹协议 V1

## 网络约定

- CETUS 桌面端监听 IPv4 UDP `0.0.0.0:5005`。
- 发送端使用单播，将目标地址设置为运行 CETUS EXE 的电脑 IP。
- 第一版只允许一个活动发送 IP；当前来源连续 2 秒无有效数据后，另一 IP 才能接管。
- 单个数据报不得超过 1400 字节，避免常见局域网 MTU 下的 IP 分片。
- Windows 首次弹出网络访问提示时，仅需允许“专用网络”。程序不会自动修改防火墙。

## 数据报

每个 UTF-8 JSON 数据报是一帧完整编队数据：

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

在项目根目录运行：

```powershell
python tools/send_trajectory.py --host 192.168.1.20
```

可选参数：`--port 5005`、`--hz 20`、`--loop`、`--trajectory-dir <目录>`。默认轨迹目录为 `assets/trajecytory`，默认播放一次后停止；停止 2 秒后桌面端冻结最后一帧并显示 `UDP · TIMEOUT`。
