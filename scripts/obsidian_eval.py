#!/usr/bin/env python3
"""Helper to evaluate JS in Obsidian via Chrome DevTools Protocol."""
import json, sys, websocket, subprocess

def get_ws_url(vault_name="book"):
    result = subprocess.run(
        ["curl", "-s", "http://localhost:9222/json"],
        capture_output=True, text=True
    )
    targets = json.loads(result.stdout)
    for t in targets:
        if vault_name in t.get("title", ""):
            return t["webSocketDebuggerUrl"]
    raise RuntimeError(f"No Obsidian window found for vault '{vault_name}'")

def eval_js(expression, vault_name="book"):
    ws_url = get_ws_url(vault_name)
    ws = websocket.create_connection(ws_url, timeout=30)
    ws.send(json.dumps({
        "id": 1,
        "method": "Runtime.evaluate",
        "params": {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True,
        }
    }))
    result = json.loads(ws.recv())
    ws.close()
    value = result.get("result", {}).get("result", {}).get("value")
    return value

if __name__ == "__main__":
    expr = sys.argv[1] if len(sys.argv) > 1 else "app.vault.getName()"
    result = eval_js(expr)
    print(result)
