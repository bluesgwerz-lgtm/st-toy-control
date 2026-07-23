# mcp_server.py — 可选组件：MCP Server 桥（端口9091, Streamable HTTP）
# 把本地控制服务器(9090)暴露成 MCP 工具，让任何 MCP 客户端（Claude Desktop、NuOS 等）
# 也能驱动同一套玩具链路，与酒馆扩展并行的第二入口，二者可同时使用。
#
# 依赖: pip install fastmcp
# 启动: python mcp_server.py   （控制服务器需先在 9090 端口运行）
# MCP 客户端填: http://127.0.0.1:9091/mcp
#
# 本文件不含任何蓝牙/设备逻辑，只做 HTTP 转发，与扩展遵循同一服务器契约：
#   GET /set?mode=xxx   GET /stop   GET /state
import json
import urllib.request
import urllib.parse
import urllib.error

from fastmcp import FastMCP

BASE = 'http://127.0.0.1:9090'

# 与 index.js 的 MODES、你服务器端白名单保持一致，改词表要同步
MODES = {
    'wave', 'pulse', 'tease', 'edge', 'deep',
    'devour', 'chaos', 'storm', 'gentle', 'climb',
    'breathe', 'heartbeat', 'gspot', 'alternate', 'denial', 'random',
    'stop',
}

mcp = FastMCP('toy-control')


def _get(path: str) -> dict:
    try:
        with urllib.request.urlopen(BASE + path, timeout=3) as r:
            return {'ok': True, 'state': json.loads(r.read().decode())}
    except (urllib.error.URLError, OSError) as e:
        return {'ok': False, 'error': f'控制服务器不可达({e})，检查 9090 端口的服务是否在运行'}


@mcp.tool()
def set_toy_mode(mode: str) -> dict:
    """设置玩具节奏模式。
    温柔系: gentle(温存) wave(波浪) breathe(呼吸) heartbeat(心跳)
    技巧系: tease(挑逗) gspot(G点) deep(深入) devour(吞噬) alternate(交替)
    失控系: climb(攀升) edge(焦灼) denial(禁止) random(随机) chaos(失控) storm(风暴) pulse(脉冲)
    停止: stop"""
    mode = mode.strip().lower()
    if mode not in MODES:
        return {'ok': False, 'error': f'未知模式 {mode}', 'available': sorted(MODES)}
    return _get('/set?mode=' + urllib.parse.quote(mode))


@mcp.tool()
def stop_toy() -> dict:
    """立即停止玩具所有输出（急停）。"""
    return _get('/stop')


@mcp.tool()
def get_toy_state() -> dict:
    """获取玩具当前模式和指令序号。"""
    return _get('/state')


if __name__ == '__main__':
    print('Toy Control MCP Server -> http://127.0.0.1:9091/mcp  (转发到 9090)')
    try:
        mcp.run(transport='http', host='127.0.0.1', port=9091)
    except (ValueError, KeyError):
        # 旧版 fastmcp 的 Streamable HTTP 传输名不同
        mcp.run(transport='streamable-http', host='127.0.0.1', port=9091)
