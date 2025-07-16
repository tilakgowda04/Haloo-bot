document.addEventListener("DOMContentLoaded", function () {
  const sendBtn = document.getElementById("sendBtn");
  const voiceBtn = document.getElementById("voiceBtn");
  const userInput = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");

  const synth = window.speechSynthesis;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  function appendMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = `msg ${role}`;
    msg.innerHTML = `<strong>${role === "user" ? "You" : "Bot"}:</strong> ${text}`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function speak(text) {
    const utter = new SpeechSynthesisUtterance(text);
    synth.speak(utter);
  }

  async function sendMessage(message) {
    appendMessage("user", message);
    userInput.value = "";
    sendBtn.disabled = true;

    const loading = document.createElement("div");
    loading.className = "msg bot";
    loading.textContent = "Bot: ⏳ Typing...";
    chatBox.appendChild(loading);
    chatBox.scrollTop = chatBox.scrollHeight;

   try {
  const res = await fetch("/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  });

  const data = await res.json();
  console.log("📥 Bot replied:", data);  // ✅ DEBUG LINE

  loading.remove();
  appendMessage("bot", data.response || "⚠️ No response from bot.");
  speak(data.response || "");
} catch (err) {
  loading.remove();
  appendMessage("bot", "❌ Failed to connect.");
  console.error(err);
  
    } finally {
      sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener("click", () => {
    const message = userInput.value.trim();
    if (message) sendMessage(message);
  });

  userInput.addEventListener("keydown", e => {
    if (e.key === "Enter") sendBtn.click();
  });

  if (voiceBtn) {
    voiceBtn.addEventListener("click", () => {
      if (!recognition) {
        alert("Your browser doesn't support speech recognition.");
        return;
      }

      recognition.start();
      voiceBtn.disabled = true;
      voiceBtn.textContent = "🎤 Listening...";

      recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        sendBtn.click();
      };

      recognition.onerror = err => {
        console.error(err);
        appendMessage("bot", "❌ Voice error.");
      };

      recognition.onend = () => {
        voiceBtn.disabled = false;
        voiceBtn.textContent = "🎤";
      };
    });
  }
});
