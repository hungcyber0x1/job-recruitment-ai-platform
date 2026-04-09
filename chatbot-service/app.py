"""
API Flask cho tư vấn nghề (chatbot): gateway Node gọi HTTP thay vì gọi Gemini/OpenAI/Poe trực tiếp.
POST /v1/career-advice — body JSON: user, message, history[].
AI_PROVIDER: gemini | openai | poe (Poe: POE_API_KEY + POE_BOT, base https://api.poe.com/v1).
Tùy chọn: CHATBOT_API_SECRET — header X-Chatbot-Secret phải khớp.
"""
from __future__ import annotations

import os
import re
from typing import Any

from flask import Flask, jsonify, request
from openai import OpenAI

CAREER_COUNSELOR_INSTRUCTION = (
    "You are a helpful expert career counselor in Vietnam. "
    "You help candidates find the right career path, prepare for interviews, "
    "and improve their professional profiles. Always be supportive and practical."
)


def _parse_model_list(raw: str | None) -> list[str]:
    if not raw or not str(raw).strip():
        return []
    return [s.strip() for s in str(raw).split(",") if s.strip()]


def _dedupe_models(names: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for m in names:
        if m in seen:
            continue
        seen.add(m)
        out.append(m)
    return out


def _career_error_message(err: Exception | None) -> str:
    msg = str(err or "")
    if re.search(r"429|quota exceeded|Too Many Requests|rate limit", msg, re.I):
        return (
            "Hệ thống AI tạm hết hạn mức (quota) hoặc quá tải. "
            "Hãy thử lại sau vài phút; nếu vẫn lỗi, kiểm tra billing/API key hoặc đổi model trong cấu hình server."
        )
    if re.search(r"404|not found", msg, re.I) and re.search(
        r"invalid|not found|does not exist|model", msg, re.I
    ):
        return (
            "Model AI không còn khả dụng với API key này. "
            "Cần cập nhật AI_MODEL / AI_MODEL_FALLBACKS (Gemini), OPENAI_MODEL / OPENAI_MODEL_FALLBACKS, "
            "hoặc POE_BOT / POE_BOT_FALLBACKS (Poe)."
        )
    if re.search(r"402|subscription|api access", msg, re.I) and re.search(
        r"poe|subscription", msg, re.I
    ):
        return (
            "Poe API từ chối: bot/model cần gói Poe phù hợp cho API, hoặc đổi POE_BOT. "
            "Có thể tạm dùng AI_PROVIDER=openai hoặc gemini."
        )
    return (
        "I apologize, but I'm having trouble processing your request right now. "
        "Please try again later."
    )


def _gemini_models() -> list[str]:
    primary = os.environ.get("AI_MODEL", "gemini-2.5-flash")
    fallbacks = _parse_model_list(
        os.environ.get(
            "AI_MODEL_FALLBACKS",
            "gemini-2.0-flash,gemini-2.5-flash-lite,gemini-flash-latest",
        )
    )
    return _dedupe_models([primary, *fallbacks])


def _openai_models() -> list[str]:
    primary = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    fallbacks = _parse_model_list(os.environ.get("OPENAI_MODEL_FALLBACKS", "gpt-4o"))
    return _dedupe_models([primary, *fallbacks])


def _poe_models() -> list[str]:
    primary = os.environ.get("POE_BOT", "JobMentorAI")
    fallbacks = _parse_model_list(os.environ.get("POE_BOT_FALLBACKS", ""))
    return _dedupe_models([primary, *fallbacks])


def _build_prompt(user: dict[str, Any], message: str, history: list[dict[str, Any]]) -> str:
    if not history:
        name = user.get("first_name") or "Candidate"
        role = user.get("role") or "candidate"
        return f"[Context: Candidate Name={name}, Role={role}]\n\n{message}"
    return message


def _history_to_gemini(history: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for msg in history:
        role = "model" if msg.get("is_ai") else "user"
        text = (msg.get("message") or "").strip()
        if not text:
            continue
        out.append({"role": role, "parts": [text]})
    while out and out[0]["role"] == "model":
        out.pop(0)
    return out


def _generate_openai(
    user: dict[str, Any], message: str, history: list[dict[str, Any]]
) -> str:
    prov = os.environ.get("AI_PROVIDER", "gemini").lower().strip()
    if prov == "poe":
        api_key = os.environ.get("POE_API_KEY", "").strip()
        base = os.environ.get("POE_API_BASE_URL", "https://api.poe.com/v1").strip().rstrip("/")
        models = _poe_models()
    else:
        api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        base = os.environ.get("OPENAI_BASE_URL", "").strip().rstrip("/")
        models = _openai_models()
    if not api_key:
        return (
            "I'm sorry, I cannot provide AI-generated advice at the moment "
            "as the AI service is not configured."
        )

    client_kw: dict[str, Any] = {"api_key": api_key}
    if base:
        client_kw["base_url"] = base
    client = OpenAI(**client_kw)
    prompt = _build_prompt(user, message, history)
    messages: list[dict[str, str]] = [{"role": "system", "content": CAREER_COUNSELOR_INSTRUCTION}]
    for msg in history:
        role = "assistant" if msg.get("is_ai") else "user"
        text = (msg.get("message") or "").strip()
        if not text:
            continue
        messages.append({"role": role, "content": text})
    messages.append({"role": "user", "content": prompt})

    max_tokens = int(os.environ.get("CHATBOT_MAX_OUTPUT_TOKENS", "500"))
    temperature = float(os.environ.get("CHATBOT_TEMPERATURE", "0.7"))

    last_err: Exception | None = None
    for i, model_name in enumerate(models):
        try:
            completion = client.chat.completions.create(
                model=model_name,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            text = (completion.choices[0].message.content or "").strip()
            return text or _career_error_message(None)
        except Exception as e:  # noqa: BLE001
            last_err = e
            err_s = str(e)
            status = getattr(e, "status_code", None) or getattr(e, "status", None)
            try_next = (
                status in (429, 404) or re.search(r"429|404|rate limit|model", err_s, re.I)
            ) and i < len(models) - 1
            if try_next:
                continue
            return _career_error_message(e)

    return _career_error_message(last_err)


def _generate_gemini(
    user: dict[str, Any], message: str, history: list[dict[str, Any]]
) -> str:
    api_key = os.environ.get("AI_API_KEY", "").strip()
    if not api_key:
        return (
            "I'm sorry, I cannot provide AI-generated advice at the moment "
            "as the AI service is not configured."
        )

    import google.generativeai as genai

    genai.configure(api_key=api_key)
    gem_history = _history_to_gemini(history)
    prompt = _build_prompt(user, message, history)

    max_tokens = int(os.environ.get("CHATBOT_MAX_OUTPUT_TOKENS", "500"))
    temperature = float(os.environ.get("CHATBOT_TEMPERATURE", "0.7"))
    gen_cfg = genai.GenerationConfig(
        max_output_tokens=max_tokens,
        temperature=temperature,
    )

    models = _gemini_models()
    last_err: Exception | None = None
    for i, model_name in enumerate(models):
        try:
            model = genai.GenerativeModel(
                model_name,
                system_instruction=CAREER_COUNSELOR_INSTRUCTION,
            )
            chat = model.start_chat(history=gem_history)
            result = chat.send_message(prompt, generation_config=gen_cfg)
            text = (result.text or "").strip()
            return text or _career_error_message(None)
        except Exception as e:  # noqa: BLE001
            last_err = e
            err_s = str(e)
            try_next = bool(
                re.search(r"404|not found|429|quota|Too Many Requests", err_s, re.I)
                and i < len(models) - 1
            )
            if try_next:
                continue
            return _career_error_message(e)

    return _career_error_message(last_err)


def create_app() -> Flask:
    app = Flask(__name__)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.post("/v1/career-advice")
    def career_advice():
        expected = os.environ.get("CHATBOT_API_SECRET", "").strip()
        if expected:
            got = request.headers.get("X-Chatbot-Secret", "")
            if got != expected:
                return jsonify({"success": False, "error": "unauthorized"}), 401

        data = request.get_json(silent=True) or {}
        user = data.get("user") if isinstance(data.get("user"), dict) else {}
        message = data.get("message")
        history = data.get("history")
        if not message or not isinstance(message, str):
            return jsonify({"success": False, "error": "message is required"}), 400
        if not isinstance(history, list):
            history = []

        provider = os.environ.get("AI_PROVIDER", "gemini").lower().strip()
        if provider == "openai" and os.environ.get("OPENAI_API_KEY", "").strip():
            reply = _generate_openai(user, message.strip(), history)
        elif provider == "poe" and os.environ.get("POE_API_KEY", "").strip():
            reply = _generate_openai(user, message.strip(), history)
        else:
            reply = _generate_gemini(user, message.strip(), history)

        return jsonify({"success": True, "reply": reply})

    return app


app = create_app()
