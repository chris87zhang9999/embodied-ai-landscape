"""
Monthly pipeline: pull humanoid-tech-ops insights → LLM updates snapshot.

Usage:
  LLM_API_KEY=... PREV_PERIOD=2026-06 NEW_PERIOD=2026-07 python scripts/generate_snapshot.py

Defaults to Zhipu GLM-4-Flash if env vars not set.
"""
import json, os, sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from openai import OpenAI
from validate_snapshot import validate

_api_key = os.environ.get("LLM_API_KEY", "bfdd3095e8754436ba76f8f66e57b282.WZpoqLoWbO14UIIJ")
_base_url = os.environ.get("LLM_BASE_URL", "https://open.bigmodel.cn/api/paas/v4/")
_model = os.environ.get("LLM_MODEL", "glm-4-flash")

client = OpenAI(api_key=_api_key, base_url=_base_url)

SYSTEM = """\
你是具身智能产业链的专业投资研究员，每月更新一次产业链气泡图数据。

你的任务：基于上月快照和本月最新行业动态，更新各节点的评分和分析。

评分维度：
- tech_difficulty (1-10): 技术实现壁垒
- commercialization (1-10): 商业化落地成熟度
- market_size_b: 全球可寻址市场规模 (十亿美元 TAM)

更新原则：
1. 保留原有树形层级结构，不增删节点，不修改 id 字段
2. 只更新以下字段: tech_difficulty / commercialization / market_size_b / companies / investment_thesis
3. change_vs_prev 由脚本计算，你不需要填写
4. 仅根据有实质依据的行业动态调整分数，没有新信息时保持不变
5. 输出完整的 nodes 数组 (保留所有子树)

输出格式：严格JSON，只输出 nodes 数组，不要任何解释文字。"""


def fetch_insights() -> str:
    mcp_url = os.environ.get("HUMANOID_MCP_URL", "")
    if not mcp_url:
        return "(No MCP configured — using LLM general knowledge for this month)"
    try:
        import httpx
        token = os.environ.get("HUMANOID_MCP_TOKEN", "")
        r = httpx.post(
            f"{mcp_url}/query_insights",
            json={"since_days": 35, "track": ""},
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,
        )
        r.raise_for_status()
        return r.text[:6000]
    except Exception as e:
        print(f"Warning: MCP fetch failed ({e}), using general knowledge")
        return "(MCP unavailable)"


def apply_change_vs_prev(prev_nodes: list, new_nodes: list) -> list:
    prev_map: dict = {}

    def _index(nodes: list) -> None:
        for n in nodes:
            prev_map[n["id"]] = n
            _index(n.get("children", []))

    _index(prev_nodes)

    def _attach(nodes: list) -> list:
        out = []
        for n in nodes:
            p = prev_map.get(n["id"])
            if p:
                n["change_vs_prev"] = {
                    "tech_difficulty": round(n["tech_difficulty"] - p["tech_difficulty"], 2),
                    "commercialization": round(n["commercialization"] - p["commercialization"], 2),
                    "market_size_b": round(n["market_size_b"] - p["market_size_b"], 2),
                }
            n["children"] = _attach(n.get("children", []))
            out.append(n)
        return out

    return _attach(new_nodes)


def strip_code_fence(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        content = parts[1]
        if content.startswith("json"):
            content = content[4:]
        return content.strip()
    return raw


def main() -> None:
    prev_period = os.environ.get("PREV_PERIOD", "")
    new_period = os.environ.get("NEW_PERIOD", "")
    if not prev_period or not new_period:
        raise ValueError("PREV_PERIOD and NEW_PERIOD env vars required (e.g. 2026-06, 2026-07)")

    snapshots_dir = Path(__file__).parent.parent / "data" / "snapshots"
    prev_path = snapshots_dir / f"{prev_period}.json"
    if not prev_path.exists():
        raise FileNotFoundError(f"Previous snapshot not found: {prev_path}")

    prev_snap = json.loads(prev_path.read_text())
    insights = fetch_insights()

    prev_l1_summary = json.dumps(
        [{k: v for k, v in n.items() if k != "children"} for n in prev_snap["nodes"]],
        ensure_ascii=False, indent=2,
    )

    user = f"""上月快照 ({prev_period}) L1节点摘要：
{prev_l1_summary}

本月行业动态摘要：
{insights}

请输出更新后的 nodes 数组（完整树，包含所有子节点）。
新月份：{new_period}

JSON输出："""

    print(f"Calling LLM for {new_period}...", flush=True)
    resp = client.chat.completions.create(
        model=_model,
        max_tokens=8192,
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": user},
        ],
    )
    raw = strip_code_fence(resp.choices[0].message.content.strip())
    new_nodes = json.loads(raw)

    new_nodes = apply_change_vs_prev(prev_snap["nodes"], new_nodes)

    highlights = []
    prev_l1_map = {n["id"]: n for n in prev_snap["nodes"]}
    for n in new_nodes:
        p = prev_l1_map.get(n["id"])
        if not p:
            continue
        delta_cm = n["commercialization"] - p["commercialization"]
        if abs(delta_cm) >= 0.5:
            highlights.append({
                "node": n["name"],
                "change": "up" if delta_cm > 0 else "down",
                "reason": f"商业化成熟度变化 {delta_cm:+.1f}",
            })

    summary_resp = client.chat.completions.create(
        model=_model,
        max_tokens=400,
        messages=[
            {
                "role": "system",
                "content": "你是具身智能行业投资分析师。用2-3句话总结本月产业链整体动态，聚焦投资含义。",
            },
            {
                "role": "user",
                "content": f"行业动态：{insights[:3000]}\n\n本月总结（2-3句话）：",
            },
        ],
    )

    new_snap = {
        "period": new_period,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "analysis": {
            "summary": summary_resp.choices[0].message.content.strip(),
            "highlights": highlights,
        },
        "nodes": new_nodes,
    }

    errors = validate(new_snap)
    if errors:
        print("VALIDATION ERRORS — aborting:")
        for e in errors:
            print(f"  {e}")
        sys.exit(1)

    out_path = snapshots_dir / f"{new_period}.json"
    out_path.write_text(json.dumps(new_snap, ensure_ascii=False, indent=2))
    print(f"Wrote {out_path} — validation OK", flush=True)


if __name__ == "__main__":
    main()
