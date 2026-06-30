"""
One-time script: generate the initial 2026-06.json seed snapshot.
Calls claude-opus-4-7 once per L1 node to generate its full supply-chain subtree.
Merges into data/snapshots/2026-06.json.

Usage:
  cd /Users/zhangrui1/embodied-ai-landscape
  ANTHROPIC_API_KEY=... python scripts/seed_tree.py
"""
import json, os, sys, time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import anthropic
from validate_snapshot import validate

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM = """你是具身智能产业链的专业投资研究员。
你的任务是为给定的产业节点生成完整的多层供应链树，深入到原材料层级。

评分标准：
- tech_difficulty (1-10): 技术壁垒高低。10=前沿研究难以复现，1=成熟商品化技术。
- commercialization (1-10): 商业化成熟度。10=大规模量产有盈利，1=实验室原型。
- market_size_b: 全球可寻址市场规模（十亿美元，TAM口径）。

Layer 分类规则：
- 上游: 零部件、材料、传感器等基础供给层
- 中游: 集成制造、算法、平台等
- 下游: 应用、场景集成等
- 原材料: 矿产、化工原料、基础化学品等最底层

子节点要求：
- 每个非原材料节点至少有3个子节点
- 原材料节点（layer=原材料）是叶节点，children=[]
- 子节点id使用英文snake_case，全局唯一（在id前加父节点缩写前缀）
- 树深度跟随实际供应链，不要人为截断
- companies: 该细分领域全球TOP 3-5企业（中英文均可）

输出格式：严格JSON，只输出节点对象，不要任何解释文字。"""

L1_NODES = [
    {"id": "chips",          "name": "芯片/算力",     "layer": "上游"},
    {"id": "sensors",        "name": "传感器",         "layer": "上游"},
    {"id": "actuators",      "name": "执行器/电机",    "layer": "上游"},
    {"id": "reducers",       "name": "精密减速器",     "layer": "上游"},
    {"id": "dexterous",      "name": "灵巧手",         "layer": "中游"},
    {"id": "simulation",     "name": "仿真平台",       "layer": "中游"},
    {"id": "vla",            "name": "VLA/具身AI模型", "layer": "中游"},
    {"id": "motion_control", "name": "运控系统",       "layer": "中游"},
    {"id": "humanoid",       "name": "人形整机",       "layer": "中游"},
    {"id": "data_collection","name": "数据采集/标注",  "layer": "中游"},
    {"id": "industrial",     "name": "工业场景集成",   "layer": "下游"},
    {"id": "service",        "name": "商业/服务场景",  "layer": "下游"},
    {"id": "medical",        "name": "医疗/特种场景",  "layer": "下游"},
]

NODE_CONTEXT = {
    "chips": "涵盖：GPU/NPU/SoC、边缘推理芯片、算力基础设施。追溯到半导体制造、晶圆、硅矿等。",
    "sensors": "涵盖：视觉(RGB/深度/事件)、触觉、力觉、IMU、激光雷达。追溯到CMOS、光学镜头、MEMS工艺、原材料。",
    "actuators": "涵盖：空心杯电机、无框力矩电机、直线电机。追溯到NdFeB、硅钢、漆包线、铜矿、稀土矿。",
    "reducers": "涵盖：谐波减速器、RV减速器、行星减速器。追溯到轴承钢、特种钢材、精密机加工。",
    "dexterous": "涵盖：驱动系统、触觉传感、结构材料、控制板。追溯到稀土、铝合金、碳纤维、铜、聚酰亚胺等。",
    "simulation": "涵盖：物理引擎、渲染引擎、Sim2Real工具链、数字孪生平台。追溯到GPU计算、软件授权。",
    "vla": "涵盖：基础模型、端到端控制、具身数据、强化学习框架。相对较少硬件供应链，重点在算力和数据。",
    "motion_control": "涵盖：实时控制器、伺服驱动、运动规划算法。追溯到FPGA、DSP、功率半导体、PCB。",
    "humanoid": "涵盖：系统集成、结构设计、整机装配。追溯到铝合金铸件、碳纤维、钛合金、电子组装。",
    "data_collection": "涵盖：遥操作设备、动捕系统、数据标注平台。追溯到光学元件、IMU、服务器。",
    "industrial": "涵盖：汽车工厂、电子制造、物流分拣等应用场景集成。相对浅的供应链，重在系统集成。",
    "service": "涵盖：酒店/零售/家庭服务机器人。追溯到整机采购和软件定制。",
    "medical": "涵盖：手术机器人、康复机器人。追溯到医疗级材料、传感器、监管合规。",
}


def strip_code_fence(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        # parts[1] is the content inside the first code fence
        content = parts[1]
        if content.startswith("json"):
            content = content[4:]
        return content.strip()
    return raw


def generate_subtree(node: dict) -> dict:
    ctx = NODE_CONTEXT.get(node["id"], "")
    user = f"""请为以下L1节点生成完整供应链子树（含该节点本身）：

节点信息：
- id: {node["id"]}
- name: {node["name"]}
- layer: {node["layer"]}

补充背景：{ctx}

要求：
1. 返回完整节点对象（含id/name/layer/tech_difficulty/commercialization/market_size_b/companies/investment_thesis/children）
2. companies 字段为字符串数组，该细分领域全球TOP 3-5企业
3. children 递归到原材料层（layer=原材料，children=[]）
4. 严格JSON，不要任何markdown代码块或解释文字

JSON输出："""

    resp = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=8192,
        system=SYSTEM,
        messages=[{"role": "user", "content": user}],
    )
    raw = resp.content[0].text.strip()
    return json.loads(strip_code_fence(raw))


def count_nodes(node: dict) -> int:
    return 1 + sum(count_nodes(c) for c in node.get("children", []))


def main():
    out_path = Path("data/snapshots/2026-06.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    nodes = []
    for l1 in L1_NODES:
        print(f"Generating subtree for {l1['id']}...", flush=True)
        try:
            node = generate_subtree(l1)
            total = count_nodes(node)
            nodes.append(node)
            print(f"  ✓ {l1['id']}: {len(node.get('children', []))} L2 children, {total} total nodes", flush=True)
        except Exception as e:
            print(f"  ✗ {l1['id']} FAILED: {e}", flush=True)
            raise
        time.sleep(1)

    snapshot = {
        "period": "2026-06",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "analysis": {
            "summary": (
                "2026年6月具身智能产业进入关键量产窗口期。特斯拉Optimus Generation 3"
                "开始小批量出厂，带动整机及核心零部件（无框电机、谐波减速器）需求验证。"
                "VLA端到端控制在工厂场景展示突破性结果，但距离大规模商业化仍需12-18个月。"
                "原材料端稀土价格因需求预期上涨约8%。"
            ),
            "highlights": [],
        },
        "nodes": nodes,
    }

    out_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2))
    print(f"\nWrote {out_path}", flush=True)

    errors = validate(snapshot)
    if errors:
        print("VALIDATION ERRORS:")
        for e in errors:
            print(f"  {e}")
        sys.exit(1)
    else:
        print("Validation: OK")


if __name__ == "__main__":
    main()
