// chat-widget.js — CloudPublica crisis navigator client
// Vanilla JS, no dependencies. SSE streaming from /api/chat

(function () {
  "use strict";

  var STORAGE_KEY = "cp_chat_session";
  var API_URL = "/api/chat";

  var form = document.getElementById("chat-form");
  var input = document.getElementById("chat-input");
  var sendBtn = document.getElementById("chat-send");
  var messagesEl = document.getElementById("chat-messages");
  var clearBtn = document.getElementById("chat-clear");
  var exportBtn = document.getElementById("chat-export");

  if (!form || !input || !messagesEl) return;

  function getSessionId() {
    var sid = localStorage.getItem(STORAGE_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, sid);
    }
    return sid;
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
    while (messagesEl.children.length > 1) {
      messagesEl.removeChild(messagesEl.lastChild);
    }
  }

  function addMessage(content, role) {
    var wrapper = document.createElement("div");
    wrapper.className = role === "user" ? "flex justify-end" : "flex justify-start";

    var bubble = document.createElement("div");
    bubble.className = role === "user"
      ? "bg-[#0f2027] text-white rounded-xl px-4 py-3 max-w-[85%] shadow-sm"
      : "bg-white border border-gray-200 rounded-xl px-4 py-3 max-w-[85%] shadow-sm";

    var p = document.createElement("p");
    p.className = role === "user"
      ? "text-sm leading-relaxed whitespace-pre-wrap"
      : "text-gray-700 text-sm leading-relaxed whitespace-pre-wrap";
    p.textContent = content;

    bubble.appendChild(p);
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    scrollToBottom();
    return p;
  }

  function addStreamingMessage() {
    var wrapper = document.createElement("div");
    wrapper.className = "flex justify-start";

    var bubble = document.createElement("div");
    bubble.className = "bg-white border border-gray-200 rounded-xl px-4 py-3 max-w-[85%] shadow-sm";

    var p = document.createElement("p");
    p.className = "text-gray-700 text-sm leading-relaxed whitespace-pre-wrap";
    p.textContent = "";

    bubble.appendChild(p);
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    scrollToBottom();
    return p;
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  var sending = false;

  async function sendMessage(text) {
    if (sending || !text.trim()) return;
    sending = true;
    sendBtn.disabled = true;
    input.disabled = true;

    addMessage(text, "user");
    var streamEl = addStreamingMessage();

    try {
      var response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          sessionId: getSessionId(),
        }),
      });

      var newSid = response.headers.get("X-Session-Id");
      if (newSid) localStorage.setItem(STORAGE_KEY, newSid);

      if (!response.ok) {
        var err = await response.json().catch(function () { return { error: "Something went wrong" }; });
        streamEl.textContent = err.error || "Something went wrong. Please try again.";
        return;
      }

      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var buffer = "";

      while (true) {
        var result = await reader.read();
        if (result.done) break;

        buffer += decoder.decode(result.value, { stream: true });
        var lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (line.startsWith("data: ")) {
            var data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              var parsed = JSON.parse(data);
              if (parsed.response) {
                streamEl.textContent += parsed.response;
                scrollToBottom();
              }
            } catch (e) { /* skip */ }
          }
        }
      }

      // Handle remaining buffer
      if (buffer.startsWith("data: ")) {
        var remaining = buffer.slice(6);
        if (remaining !== "[DONE]") {
          try {
            var p2 = JSON.parse(remaining);
            if (p2.response) streamEl.textContent += p2.response;
          } catch (e) { /* skip */ }
        }
      }

    } catch (err) {
      streamEl.textContent = "Connection error. Please try again.";
    } finally {
      sending = false;
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value;
    input.value = "";
    input.style.height = "auto";
    sendMessage(text);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event("submit"));
    }
  });

  input.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 120) + "px";
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", clearSession);
  }

  // Export conversation
  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      var paragraphs = messagesEl.querySelectorAll("p");
      var lines = [];
      paragraphs.forEach(function (p) {
        var wrapper = p.closest("[class*='justify-']");
        var role = wrapper && wrapper.className.indexOf("justify-end") !== -1 ? "You" : "Guide";
        lines.push(role + ": " + p.textContent);
        lines.push("");
      });

      var text = "CloudPublica Conversation\nExported: " + new Date().toISOString().split("T")[0]
        + "\ncloudpublica.org/chat/\n---\n\n" + lines.join("\n");

      var blob = new Blob([text], { type: "text/plain" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "cloudpublica-" + new Date().toISOString().split("T")[0] + ".txt";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  input.focus();
})();
