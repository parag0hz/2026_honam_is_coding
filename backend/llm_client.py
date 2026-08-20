"""OpenRouter LLM 호출 래퍼.

- API 키는 .env 의 OPENROUTER_API_KEY 에서 읽는다.
- 키가 없거나(대회 초반 단계) 호출이 실패하면 항상 폴백 메시지를 반환해서
  나머지 기능(룰 기반 위험도 판단)이 끊기지 않도록 한다.
- 지금 단계에서는 실제 키를 세팅하지 않으므로 mock 폴백 경로만 사용된다.
"""
import os
from typing import Any, Dict

import httpx
from dotenv import load_dotenv

load_dotenv()

# 일부 환경에서 OPEN_ROUTER_API_KEY 로 표기하는 경우도 있어 둘 다 지원한다.
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPEN_ROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

FALLBACK_MESSAGE = "AI 설명 생성 기능은 아직 준비 중입니다. 규칙 기반 판단 결과를 참고해 주세요."


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
