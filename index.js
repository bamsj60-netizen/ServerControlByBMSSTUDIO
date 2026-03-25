const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const TOKEN = "8658636732:AAF0k7oV-oYQf-pbVsXRLdH1xweljbJ_EHk";
const GROQ_KEY = "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";

// Struktur Menu Lengkap BMS AI V5
const MENUS = {
  main: [
    [{ text: "🧠 Reasoning", callback_data: "cat_Reasoning" }, { text: "🛠️ Tool Use", callback_data: "cat_ToolUse" }],
    [{ text: "🎙️ TTS", callback_data: "cat_TTS" }, { text: "👂 STT", callback_data: "cat_STT" }],
    [{ text: "📝 Text to Text", callback_data: "cat_Text" }, { text: "👁️ Vision", callback_data: "cat_Vision" }],
    [{ text: "🌐 Multilingual", callback_data: "cat_Multi" }, { text: "🛡️ Safety", callback_data: "cat_Safety" }]
  ],
  Reasoning: ["GPT OSS 120B", "GPT OSS 20B", "Qwen 3 32B"],
  ToolUse: ["GPT OSS 120B", "GPT OSS 20B", "Llama 4 Scout", "Qwen 3 32B", "Kimi K2"],
  TTS: ["Orpheus English", "Orpheus Arabic Saudi"],
  STT: ["Whisper Large v3", "Whisper Large v3 Turbo"],
  Text: ["GPT OSS 120B", "GPT OSS 20B", "Kimi K2", "Llama 4 Scout", "Llama 3.3 70B"],
  Vision: ["Llama 4 Scout"],
  Multi: ["GPT OSS 120B", "GPT OSS 20B", "Kimi K2", "Llama 4 Scout", "Llama 3.3 70B", "Whisper Large v3"],
  Safety: ["Safety GPT OSS 20B"]
};

app.post("/webhook", async (req, res) => {
  const { message, callback_query } = req.body;
  const chatId = message?.chat.id || callback_query?.message.chat.id;

  // 1. Logika Klik Tombol Menu
  if (callback_query) {
    const data = callback_query.data;
    
    // Hilangkan loading di tombol Telegram
    await axios.post(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
      callback_query_id: callback_query.id
    }).catch(() => {});

    if (data === "go_main") {
      await sendMsg(chatId, "<b>🎛️ Menu Utama BMS AI</b>\nPilih kategori layanan:", MENUS.main);
    } else if (data.startsWith("cat_")) {
      const cat = data.replace("cat_", "");
      const buttons = MENUS[cat].map(m => [{ text: m, callback_data: `set_${m}` }]);
      buttons.push([{ text: "⬅️ Kembali", callback_data: "go_main" }]);
      await sendMsg(chatId, `<b>📂 Kategori: ${cat}</b>\nPilih model yang ingin digunakan:`, buttons);
    } else if (data.startsWith("set_")) {
      const model = data.replace("set_", "");
      await sendMsg(chatId, `✅ Model berhasil diubah ke: <b>${model}</b>\n<i>Silahkan ketik pesanmu sekarang!</i>`);
    }
    return res.sendStatus(200);
  }

  // 2. Logika Pesan Masuk
  const text = message?.text;
  if (!text) return res.sendStatus(200);

  if (text === "/start" || text === "/menu") {
    await sendMsg(chatId, "<b>Selamat Datang di BMS AI V5!</b>\nSilahkan pilih kategori model untuk memulai:", MENUS.main);
  } else {
    try {
      // Panggil API Groq (Default ke Llama 3.3 70B)
      const aiRes = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: text }]
      }, {
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" }
      });

      const reply = aiRes.data.choices[0].message.content;
      await sendMsg(chatId, reply);
    } catch (error) {
      console.error("Error Groq:", error.response?.data || error.message);
      await sendMsg(chatId, "⚠️ Maaf, terjadi gangguan saat menghubungi otak AI. Coba lagi nanti.");
    }
  }
  res.sendStatus(200);
});

async function sendMsg(chatId, text, buttons = null) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML"
  };
  if (buttons) {
    payload.reply_markup = { inline_keyboard: buttons };
  }
  try {
    await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, payload);
  } catch (e) {
    console.error("Error Telegram:", e.response?.data || e.message);
  }
}

// Render butuh port dinamis
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BMS AI V5 running on port ${PORT}`));
