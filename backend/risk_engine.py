"""환상박피(girdling) 시공 위험도 판단 로직.

현재는 규칙 기반(rule-based)으로만 판단한다. 최근 3일 평균기온과 적산온도
임계치를 핵심 기준으로 삼고, 수액/토양수분 등을 보조 기준으로 사용한다.

include_llm_explanation=True 로 호출하면 llm_client 를 통해 자연어 설명을
추가로 붙일 수 있도록 함수 시그니처를 미리 열어두었다 (지금은 기본 False).
"""
from typing import List, Optional

from pydantic import BaseModel, Field

from . import llm_client


class SensorSnapshot(BaseModel):
    air_temp_c: float = Field(default=14.0, description="현재 기온(°C)")
    soil_temp_c: float = Field(default=11.0, description="토양 온도(°C)")
    soil_moisture_pct: float = Field(default=40.0, description="토양 수분(%)")
    sap_flow_index: float = Field(default=55.0, description="수액 흐름 지수(0~100)")
    humidity_pct: float = Field(default=60.0, description="상대 습도(%)")
    recent_3day_avg_temp_c: float = Field(default=13.0, description="최근 3일 평균 기온(°C)")
    accumulated_temperature: float = Field(default=250.0, description="적산온도(기준 5°C 누적)")


class RiskAssessmentResult(BaseModel):
    risk_score: int
    risk_level: str
    risk_label: str
    reasons: List[str]
    recommended_action: str
    explanation: Optional[str] = None


def assess_risk(sensor: SensorSnapshot, include_llm_explanation: bool = False) -> RiskAssessmentResult:
    score = 0
    reasons: List[str] = []

    # 1. 고온/폭염 위험 (가장 치명적)
    if sensor.air_temp_c >= 32.0 or sensor.recent_3day_avg_temp_c >= 30.0:
        score += 60
        reasons.append("폭염 특보 수준의 고온으로 나무 스트레스가 극심합니다. 박피 시 고사 위험이 매우 높습니다.")

    # 2. 저온 위험
    if sensor.recent_3day_avg_temp_c < 5:
        score += 40
        reasons.append("최근 3일 평균기온이 5°C 미만으로 저온·동해 위험이 있습니다.")

    # 3. 적산온도(누적 생육량) 
    if sensor.accumulated_temperature < 100:
        score += 30
        reasons.append("적산온도가 부족해 수액 이동이 활발하지 않습니다 (너무 이른 시공).")
    elif sensor.accumulated_temperature > 700:
        score += 20
        reasons.append("적산온도가 이미 높아 박피 적기가 지났을 가능성이 있습니다.")

    # 4. 수액 흐름 지수 (나무의 활력도)
    if sensor.sap_flow_index < 30:
        score += 45
        reasons.append("수액 흐름이 원활하지 않아 박피 상처 회복이 불가능할 수 있습니다.")

    # 5. 토양 수분 스트레스
    if sensor.soil_moisture_pct < 20:
        score += 25
        reasons.append("토양 건조 상태가 심각하여 박피 시 수분 부족으로 고사할 수 있습니다.")
    elif sensor.soil_moisture_pct > 85:
        score += 15
        reasons.append("토양 과습으로 뿌리 호흡이 불량합니다.")

    # 6. 급격한 기온 변화
    if abs(sensor.air_temp_c - sensor.recent_3day_avg_temp_c) > 10:
        score += 15
        reasons.append("최근 평균 대비 기온 변화가 급격해 나무가 스트레스 상태입니다.")

    risk_score = min(score, 100)

    if risk_score < 35:
        risk_level, risk_label = "safe", "안전"
        recommended_action = "현재 환경 조건에서는 박피를 고려할 수 있습니다. 실제 처치 여부와 방법은 현장 나무 상태를 확인한 뒤 결정하세요."
    elif risk_score < 65:
        risk_level, risk_label = "caution", "주의"
        recommended_action = "위험 요인이 있습니다. 시공 전 1~2일 더 관찰 후 결정하는 것을 권장합니다."
    else:
        risk_level, risk_label = "danger", "위험"
        recommended_action = "지금은 박피 시공을 절대 피하고 기상 상황이 안정될 때까지 기다리세요."

    if not reasons:
        reasons.append("현재 기후 및 수액 데이터 상 특이 위험 요인이 감지되지 않았습니다.")

    result = RiskAssessmentResult(
        risk_score=risk_score,
        risk_level=risk_level,
        risk_label=risk_label,
        reasons=reasons,
        recommended_action=recommended_action,
    )

    if include_llm_explanation:
        prompt = llm_client.build_risk_explanation_prompt(sensor.dict(), result.dict())
        result.explanation = llm_client.generate_explanation(prompt)

    return result