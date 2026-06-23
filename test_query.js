require('dotenv').config();
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
  try {
    const messages = [
      { role: "system", content: "You are Aethon Intelligence, an AI data analyst for an assessment platform. The database has tables: users (email, name, college_name, roll_number), assessments (id, title, test_type), student_results (id, student_email, assessment_id, score, percentage, submitted_at), proctoring_logs (id, student_email, assessment_id, log_type). If asked for data, return ONLY a valid SQL query wrapped in ```sql ... ```. If chatting, reply normally. For SQL, only use SELECT." },
      { role: "user", content: "Find students with security violations" }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content;
    console.log("AI Response:\n", aiResponse);

    const sqlMatch = aiResponse.match(/```sql\n([\s\S]*?)\n```/i) || aiResponse.match(/```([\s\S]*?)```/i);
    if (sqlMatch) {
      console.log("SQL extracted:", sqlMatch[1].trim());
    } else {
      console.log("No SQL found.");
    }
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
test();
