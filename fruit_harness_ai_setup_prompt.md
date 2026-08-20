# Fruit-Harness AI — VS Code Copilot 초기 세팅 프롬프트

> 사용법: VS Code에서 새 폴더를 연 뒤, Copilot Chat(Agent 모드 권장)에 아래 프롬프트를 통째로 붙여넣으세요.
> 자동 모델 사용 시에도 그대로 붙여넣으면 됩니다.

## ⚠️ 대회 당일 전에 꼭 확인할 것
Node/npm은 대회 노트북에 기본 설치되어 있지 않습니다 (참가자 본인 설치 허용됨).
`npm create vite@latest` + `npm install` 이 대회장 네트워크에서 몇 분 안에 끝나는지,
가능하면 대회 시작 전 미리 한 번 로컬에서 리허설해보는 걸 강력 권장합니다.
현장에서 설치가 오래 걸리거나 막히면 즉시 백업 플랜(옵션 A: CDN 기반 순수 HTML/JS)으로
전환할 수 있게, 이 프롬프트를 기억해두거나 미리 저장해두세요.

---

## 프롬프트

```
너는 지금부터 해커톤(제한시간 10시간) MVP를 함께 만드는 페어 프로그래머야.
아래 프로젝트 컨텍스트와 제약을 반드시 지키면서 코드를 작성해줘.

## 프로젝트 개요
- 이름: Fruit-Harness AI
- 타겟 사용자: 전북 지역 노지 과수 농민(61세, 최복남 페르소나) — 스마트폰/키보드 조작이 서툴 수 있음
- 핵심 문제: 이상기후로 환상박피(girdling) 시공 타이밍을 잘못 잡으면 나무가 고사해 3~5년 소득이 끊긴다.
  기존 30년 경험칙이 이상기후 때문에 더 이상 안 맞는다.
- 핵심 기능: 기상/토양/수액 데이터를 바탕으로 "지금 박피해도 되는지"를 판단하고,
  위험할 경우 명확한 근거와 함께 경고(guardrail)를 준다.
- 이 앱은 실제 센서가 없으므로 가상 데이터 시뮬레이터로 대체한다. 이 사실을 코드 주석과 README에 명시해줘.

## 기술 스택
- 백엔드: Python + FastAPI (uvicorn) — 노트북에 Python이 기본 설치되어 있으므로 이걸 씀
- 프론트엔드: Node/npm 기반 Vite + React (TypeScript 아님, JS로) + Tailwind CSS, 차트는 recharts 사용
- 데이터: 목데이터 JSON 시뮬레이터 + (여유 있으면) 기상청 공공 API 실제 연동
- LLM 연동: OpenRouter API를 httpx로 호출하는 별도 모듈로 분리 (백엔드 어디서든 갈아끼우기 쉽게)

## 지금 해줘야 할 것 (초기 스캐폴딩 — 1단계만)
1. 아래 폴더 구조를 만들어줘:
   /backend
     main.py          # FastAPI 앱, CORS 설정 포함 (프론트 dev 서버 포트 허용)
     simulator.py      # 가상 센서/기상 데이터 생성기 (재현 가능하게 seed 고정)
     risk_engine.py    # 위험도 계산 로직 (룰 기반, 나중에 LLM 설명으로 보강할 자리 남겨둠)
     llm_client.py      # OpenRouter 호출 래퍼 (API 키는 .env에서 읽기, 실패 시 폴백 메시지 반환)
     requirements.txt
   /frontend
     (Vite + React 스캐폴딩: `npm create vite@latest frontend -- --template react` 로 생성하는 구조 그대로)
     src/App.jsx           # 대시보드 레이아웃
     src/components/RiskGauge.jsx     # 위험도 게이지
     src/components/SensorChart.jsx   # 근거 데이터 차트 (recharts)
     src/components/InputForm.jsx     # 상태 입력 폼
     src/api.js             # 백엔드 fetch 래퍼
     tailwind.config.js, postcss.config.js
   .env.example          # OPENROUTER_API_KEY=, WEATHER_API_KEY= 등 플레이스홀더만
   README.md             # 실행 방법(백엔드/프론트 각각), 가상 데이터 사용 명시, 아키텍처 한 줄 설명

2. API 엔드포인트 3개만 먼저 만들어줘 (나중에 확장):
   - GET  /api/simulate-sensor  → 가상 수액/토양/기온 데이터 JSON 반환
   - POST /api/risk-assessment  → 입력 데이터 받아 위험도(0~100)와 이유(rule 기반 텍스트) 반환
   - GET  /api/health           → 서버 상태 확인용

3. risk_engine.py 는 처음엔 간단한 룰(예: 최근 3일 평균기온 + 적산온도 임계치)로만 판단하게 하고,
   나중에 llm_client.py 결과를 합쳐서 자연어 설명을 붙일 수 있도록 함수 시그니처를 미리 열어둬.

4. 프론트엔드는 페이지 열자마자:
   - "가상 센서 데이터 불러오기" 버튼 → /api/simulate-sensor 호출 → 값 표시 (SensorChart)
   - "위험도 판단하기" 버튼 → /api/risk-assessment 호출 → RiskGauge 색상(초록/노랑/빨강) + 경고 문구 표시
   이 두 동작만 확실히 되게 만들어줘. Tailwind로 기본 카드/여백/타이포만 정리해도 충분히 깔끔해 보이게.

5. 각 파일 만들 때마다 짧게 뭘 만들었는지 알려주고, 다음 단계로 넘어가기 전에
   백엔드는 `uvicorn backend.main:app --reload`, 프론트는 `npm run dev` 로 각각 바로 실행 가능한 상태인지 확인해줘.
   두 서버가 CORS 문제 없이 서로 통신되는지도 확인해줘.

## 지금은 하지 마
- OpenRouter 실제 API 호출 테스트 (키 세팅 전이므로 llm_client.py는 함수만 준비하고 mock 응답 반환하게)
- 음성 인터페이스, 이미지 분석은 이번 단계에서 제외 (나중에 별도 요청)
- 인증/로그인 기능 없음 (해커톤 데모용, 불필요)

준비되면 폴더 구조부터 만들고, 파일별로 순서대로 진행해줘.
```

---

## 다음 단계 (P0 완성 후 순서대로 요청)
1. 기상청 공공 API 실제 연동 + 실패 시 시뮬레이터 폴백
2. `llm_client.py`에 실제 OpenRouter 호출 연결, `risk_engine.py` 결과에 자연어 설명 붙이기
3. (여유 있으면) Web Speech API로 음성 질문 → 텍스트 변환 → 같은 API 재사용
4. PPT/발표용 스크린샷을 위해 위험도 게이지가 "정상"과 "위험" 두 케이스를 보여줄 수 있는 테스트 시나리오 값 준비
