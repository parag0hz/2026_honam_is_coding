"""Fruit-Harness AI FastAPI 백엔드 엔트리포인트.

실행: (프로젝트 루트에서) uvicorn backend.main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import simulator
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
