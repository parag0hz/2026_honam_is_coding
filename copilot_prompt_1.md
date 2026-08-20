https://github.com/parag0hz/2026_honam_is_coding.git
깃허브는 여기로 연동해서 작업해줘 혼자 작업하니까 깃 플로우까지는 사용하지 않아도 되는데 그래도 어느정도는 해줬으면 좋겠네


---

지금 만든 대시보드 UI를 아래 원칙으로 리뉴얼해줘.

## 핵심 원칙
사용자는 61세 농민이고, 숫자를 직접 입력하지 않는다.
화면을 열면 "지금 박피해도 되는지"에 대한 답이 이미 나와 있어야 한다.

## 변경 사항

1. 자동 판정으로 전환
   - 페이지가 로드되면 useEffect 등으로 /api/simulate-sensor 를 자동 호출하고,
     그 결과를 바로 /api/risk-assessment 에 넘겨서 자동으로 판정까지 실행해줘.
   - "가상 센서 데이터 불러오기", "위험도 판단하기" 버튼은 없애고,
     대신 화면 우측 상단에 작은 "새로고침" 아이콘 버튼 하나만 남겨서
     수동으로 다시 판정하고 싶을 때만 누르게 해줘.

2. 히어로 판정 카드를 화면 최상단, 가장 크게
   - 배경색 전체를 위험도에 따라 초록/노랑/빨강 계열로 채우는 큰 카드 (화면 상단 60% 이상 차지)
   - 가운데 아주 큰 글씨(예: text-5xl~6xl)로 "지금 박피해도 안전해요" / "오늘은 박피를 피하세요" 같은
     짧고 명확한 한 문장 (숫자 위험도는 이 문장 아래 작게, 참고용으로만)
   - 그 아래 한 줄로 핵심 이유만 간단히 (예: "폭염이 계속돼서 위험해요")
   - RiskGauge 컴포넌트를 이 히어로 카드 스타일로 다시 만들어줘 (기존 링 게이지 대신 풀스크린 카드)

3. 상세 데이터는 접어두기
   - 기존 "현재 상태 확인/수정" 폼(기온/토양온도/토양수분/수액흐름지수/상대습도/적산온도 6개 입력)은
     삭제하지 말고 화면 하단에 "상세 데이터 보기" 라는 접힌 아코디언/토글 안으로 이동해줘.
   - 기본 상태는 접혀 있고, 클릭해야 펼쳐지게. 펼쳤을 때는 지금처럼 수정 가능한 폼 그대로 둬도 됨
     (심사위원이 판단 근거를 확인할 수 있어야 하니 기능 자체는 유지).
   - SensorChart(꺾은선 그래프)도 이 아코디언 안으로 같이 이동해줘.
   - 아코디언이 접혀 있을 때는 대신 아이콘 3개짜리 요약 뱃지만 히어로 카드 바로 아래 작게 보여줘
     (예: 🌡️ 기온 정상 / 💧 토양수분 정상 / 🌿 수액지수 주의 — 각 항목 rule 기반으로 정상/주의/위험 판정)

4. 음성으로 듣기 버튼 추가
   - 히어로 카드 안에 "🔊 음성으로 듣기" 버튼을 추가해줘.
   - 브라우저 내장 SpeechSynthesis API(window.speechSynthesis)를 사용해서,
     버튼을 누르면 히어로 카드의 판정 문장 + 이유를 한국어 음성(lang: 'ko-KR')으로 읽어주게 해줘.
   - 별도 API 호출이나 서버 로직 없이 프론트엔드에서만 처리되면 됨.

## 하지 마
- 백엔드 API 엔드포인트나 risk_engine.py 로직은 건드리지 마 (그대로 재사용)
- 새로운 npm 패키지 설치 필요하면 설치 전에 먼저 알려줘

컴포넌트별로 순서대로 수정하면서, 각 단계마다 뭘 바꿨는지 짧게 알려줘.


---

"착색 상태 확인하기" 기능을 추가할 거야. 환경 위험도(기존 히어로 카드)와는 별개로,
사용자가 과일 사진을 올리면 Vision LLM이 착색 진행도를 판독하고,
그 결과를 기존 환경 판정과 합쳐서 최종 권고 문장 하나로 보여주는 흐름을 만들어줘.

