export default function handler(req, res) {
  if (req.method === "POST") {
    const { message } = req.body;
    res.status(200).json({ reply: `إجابتك وصلت: ${message}` });
  } else {
    res.status(200).json({ reply: "Welcome to AlArab 777 AI 🚀" });
  }
}