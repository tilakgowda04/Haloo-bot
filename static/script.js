document.addEventListener("DOMContentLoaded", function () {
  const sendBtn = document.getElementById("sendBtn");
  const voiceBtn = document.getElementById("voiceBtn");
  const userInput = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");

  const synth = window.speechSynthesis;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  let isVoiceInput = false;
  let isRecording = false;  // <-- For toggle state

  function appendMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = `msg ${role}`;
    msg.innerHTML = `<strong>${role === "user" ? "You" : "Bot"}:</strong> ${text}`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await res.json();
      loading.remove();

      const reply = data.response || "⚠️ No response from bot.";
      appendMessage("bot", reply);

      if (isVoiceInput) {
        speak(reply);
        isVoiceInput = false;
      }
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
    if (message) {
      sendMessage(message);
    }
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

      if (!isRecording) {
        recognition.start();
        isRecording = true;
        voiceBtn.textContent = "listening"; // Change to stop icon
      } else {
        recognition.stop();
        isRecording = false;
        voiceBtn.textContent = "🎙️"; // Reset icon
      }

      recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        isVoiceInput = true;
        sendMessage(transcript);
      };

      recognition.onerror = err => {
        console.error(err);
        appendMessage("bot", "❌ Voice error.");
        isRecording = false;
        voiceBtn.textContent = "🎙️";
      };

      recognition.onend = () => {
        isRecording = false;
        voiceBtn.textContent = "🎙️";
      };
    });
  }
});