## 백엔드: 실제 OpenRouter Vision 모델 연동

1. llm_client.py 에 analyze_fruit_photo(image_base64: str) 함수를 추가해줘.
   - .env의 OPENROUTER_API_KEY를 읽어서 실제로 OpenRouter API(https://openrouter.ai/api/v1/chat/completions)를
     httpx로 호출해줘. 이미지 인식 가능한 모델을 사용해줘 (예: "google/gemini-2.0-flash-exp:free" 같은
     비전 지원 모델 — 사용 가능한 비전 모델 중 하나를 골라서 model 변수로 상수화해줘. 나중에 바꾸기 쉽게).
   - 요청 메시지는 이미지(base64 data URL 형식)와 함께, 아래 내용을 반드시 JSON으로만 응답하도록 프롬프트를 짜줘:
     {
       "coloring_percent": 0~100 사이 정수,   // 착색 진행도 추정치
       "stage": "미숙/진행중/완숙" 중 하나,
       "comment": "농민이 이해하기 쉬운 한글 한 문장 설명"
     }
   - 응답 파싱 실패, API 에러, 타임아웃(10초) 시 아래 폴백 값을 반환해줘 (에러를 던지지 말고 항상 이 형태로 반환):
     {"coloring_percent": null, "stage": "판독 실패", "comment": "사진을 다시 찍어주세요", "is_fallback": true}
   - API 키가 .env에 없거나 빈 값이면 호출 자체를 하지 말고 바로 폴백을 반환해줘.

2. main.py 에 엔드포인트 추가:
   POST /api/analyze-photo
   - multipart/form-data로 이미지 파일을 받아서(UploadFile), base64로 인코딩 후 analyze_fruit_photo() 호출
   - 응답에 방금 계산한 결과와 함께, 최근 환경 위험도 판정 결과(risk_engine 결과, 프론트에서 같이 넘겨받거나
     세션에 캐시해둔 값)를 합쳐서 최종 권고 문장을 만드는 로직을 추가해줘.
   - 합치는 규칙 예시 (간단한 rule로): 
     - 환경 위험 + 착색 미숙 → "환경도 위험하고 착색도 안 됐어요. 박피를 미루세요"
     - 환경 안전 + 착색 미숙 → "환경은 괜찮지만 착색이 아직이에요. {n}일 정도 더 기다려보세요"
     - 환경 안전 + 착색 진행중/완숙 → "지금 박피하기 좋은 시기예요"
     - 환경 위험 + 착색 진행중/완숙 → "착색은 됐지만 지금은 환경이 위험해요. 날씨가 안정되면 진행하세요"
   - 최종 응답 JSON에 { environment_verdict, coloring_result, final_message } 형태로 다 담아서 반환해줘.

## 프론트엔드

3. 히어로 카드 바로 아래에 "📸 착색 상태 확인하기" 버튼을 추가해줘.
   - 클릭 시 파일 입력(input type="file" accept="image/*" capture="environment")을 열어서
     모바일에서는 카메라가 바로 뜨게, 데스크탑에서는 파일 선택창이 뜨게 해줘.
   - 사진을 선택하면 로딩 스피너를 보여주면서 /api/analyze-photo 로 업로드하고,
     결과를 받으면 히어로 카드의 문장을 final_message로 교체해줘 (기존 환경 전용 문장 대신).
   - 착색 진행도(coloring_percent)는 히어로 카드 아래에 작은 진행바(progress bar)로 표시해줘.
   - is_fallback이 true로 오면 "사진 판독에 실패했어요. 사진을 다시 찍어주세요" 라고 안내하고
     기존 환경 전용 판정 문장으로 다시 돌아가게 해줘 (에러 나도 화면이 깨지지 않게).

## 하지 마
- 기존 히어로 카드/환경 판정 로직은 그대로 두고, 착색 결과가 들어오면 "덮어쓰는" 방식으로만 확장해줘
- 이미지 리사이즈/압축 최적화는 지금 단계에서 생략 (시간 절약, 나중에 필요하면 추가 요청)

백엔드 함수부터 만들고, curl이나 테스트 스크립트로 실제 OpenRouter 응답이 오는지
먼저 확인한 다음에 프론트엔드 연결로 넘어가줘.

openrouter는 최신 프론티어 모델 gpt5.6 sol, claude fable5, opus5, deepseek v4 pro, kimi 이런거 사용해줘

---

현재 VS Code에서 열려 있는 프로젝트 전체를 분석해줘.

프로젝트 목적은 다음과 같다.

# Fruit-Harness AI / 과수 하네스 AI
기후위기로 인해 노지 과수의 착색·성숙 시기가 불규칙해지는 상황에서,
환상박피(Girdling) 같은 고위험 재배 처치를 하기 전에
기상 데이터 + 토양 수분 + 수액 흐름 + 나무 둘레 변화 + 과실 상태를 종합하여
"지금 박피해도 안전한가?"를 판단하는 AI 의사결정 보조 시스템이다.

핵심은 단순 AI 챗봇이 아니라 다음 구조다.

1. Sensor Layer

- 기온
- 토양 수분
- 수액 흐름 지수
- 나무 둘레
- 과실 착색도
- 일조량
- 누적 적산온도
2. Risk Engine

- 센서 데이터를 이용한 나무 세력 평가
- 폭염/고온 스트레스 평가
- 박피 위험도 계산
- 데이터가 부족하거나 비정상적인 경우 처치 보류
3. AI Guardrail

- LLM은 최종 안전 판정을 직접 결정하면 안 된다.
- 위험도 계산과 안전 차단은 deterministic rule engine이 우선한다.
- LLM은 계산 결과를 농민이 이해하기 쉬운 말로 설명하는 역할을 한다.
- 근거 없는 숫자나 확률을 생성하면 안 된다.
4. OpenRouter

- LLM 설명/추론 보조
- 추후 vision 모델 연동
- 추후 음성 질의 응답
5. Weather

- 현재는 mock 데이터라도 좋지만 실제 기상청 API를 연결할 수 있는 구조로 만든다.
6. Frontend

- 61세 농민이 사용할 수 있을 정도로 단순한 UI
- "지금 박피 가능 / 주의 / 박피 금지"를 한눈에 보여준다.
- 위험도 숫자보다 이유와 행동 지침을 크게 보여준다.
현재 저장소의 모든 파일을 읽고 다음 작업을 수행해줘.

### 1. 전체 구조 분석
backend와 frontend의 모든 주요 파일을 확인하고,
각 파일의 역할을 표로 정리해줘.

### 2. 현재 구현 상태
다음 기능을 각각

- 구현 완료
- 부분 구현
- mock 구현
- 미구현
으로 분류해줘.
기능:

- 센서 시뮬레이션
- 위험도 계산
- 나무 세력 평가
- 폭염 판단
- 기상청 API
- 적산온도 계산
- OpenRouter
- 멀티 모델 라우팅
- 이미지 분석
- 음성 입력
- 음성 출력
- AI Guardrail
- 박피 추천
- 프론트 대시보드
- 시연용 시나리오

### 3. 버그 분석
실행 시 발생할 가능성이 있는 문제를 찾아줘.

특히:

- import 오류
- API 요청/응답 schema 불일치
- CORS
- 환경변수 처리
- OpenRouter API 호출
- frontend/backend 데이터 구조 불일치
- TypeScript/JavaScript 오류
- 비동기 처리
- 에러 처리
- null/undefined 처리

### 4. 설계상 문제
현재 코드에서 "기획 의도와 맞지 않는 부분"을 찾아줘.

특히 AI가 근거 없이
"고사 위험 85%"
"4일 후"
"깊이 1.5mm"
같은 수치를 만들어내는 구조가 있는지 확인해줘.

이 프로젝트에서는 농업 안전과 관련된 수치를 LLM이 임의로 만들어내면 안 된다.

### 5. 개선 아키텍처 제안
현재 코드를 최대한 재사용하면서 다음 구조로 발전시키는 방법을 제안해줘.

Sensor Data
→ Data Validation
→ Deterministic Risk Engine
→ Safety Guardrail
→ Recommendation Engine
→ OpenRouter Explanation
→ Frontend

### 중요
아직 코드를 수정하지 마.

먼저 분석 결과만 출력해줘.

출력 형식:

1. 현재 프로젝트 구조
2. 구현 현황
3. 발견된 버그
4. 설계 문제
5. 추천 아키텍처
6. 우선순위별 작업 목록

- P0: 반드시 수정
- P1: 시연 전에 필요
- P2: 시간이 남으면 구현
그리고 마지막에
"다음 단계에서 무엇부터 수정해야 하는지"
한 가지 작업만 추천해줘.

---

방금 수행한 프로젝트 분석 결과를 바탕으로 P0 버그만 수정해줘.

이번 작업에서는 새로운 기능을 추가하지 않는다.
아키텍처를 대규모로 변경하지 않는다.
기존 동작을 최대한 유지하면서 현재 앱이 정상적으로 화면에 표시되고 위험도 판단까지 실행되도록 만드는 것이 목표다.

## 수정 대상 1 — App.jsx sensor data schema
현재 frontend의 App.jsx가 다음과 같이 데이터를 읽고 있는 문제를 수정한다.

현재 잘못된 구조:
setSensorData(data.current)

backend /api/simulate-sensor의 실제 응답 구조를 기준으로 수정한다.

중요:
frontend와 backend 중 어느 쪽을 변경하는 것이 기존 프로젝트에 더 안전한지 먼저 판단한다.

가능하면 기존 backend API를 불필요하게 변경하지 말고 frontend를 실제 응답 schema에 맞춘다.

수정 후 sensorData에는 반드시 다음 값들이 정상적으로 들어가야 한다.

- air_temp_c
- soil_moisture_pct
- sap_flow_index
- heat_stress
- accumulated_temp
- timestamp
실제 backend response를 확인하고 정확한 field name을 사용한다.

## 수정 대상 2 — generateBadges
App.jsx에서 존재하지 않는 generateBadges를 호출하고 있는 문제를 수정한다.

riskDisplay.js의 실제 export를 확인한다.

현재 분석상 getFieldBadges가 실제 함수라면:

import { getFieldBadges } from './riskDisplay'

및

getFieldBadges(sensorData)

형태로 통일한다.

단순히 이름만 바꾸지 말고 함수의 실제 argument/return 구조도 확인해서 StatusBadges와 호환되는지 확인한다.

## 수정 대상 3 — 근거 없는 1.5mm 제거
risk_engine.py에서 다음과 같은 근거 없는 구체적인 박피 깊이 처방을 제거한다.

"깊이 1.5mm 이내"

현재 실제 연구 데이터나 공식 농업 기준이 연결되어 있지 않으므로 숫자를 생성하지 않는다.

대신 다음과 같은 정성적 표현을 사용한다.

예:

"현재 환경 조건에서는 박피를 고려할 수 있습니다. 실제 처치 여부와 방법은 현장 나무 상태를 확인한 뒤 결정하세요."

중요:
다른 곳에도 1.5mm가 하드코딩되어 있는지 전체 프로젝트를 검색하고 모두 확인한다.

## 수정 대상 4 — 근거 없는 날짜/일수 처방 제거
main.py의 _build_final_message에서

remaining_days = max(1, round((70 - percent) / 10))

처럼 착색률만으로 특정 날짜/일수를 계산하는 로직을 제거한다.

현재 기상예측 데이터나 품종별 생육 모델이 없으므로:

"n일 후"

형태의 확정적인 예측을 하지 않는다.

대신:

"착색 상태를 다시 확인한 뒤 판단하세요."

와 같은 정성적 안내로 변경한다.

## 수정 대상 5 — 오탈자
다음 문구를 수정한다.

"사진을 다시 지어 주세요"

→

"사진을 다시 찍어 주세요"

## 수정 대상 6 — PhotoCheck 안전 처리
riskResult가 없는 상태에서 사진 분석을 실행하지 않도록 한다.

환경 위험도 판정이 완료되지 않았다면 사진 분석 버튼을 비활성화하거나 안내 메시지를 표시한다.

최소한 backend에 environment_result="null"이 전달되어 실제 환경 판단 없이 위험하다고 처리되는 상황은 막는다.

## 절대 하지 말 것
이번 작업에서는 다음 기능을 구현하지 않는다.

- 기상청 API
- 음성 입력
- 멀티 모델 라우팅
- 새로운 AI 모델
- 새로운 센서
- 새로운 UI
- 대규모 리팩터링
- 새로운 농업 처방 규칙
오직 현재 앱을 정상 작동시키는 P0 수정만 한다.

## 작업 순서

1. 관련 파일을 다시 읽는다.
2. 실제 backend response schema를 확인한다.
3. 실제 frontend 사용처를 확인한다.
4. 수정 계획을 먼저 출력한다.
5. 그 다음 파일을 수정한다.
6. 수정 후 전체 프로젝트에서 다음 문자열을 검색한다.

- generateBadges
- getFieldBadges
- 1.5mm
- 1.5 mm
- remaining_days
- "일 후"
- "지어 주세요"

1. 남아 있는 문제가 있으면 알려준다.

## 검증
수정 후 반드시 다음을 확인한다.

Backend:

- FastAPI가 정상 실행되는가?
- /api/simulate-sensor가 정상 response를 반환하는가?
- /api/risk-assessment가 정상 response를 반환하는가?
Frontend:

- npm run build가 성공하는가?
- App.jsx에서 sensorData가 undefined가 아닌가?
- StatusBadges가 정상 렌더링되는가?
- 위험도 판단 버튼이 표시되는가?
- RiskGauge가 정상적으로 결과를 표시하는가?
- PhotoCheck가 환경판정 이전에 잘못 실행되지 않는가?
마지막에 다음 형식으로 결과를 보고해줘.

### Modified files
파일 목록

### Fixed
수정한 버그 목록

### Remaining issues
아직 남아 있는 문제

### Verification
실행한 명령과 결과

중요:
코드 수정 전에 변경 계획을 먼저 보여주고,
계획 출력 후 실제 파일을 수정해줘.

---

P0 수정과 검증이 완료되었다.

이번 작업은 현재 프로젝트에서 가장 중요한 AI 기능 하나만 연결한다.

## 목표
현재 Risk Engine이 계산한 "판단 결과와 판단 근거"를 OpenRouter LLM에 전달하고,
LLM이 그것을 61세 농민이 이해하기 쉬운 한국어로 설명하도록 만든다.

중요한 원칙:

LLM이 위험도를 계산하거나 안전 여부를 결정해서는 안 된다.

Risk Engine이 최종 판단의 Single Source of Truth다.

LLM은 오직 "설명자(Explanation Layer)" 역할만 한다.

---

# 최종 아키텍처
현재:

Sensor
→ Risk Engine
→ Frontend

를 다음으로 확장한다.

Sensor
→ Risk Engine
→ Safety Result
→ OpenRouter Explanation
→ Frontend

즉:

1. Sensor Data
2. Deterministic Risk Engine
3. Risk Result
4. LLM Explanation
5. Frontend 표시
순서로 실행한다.

---

# 가장 중요한 안전 규칙
LLM에게 다음 권한을 주지 않는다.

LLM은 절대로:

- risk_score를 다시 계산하지 않는다.
- risk_level을 변경하지 않는다.
- girdling_allowed를 변경하지 않는다.
- 새로운 확률을 만들지 않는다.
- 새로운 날짜를 만들지 않는다.
- "며칠 후"를 계산하지 않는다.
- 박피 깊이를 제안하지 않는다.
- 센서 데이터에 없는 사실을 추가하지 않는다.
- 근거 없는 농업 처방을 생성하지 않는다.
예를 들어 Risk Engine이:

girdling_allowed=false

라고 판단했다면 LLM이 이를 true로 바꾸거나
"조심해서 박피하세요"라고 반대 의견을 내면 안 된다.

---

# LLM에게 전달할 데이터
가능하면 RiskAssessmentResult 전체를 그대로 전달한다.

예:

{
"risk_score": 72,
"risk_level": "HIGH",
"tree_vigor": "WEAK",
"heat_stress": "HIGH",
"girdling_allowed": false,
"recommended_action": "현재 환경 조건에서는 박피를 권장하지 않습니다.",
"reasons": [
"최근 3일 평균 기온이 높습니다.",
"수액 흐름 지수가 낮습니다.",
"토양 수분이 낮습니다."
],
"data_quality": "GOOD"
}

단, 실제 프로젝트의 RiskAssessmentResult schema를 먼저 확인하고
실제 필드명과 구조를 사용한다.

임의로 새로운 필드를 만들지 않는다.

---

# LLM Prompt
OpenRouter에 전달하는 system prompt를 다음 원칙으로 구성한다.

너는 과수 재배 의사결정을 설명하는 AI 도우미다.

하지만 농업 처치의 안전 여부를 직접 판단하지 않는다.

이미 제공된 Risk Engine의 판단 결과만 설명한다.

다음 규칙을 반드시 지켜라.

1. 제공된 risk_level을 그대로 유지한다.
2. 제공된 risk_score를 그대로 유지한다.
3. 제공된 girdling_allowed를 그대로 유지한다.
4. 제공된 reasons만 판단 근거로 사용한다.
5. 센서 데이터에 없는 새로운 사실을 만들지 않는다.
6. 새로운 확률을 생성하지 않는다.
7. 새로운 날짜나 기간을 생성하지 않는다.
8. 박피 깊이 또는 구체적인 시술 방법을 생성하지 않는다.
9. 농민이 이해하기 쉬운 짧은 한국어를 사용한다.
10. 위험 상태에서는 행동 지침을 가장 먼저 말한다.
11. 정상 상태에서도 "AI가 무조건 박피를 지시한다"는 표현을 사용하지 않는다.
12. 데이터 품질이 좋지 않으면 그 사실을 먼저 알려준다.

---

# 출력 형식
LLM은 반드시 다음 JSON 구조로 응답한다.

{
"title": "...",
"summary": "...",
"reason": "...",
"action": "...",
"warning": "..."
}

각 필드의 의미:

title:
현재 상태를 짧게 표현한다.

예:
"지금은 박피하지 마세요"

summary:
현재 상황을 한두 문장으로 설명한다.

reason:
Risk Engine이 제공한 reasons를 바탕으로 왜 그런 판단이 나왔는지 설명한다.

action:
현재 사용자가 해야 할 행동을 설명한다.

warning:
주의사항이 있으면 표시한다.
없으면 빈 문자열을 사용한다.

---

# 예시
Risk Engine:

risk_level = HIGH
girdling_allowed = false

reasons:

- 최근 3일 평균 기온이 높음
- 토양 수분 낮음
- 수액 흐름 낮음
LLM 출력 예:

{
"title": "지금은 박피하지 마세요.",
"summary": "현재 나무가 더위와 수분 부족으로 스트레스를 받고 있습니다.",
"reason": "최근 기온이 높고 토양 수분과 수액 흐름이 낮게 나타나 나무 상태가 좋지 않은 것으로 판단되었습니다.",
"action": "지금은 박피를 보류하고 나무 상태를 다시 확인하세요.",
"warning": "이 결과는 센서 데이터를 기반으로 한 의사결정 보조 결과입니다."
}

중요:
위 예시의 문장을 그대로 하드코딩하지 않는다.
실제 Risk Engine 결과를 기반으로 동적으로 생성한다.

---

# BLOCKED 상태
risk_level이 BLOCKED이면
LLM은 반드시 "하지 마세요"를 먼저 표현한다.

예:

"지금은 박피하지 마세요."

그 뒤에 이유를 설명한다.

LLM이 BLOCKED 상태에서 완화 표현을 사용해
사용자가 박피를 해도 된다고 오해하게 만들면 안 된다.

---

# LOW 상태
risk_level이 LOW이고
girdling_allowed=true라면 다음과 같이 설명할 수 있다.

"현재 환경 조건에서는 박피를 고려할 수 있습니다."

단,

"박피하세요."

처럼 확정적인 농업 처방으로 표현하지 않는다.

실제 처치 여부와 방법은 현장 나무 상태를 확인해야 한다는 점을 유지한다.

---

# OpenRouter 연결
현재 backend/llm_client.py의
generate_explanation() 구조를 먼저 확인한다.

가능하면 기존 함수를 재사용한다.

새로운 LLM client를 별도로 만들지 않는다.

OPENROUTER_API_KEY가 없는 경우에도
전체 서비스가 정상 동작해야 한다.

LLM 호출 실패 시:

Risk Engine 결과를 그대로 frontend에 반환한다.

예:

{
"llm_explanation": null,
"llm_status": "fallback"
}

이런 방식으로 처리한다.

LLM 실패 때문에 위험도 판단 자체가 실패하면 안 된다.

---

# API response
현재 /api/risk-assessment의 response schema를 확인한다.

기존 필드는 유지한다.

여기에 가능하면 다음 필드를 추가한다.

"llm_explanation": {
"title": "...",
"summary": "...",
"reason": "...",
"action": "...",
"warning": "..."
}

그리고:

"llm_status": "success"

또는

"llm_status": "fallback"

을 추가한다.

기존 frontend가 깨지지 않도록
새 필드는 optional이어야 한다.

---

# Frontend
기존 RiskGauge 또는 현재 위험도 결과를 표시하는 컴포넌트를 확인한다.

LLM explanation이 있으면 다음 순서로 표시한다.

1. Risk Engine의 최종 안전 상태
2. "왜 그런가요?"
3. LLM이 생성한 쉬운 설명
4. 행동 안내
중요:

LLM의 문장이 Risk Engine의 상태를 덮어쓰면 안 된다.

예를 들어:

Risk Engine:
"지금은 박피하지 마세요."

LLM:
"조심해서 해도 됩니다."

같은 상황이 발생하면 안 된다.

---

# 데이터 출처 표시
UI에서 가능하면 다음을 구분해서 표시한다.

"판단"
→ Risk Engine

"쉬운 설명"
→ AI

이를 통해 AI가 안전 판정을 직접 내리는 것처럼 보이지 않게 한다.

---

# API 장애 처리
OpenRouter에서 다음 상황을 모두 안전하게 처리한다.

- API key 없음
- timeout
- HTTP 429
- HTTP 500
- 잘못된 JSON
- 응답 형식 오류
어떤 경우에도 Risk Engine 결과는 정상적으로 표시되어야 한다.

---

# 테스트
최소한 다음 4가지 시나리오를 테스트한다.

## TEST 1 — 정상
LOW
girdling_allowed=true

→ LLM이 정상 상태를 설명

## TEST 2 — 고온 + 약한 나무
HIGH 또는 BLOCKED
girdling_allowed=false

→ "지금은 박피하지 마세요."가 먼저 표시

## TEST 3 — 데이터 부족
data_quality가 낮거나 판단 불가

→ LLM이 추측하지 않고
"현재 데이터만으로 안전 여부를 충분히 판단하기 어렵습니다."
라고 설명

## TEST 4 — OpenRouter 장애
API 호출 실패

→ Risk Engine 결과는 정상 표시
→ llm_status=fallback

---

# 절대 하지 말 것
이번 작업에서 다음 기능은 구현하지 않는다.

- 기상청 API
- 음성 입력/STT
- 멀티 모델 라우팅
- 새로운 센서
- 새로운 농업 규칙
- 박피 깊이 계산
- 박피 날짜 계산
- Vision 모델 수정
- 대규모 UI 개편
이번 작업의 목표는 오직 하나다.

"Risk Engine의 판단 근거를 OpenRouter가 농민에게 이해하기 쉽게 설명하도록 연결한다."

---

# 작업 방식
먼저 다음 파일을 다시 읽는다.

- backend/main.py
- backend/risk_engine.py
- backend/llm_client.py
- frontend/src/App.jsx
- frontend/src/components/RiskGauge.jsx
- frontend/src/api.js
그 후:

1. 현재 generate_explanation() 구현 확인
2. 현재 RiskAssessmentResult schema 확인
3. 현재 /api/risk-assessment response 확인
4. 최소 변경 계획 출력
5. 실제 코드 수정
6. backend 테스트
7. frontend build
8. 가능하면 브라우저에서 실제 결과 확인
마지막 보고 형식:

### Modified files

### Architecture
Sensor
→ Risk Engine
→ Guardrail
→ LLM Explanation
→ Frontend

각 단계가 실제 코드에서 어디에 구현됐는지 설명

### Safety verification
LLM이 risk_level / risk_score / girdling_allowed를 변경할 수 없는지 확인

### LLM verification
성공/실패/fallback 테스트 결과

### Frontend verification
실제 화면에서 판단과 AI 설명이 표시되는지

### Remaining issues
남아 있는 문제만 적는다.

중요:
이번 작업에서는 코드 품질보다 "안전한 역할 분리"가 더 중요하다.
LLM이 똑똑해 보이는 것보다 Risk Engine의 판단을 절대로 침범하지 않는 구조를 우선한다.