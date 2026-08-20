"""Fruit-Harness AI FastAPI 백엔드 엔트리포인트.

실행: (프로젝트 루트에서) uvicorn backend.main:app --reload
"""
import base64
import json
from typing import Any, Dict

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from . import llm_client, simulator
from .risk_engine import RiskAssessmentResult, SensorSnapshot, assess_risk

app = FastAPI(title="Fruit-Harness AI API")

# 프론트엔드 Vite 개발 서버(기본 포트 5173)에서의 요청만 허용한다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/simulate-sensor")
def simulate_sensor(seed: int = simulator.DEFAULT_SEED) -> dict:
    """가상 수액/토양/기온 데이터를 반환한다 (실제 센서 없음, mock 데이터)."""
    return simulator.generate_sensor_data(seed=seed)


@app.post("/api/risk-assessment", response_model=RiskAssessmentResult)
def risk_assessment(payload: SensorSnapshot) -> RiskAssessmentResult:
    """입력된 센서 데이터를 바탕으로 박피 시공 위험도(0~100)와 근거를 반환한다."""
    return assess_risk(payload)


_COLORING_READY_STAGES = {"진행중", "완숙"}


def _build_final_message(environment_verdict: Dict[str, Any], coloring_result: Dict[str, Any]) -> str:
    """환경 위험도 판단과 착색 판독 결과를 합쳐 최종 권고 문장 하나를 만든다."""
    if coloring_result.get("is_fallback"):
        return "사진 판독에 실패했습니다. 사진을 다시 찍어 주세요."

    env_is_safe = environment_verdict.get("risk_level") == "safe"
    coloring_ready = coloring_result.get("stage") in _COLORING_READY_STAGES

    if env_is_safe and coloring_ready:
        return "지금 박피하기 좋은 시기예요."
    if env_is_safe and not coloring_ready:
        return "환경은 괜찮지만 착색이 아직이에요. 착색 상태를 다시 확인한 뒤 판단하세요."
    if not env_is_safe and coloring_ready:
        return "착색은 됐지만 지금은 환경이 위험해요. 날씨가 안정되면 진행하세요."
    return "환경도 위험하고 착색도 안 되었어요. 박피를 미루세요."


@app.post("/api/analyze-photo")
async def analyze_photo(file: UploadFile = File(...), environment_result: str = Form(...)) -> dict:
    """과일 사진을 업로드받아 착색 진행도를 판독하고, 환경 위험도 판단과 합쳐 최종 권고 문장을 반환한다."""
    try:
        environment_verdict = json.loads(environment_result)
    except (json.JSONDecodeError, TypeError):
        environment_verdict = {}
    if not isinstance(environment_verdict, dict):
        environment_verdict = {}

    image_bytes = await file.read()
    image_base64 = base64.b64encode(image_bytes).decode("ascii")

    coloring_result = llm_client.analyze_fruit_photo(
        image_base64, mime_type=file.content_type or "image/jpeg"
    )
    final_message = _build_final_message(environment_verdict, coloring_result)

    return {
        "environment_verdict": environment_verdict,
        "coloring_result": coloring_result,
        "final_message": final_message,
    }
