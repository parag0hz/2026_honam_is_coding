"""가상 센서/기상 데이터 시뮬레이터.

주의: 이 프로젝트는 실제 하드웨어 센서가 없으므로, 이 모듈이 생성하는 모든 값은
데모/개발용 가상(mock) 데이터입니다. 실제 농장 데이터가 아닙니다.

seed 를 고정하면 항상 동일한 데이터를 재현할 수 있고, seed 를 바꾸면 다른
시나리오(예: 안전/위험 케이스)를 손쉽게 만들어낼 수 있습니다.
"""
import random
from datetime import datetime, timedelta
from typing import Dict, List

DEFAULT_SEED = 42
HISTORY_DAYS = 7


def _daily_history(rng: random.Random, days: int = HISTORY_DAYS) -> List[Dict]:
    """최근 N일치 가상 일별 기록(기온/토양수분/수액지수)을 생성한다."""
    history = []
    today = datetime.now().date()
    base_temp = rng.uniform(8, 16)
    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)
        day_temp = round(base_temp + rng.uniform(-3, 3), 1)
        history.append(
            {
                "date": date.isoformat(),
                "air_temp_c": day_temp,
                "soil_moisture_pct": round(rng.uniform(25, 60), 1),
                "sap_flow_index": round(rng.uniform(20, 80), 1),
            }
        )
    return history


def generate_sensor_data(seed: int = DEFAULT_SEED) -> Dict:
    """재현 가능한 가상 기상/토양/수액 데이터를 생성해 dict 로 반환한다."""
    rng = random.Random(seed)
    history = _daily_history(rng)

    recent_temps = [d["air_temp_c"] for d in history[-3:]]
    recent_3day_avg_temp_c = round(sum(recent_temps) / len(recent_temps), 1)

    # 단순화된 적산온도(GDD): 기준온도 5도를 초과하는 일교차만 누적
    accumulated_temperature = round(
        sum(max(d["air_temp_c"] - 5, 0) for d in history) * 10, 1
    )

    latest = history[-1]

    return {
        "timestamp": datetime.now().isoformat(),
        "air_temp_c": latest["air_temp_c"],
        "soil_temp_c": round(latest["air_temp_c"] - rng.uniform(1, 4), 1),
        "soil_moisture_pct": latest["soil_moisture_pct"],
        "sap_flow_index": latest["sap_flow_index"],
        "humidity_pct": round(rng.uniform(40, 85), 1),
        "recent_3day_avg_temp_c": recent_3day_avg_temp_c,
        "accumulated_temperature": accumulated_temperature,
        "history": history,
    }
