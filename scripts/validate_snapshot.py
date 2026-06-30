"""Validate a snapshot JSON against the expected schema."""
import sys, json
from typing import Any

LAYERS = {"上游", "中游", "下游", "原材料"}

REQUIRED_L1_IDS = {
    "chips", "sensors", "actuators", "reducers", "dexterous",
    "simulation", "vla", "motion_control", "humanoid",
    "data_collection", "industrial", "service", "medical",
}

def _validate_node(n: Any, path: str) -> list[str]:
    errors = []
    for field in ("id", "name", "layer", "tech_difficulty", "commercialization",
                  "market_size_b", "investment_thesis"):
        if field not in n:
            errors.append(f"{path}: missing field '{field}'")
    if n.get("layer") not in LAYERS:
        errors.append(f"{path}: layer '{n.get('layer')}' not in {LAYERS}")
    for num_field in ("tech_difficulty", "commercialization"):
        v = n.get(num_field)
        if isinstance(v, (int, float)) and not (1 <= v <= 10):
            errors.append(f"{path}.{num_field}={v} out of [1,10]")
    for child in n.get("children", []):
        errors.extend(_validate_node(child, f"{path}.{child.get('id','?')}"))
    return errors


def validate(snapshot: dict) -> list[str]:
    errors = []
    for field in ("period", "generated_at", "analysis", "nodes"):
        if field not in snapshot:
            errors.append(f"root: missing field '{field}'")
    found = {n.get("id") for n in snapshot.get("nodes", [])}
    missing = REQUIRED_L1_IDS - found
    if missing:
        errors.append(f"root.nodes: missing L1 ids {missing}")
    for node in snapshot.get("nodes", []):
        errors.extend(_validate_node(node, node.get("id", "?")))
    return errors


if __name__ == "__main__":
    path = sys.argv[1]
    data = json.loads(open(path).read())
    errs = validate(data)
    if errs:
        print("VALIDATION ERRORS:")
        for e in errs:
            print(f"  {e}")
        sys.exit(1)
    print(f"OK — {path} is valid")
