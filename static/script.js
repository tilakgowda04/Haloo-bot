document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("sendBtn");
  const voiceBtn = document.getElementById("voiceBtn");
  const inputBox = document.getElementById("inputBox");
  const chatBox = document.getElementById("chatBox");
  const locationDisplay = document.getElementById("locationDisplay");

  let currentLat = null;
  let currentLon = null;

  const synth = window.speechSynthesis;
  const recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    ? new (window.SpeechRecognition || window.webkitSpeechRecognition)()
    : null;

  function appendMsg(role, text) {
    const msg = document.createElement("div");
    msg.className = "msg " + role;
    msg.innerHTML = `<strong>${role === "user" ? "You" : "Bot"}:</strong> ${text.replace(/\n/g, "<br>")}`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
  }

  async function getLocationNow() {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            currentLat = position.coords.latitude;
            currentLon = position.coords.longitude;
            locationDisplay.textContent = `📍 Latitude: ${currentLat.toFixed(5)}, Longitude: ${currentLon.toFixed(5)}`;
            console.log("✅ Current Location:", currentLat, currentLon);
            resolve();
          },
          (error) => {
            locationDisplay.textContent = "⚠️ Location access denied or unavailable.";
            console.warn("⚠️ Geolocation error:", error);
            reject(error);
          }
        );
      } else {
        locationDisplay.textContent = "❌ Geolocation not supported by this browser.";
        reject("Geolocation not supported");
      }
    });
  }

  async function sendMessage(message) {
    appendMsg("user", message);
    inputBox.value = "";

    const payload = { message };

    // ⬇️ Include location only for navigation queries
    const msgLower = message.toLowerCase();
    if (
      msgLower.includes("direction") ||
      msgLower.includes("navigate") ||
      msgLower.includes("route") ||
      msgLower.includes("how to go") ||
      msgLower.includes("way to") ||
      msgLower.includes("go to") ||
      msgLower.includes("how do i get to")
    ) {
      try {
        if (!currentLat || !currentLon) await getLocationNow();
        payload.lat = currentLat;
        payload.lon = currentLon;
      } catch {
        appendMsg("bot", "⚠️ Unable to access your location. Please allow GPS access.");
        return;
      }
    }

    const typingMsg = document.createElement("div");
    typingMsg.className = "msg bot";
    typingMsg.innerHTML = `<strong>Bot:</strong> typing...`;
    chatBox.appendChild(typingMsg);

    try {
      const res = await fetch("/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      typingMsg.innerHTML = `<strong>Bot:</strong> ${data.response.replace(/\n/g, "<br>")}`;
      if (data.is_direction || msgLower.includes("navigate") || msgLower.includes("direction")) {
        speak(data.response);
      }
    } catch (err) {
      typingMsg.innerHTML = `<strong>Bot:</strong> ⚠️ Error getting response.`;
      console.error("Server error:", err);
    }
  }

  sendBtn.onclick = () => {
    const text = inputBox.value.trim();
    if (text) sendMessage(text);
  };

  inputBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });

  if (recognition) {
    voiceBtn.onclick = () => recognition.start();
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      inputBox.value = text;
      sendMessage(text);
    };
  } else {
    voiceBtn.disabled = true;
  }

  // 📍 Get current location on load
  getLocationNow();

  // 🔁 Auto-update location every 30 seconds
  setInterval(getLocationNow, 30000);
});
