from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "Qwen"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/send", methods=["POST"])
def send():
    try:
        # Get message from frontend
        data = request.get_json()
        user_input = data.get("message", "").strip()

        if not user_input:
            return jsonify({"response": "❗ Please enter a message."})

        # ✅ Build payload AFTER user_input is defined
        ollama_payload = {
            "model": OLLAMA_MODEL,
            "messages": [
                {"role": "user", "content": user_input}
            ],
            "stream": False
        }

        # Send request to Ollama
        response = requests.post(OLLAMA_URL, json=ollama_payload)
        response_data = response.json()

        print("🧠 Ollama Response:", response_data)

        # Extract and return reply
        reply = response_data.get("message", {}).get("content", "⚠️ Ollama did not return a valid reply.")
        return jsonify({"response": reply})

    except Exception as e:
        print(f"❌ Error talking to Ollama: {e}")
        return jsonify({"response": "❌ Server error. Please make sure Ollama is running."}), 500

if __name__ == "__main__":
    print("🚀 Starting Flask server with Ollama integration...")
    app.run(debug=True)
    
