
async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");

  const userMsg = input.value.trim();
  if (!userMsg) return;

  // عرض رسالة المستخدم
  const userDiv = document.createElement("div");
  userDiv.textContent = "👤 " + userMsg;
  chatBox.appendChild(userDiv);

  input.value = "";

  // طلب من API (ممكن يكون Vercel API endpoint)
  try {
    const res = await fetch("/api/hello", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg })
    });
    const data = await res.json();

    const botDiv = document.createElement("div");
    botDiv.textContent = "🤖 " + data.reply;
    chatBox.appendChild(botDiv);
  } catch (err) {
    const botDiv = document.createElement("div");
    botDiv.textContent = "⚠️ خطأ بالاتصال";
    chatBox.appendChild(botDiv);
  }
}