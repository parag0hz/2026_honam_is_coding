# Fruit-Harness AI

### 하네스 엔지니어링 기반 이상기후 대비 과수 적산온도·생육 안전 솔루션

전북 노지 과수 농민(61세 최복남 페르소나)을 위한 환상박피(girdling) 시공 타이밍 판단 도우미.
이상기후로 기존 경험칙이 어긋나는 상황에서, 기상/토양/수액 데이터와 과일 사진(Vision LLM)을 바탕으로
"지금 박피해도 되는지"를 판단하고, 위험할 경우 근거와 함께 경고를 보여주는 해커톤 MVP입니다.

> **아키텍처**: React(Vite) 프론트엔드가 FastAPI 백엔드의 REST API를 호출해 (1) 가상 센서 데이터 기반
> 규칙 기반 위험도 판단과 (2) OpenRouter Vision LLM 기반 과일 사진 분석 결과를 받아, 두 결과를 합친
> 최종 권고 문장을 대시보드에 보여줍니다. 판정 문장은 음성(브라우저 내장 TTS)으로도 들을 수 있습니다.

> ⚠️ **가상 데이터 안내**: 실제 하드웨어 센서가 없으므로 `backend/simulator.py` 가 생성하는
> 기온/토양수분/수액지수 등 센서 데이터는 데모용 가상(mock) 데이터입니다. 과일 사진 판독은
> 실제 Vision LLM(OpenRouter) 호출 결과이며, `demo_data/`에는 검증용 실제 사진·데이터를 포함했습니다.

## 기술 스택
- 백엔드: Python + FastAPI + uvicorn
- 프론트엔드: Vite + React (JavaScript) + Tailwind CSS + recharts
- LLM 연동: OpenRouter (`backend/llm_client.py`)
  - 비전 모델: `anthropic/claude-opus-5` → `openai/gpt-5.6-sol` 자동 폴백 체인
  - API 키 미설정/호출 실패/타임아웃 시에도 항상 규칙 기반 판단 결과로 안전하게 폴백

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
`.env.example` 을 참고해 프로젝트 루트에 `.env` 파일을 만드세요.
`OPENROUTER_API_KEY`를 설정하면 실제 Vision LLM 과일 사진 분석이 동작하며,
키가 없어도 나머지 기능(위험도 판단)은 그대로 동작합니다.

## API 엔드포인트
| Method | Path | 설명 |
|---|---|---|
| GET | `/api/health` | 서버 상태 확인 |
| GET | `/api/simulate-sensor` | 가상 기온/토양/수액 데이터 (최근 7일 이력 포함) |
| POST | `/api/risk-assessment` | 센서 데이터를 받아 위험도(0~100)와 판단 근거 반환 |
| POST | `/api/analyze-photo` | 과일 사진 + 환경 판정 결과를 받아 Vision LLM으로 착색 진행도를 판독하고, 최종 권고 문장을 합쳐서 반환 |

## 폴더 구조
backend/ FastAPI 앱, 시뮬레이터, 룰 기반 위험도 엔진, OpenRouter LLM 클라이언트
frontend/ Vite + React 대시보드
src/components/
RiskGauge.jsx 히어로 판정 카드 + 음성 출력
PhotoCheck.jsx 과일 사진 업로드 + 미리보기 + Vision LLM 분석
DetailAccordion.jsx 상세 센서 데이터 (접힌 상태 기본값)
SensorChart.jsx 기온/토양수분/수액지수 시계열 차트
StatusBadges.jsx 센서별 상태 요약 뱃지
demo_data/ 심사 시 직접 테스트해볼 수 있는 실제 과일 사진 + 라벨 데이터
(출처: 전북 장수 사과 당도 품질 데이터, AI Hub · 전라북도)

## 데이터 출처
- 과일 사진 판독 검증용 샘플: **전북 장수 사과 당도 품질 데이터** (AI Hub, 전라북도 제공)
  `demo_data/`에 포함. 비상업적 해커톤 데모 목적으로 사용하였습니다.

## 현재 범위 / 다음 단계
- 구현 완료: 룰 기반 위험도 판단, 가상 센서 데이터, OpenRouter Vision LLM 기반 과일 사진 분석
  (모델 자동 폴백 포함), 음성 출력(TTS), 환경·사진 결과 통합 권고 문장
- 다음 단계(예정): 기상청 공공 API 실시간 연동, `caution`/`danger` 단계별 최종 문장 세분화,
  전북 농가 실증 파일럿