# Chatbot service (Flask, tùy chọn)

API HTTP cho tư vấn nghề: gateway Node (`CHATBOT_SERVICE_URL`) gọi thay vì gọi Gemini/OpenAI trực tiếp.

## Chạy cục bộ

```bash
cd chatbot-service
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Đặt biến môi trường giống gateway (ít nhất `AI_PROVIDER`, `AI_API_KEY` hoặc `OPENAI_API_KEY` / `POE_*` tùy provider). Tùy chọn: `CHATBOT_API_SECRET` — header `X-Chatbot-Secret` phải khớp với gateway.

```bash
flask --app app run --host 127.0.0.1 --port 5100
```

Trong `.env` của **server** Node: `CHATBOT_SERVICE_URL=http://127.0.0.1:5100`.

## Endpoint

- `POST /v1/career-advice` — body JSON: `user`, `message`, `history[]` (xem `app.py`).
