"""OpenRouter LLM 호출 래퍼.

- API 키는 .env 의 OPENROUTER_API_KEY 에서 읽는다.
- 키가 없거나(대회 초반 단계) 호출이 실패하면 항상 폴백 메시지를 반환해서
  나머지 기능(룰 기반 위험도 판단)이 끊기지 않도록 한다.
- 지금 단계에서는 실제 키를 세팅하지 않으므로 mock 폴백 경로만 사용된다.
"""
import json
import os
import re
from typing import Any, Dict

import httpx
from dotenv import load_dotenv

load_dotenv()

# 일부 환경에서 OPEN_ROUTER_API_KEY 로 표기하는 경우도 있어 둘 다 지원한다.
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPEN_ROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
# 비전(이미지 인식) 모델은 별도 환경변수로 바꿔 끼울 수 있게 분리한다.
# NOTE: openrouter.ai/models 에서 실제 사용 가능한 최신 모델 slug를 확인해 OPENROUTER_VISION_MODEL 로 덮어써 주세요.
OPENROUTER_VISION_MODEL = os.getenv("OPENROUTER_VISION_MODEL", "openai/gpt-5.6-sol")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

FALLBACK_MESSAGE = "AI 설명 생성 기능은 아직 준비 중입니다. 규칙 기반 판단 결과를 참고해 주세요."

PHOTO_ANALYSIS_FALLBACK = {
    "coloring_percent": None,
    "stage": "판독 실패",
    "comment": "사진을 다시 찍어주세요",
    "is_fallback": True,
}
_VALID_COLORING_STAGES = {"미숙", "진행중", "완숙"}


def generate_explanation(prompt: str, timeout: float = 10.0) -> str:
    """OpenRouter Chat Completions 를 호출해 자연어 설명을 반환한다.

    API 키가 없거나 호출이 실패하면 예외를 던지지 않고 폴백 메시지를 반환한다.
    """
    if not OPENROUTER_API_KEY:
        return FALLBACK_MESSAGE

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(
                OPENROUTER_URL,
                headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception:
        return FALLBACK_MESSAGE


def build_risk_explanation_prompt(sensor_data: Dict[str, Any], risk_result: Dict[str, Any]) -> str:
    """risk_engine 결과를 LLM 설명용 프롬프트 문자열로 변환한다 (추후 실제 연동 시 사용)."""
    return (
        "다음은 과수원 환상박피(girdling) 시공 위험도 판단 결과입니다. "
        "농민이 이해하기 쉬운 한두 문장으로 쉽게 설명해 주세요.\n"
        f"센서 데이터: {sensor_data}\n"
        f"위험도 점수: {risk_result.get('risk_score')} ({risk_result.get('risk_label')})\n"
        f"판단 근거: {risk_result.get('reasons')}"
    )


def _extract_json_object(text: str) -> Dict[str, Any]:
    """LLM 응답에서 ```json 코드블록이 섞여 와도 순수 JSON 객체만 뽑아 파싱한다."""
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()
    return json.loads(cleaned)


def analyze_fruit_photo(image_base64: str, mime_type: str = "image/jpeg", timeout: float = 10.0) -> Dict[str, Any]:
    """과일 사진(base64)의 착색 진행도를 Vision LLM(OpenRouter)으로 판독한다.

    API 키가 없거나, 호출/파싱이 실패하거나, 타임아웃이 나면 예외를 던지지 않고
    항상 PHOTO_ANALYSIS_FALLBACK 형태({"is_fallback": True, ...})를 반환한다.
    """
    if not OPENROUTER_API_KEY:
        return dict(PHOTO_ANALYSIS_FALLBACK)

    prompt = (
        "당신은 과수 착색 진단 전문가입니다. 첨부된 과일 사진을 보고 착색(색이 익어가는 정도)을 판독하세요.\n"
        "다른 설명이나 코드블록 없이, 아래 형식의 순수 JSON 객체 하나만 출력하세요:\n"
        '{"coloring_percent": 0에서 100 사이 정수, "stage": "미숙" 또는 "진행중" 또는 "완숙" 중 하나, '
        '"comment": "농민이 이해하기 쉬운 한글 한 문장 설명"}'
    )

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(
                OPENROUTER_URL,
                headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
                json={
                    "model": OPENROUTER_VISION_MODEL,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:{mime_type};base64,{image_base64}"},
                                },
                            ],
                        }
                    ],
                },
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            parsed = _extract_json_object(content)

        stage = parsed.get("stage")
        comment = parsed.get("comment")
        percent = parsed.get("coloring_percent")

        if stage not in _VALID_COLORING_STAGES or not isinstance(comment, str):
            return dict(PHOTO_ANALYSIS_FALLBACK)
        if percent is not None:
            percent = int(percent)
            if not 0 <= percent <= 100:
                return dict(PHOTO_ANALYSIS_FALLBACK)

        return {
            "coloring_percent": percent,
            "stage": stage,
            "comment": comment,
            "is_fallback": False,
        }
    except Exception:
        return dict(PHOTO_ANALYSIS_FALLBACK)

