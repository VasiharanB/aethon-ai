require('dotenv').config();
const Groq = require('groq-sdk');
const db = require('./db');

async function test() {
  try {
    console.log("Testing DB connection...");
    await new Promise((res, rej) => db.query("SELECT 1", (err) => err ? rej(err) : res()));
    console.log("DB connection OK.");

    console.log("Testing Groq API...");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Hello" }],
      model: "llama3-70b-8192",
    });
    console.log("Groq API OK.");
  } catch (err) {
    console.error("ERROR CAUGHT:", err.message);
  } finally {
    process.exit();
  }
}
test();
