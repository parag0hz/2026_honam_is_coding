# Fruit-Harness AI

전북 노지 과수 농민(61세 최복남 페르소나)을 위한 환상박피(girdling) 시공 타이밍 판단 도우미.
이상기후로 기존 경험칙이 어긋나는 상황에서, 기상/토양/수액 데이터를 바탕으로 "지금 박피해도 되는지"를
판단하고 위험할 경우 근거와 함께 경고를 보여주는 해커톤 MVP입니다.

> **아키텍처**: React(Vite) 프론트엔드가 FastAPI 백엔드의 REST API를 호출해 가상 센서 데이터와
> 규칙 기반 위험도 판단 결과를 받아 대시보드로 보여줍니다.

> ⚠️ **가상 데이터 안내**: 실제 하드웨어 센서가 없으므로 `backend/simulator.py` 가 생성하는
> 기온/토양수분/수액지수 등 모든 센서 데이터는 데모용 가상(mock) 데이터입니다.

## 기술 스택
- 백엔드: Python + FastAPI + uvicorn
- 프론트엔드: Vite + React (JavaScript) + Tailwind CSS + recharts
- LLM 연동: OpenRouter (`backend/llm_client.py`, 현재는 키 미설정으로 폴백 메시지 반환)

## 실행 방법

### 백엔드 (프로젝트 루트에서 실행)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
uvicorn backend.main:app --reload
```
기본 주소: http://127.0.0.1:8000 (API 문서: http://127.0.0.1:8000/docs)

### 프론트엔드
```powershell
cd frontend
npm install
npm run dev
```
기본 주소: http://localhost:5173 (백엔드 CORS 설정이 이 포트를 허용합니다)

### 환경변수
`.env.example` 을 참고해 프로젝트 루트에 `.env` 파일을 만드세요 (OpenRouter/기상청 API 키, 지금은 선택사항).

## API 엔드포인트
| Method | Path | 설명 |
|---|---|---|
| GET | `/api/health` | 서버 상태 확인 |
| GET | `/api/simulate-sensor` | 가상 기온/토양/수액 데이터 (최근 7일 이력 포함) |
| POST | `/api/risk-assessment` | 센서 데이터를 받아 위험도(0~100)와 판단 근거 반환 |

## 폴더 구조
```
backend/    FastAPI 앱, 시뮬레이터, 룰 기반 위험도 엔진, LLM 클라이언트
frontend/   Vite + React 대시보드 (RiskGauge, SensorChart, InputForm)
```

## 현재 범위 / 다음 단계
- 지금 단계는 룰 기반 위험도 판단 + 가상 데이터까지만 구현되어 있습니다.
- 다음 단계(예정): 기상청 공공 API 실제 연동, OpenRouter 자연어 설명 연동, 음성 인터페이스.
