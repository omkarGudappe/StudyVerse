const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const AIModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

const GenerateQuiz = async (subject, level) => {
  const prompt = `
You are a friendly tutor who creates fun and encouraging quizzes for students.  

The student’s academic level is: ${level}  
The subject or topic is: ${subject}  

✨ Instructions:
- Create **5 questions**, starting from easy → medium → hard.  
- Write questions in a **friendly, playful, and supportive tone** (like a teacher making students enjoy learning).  
  Example: “Let’s warm up with a simple one!” or “Final challenge 🎉, you’re almost there! or any other friendly tone”  
- Each question must have:
  - 4 options (A, B, C, D)  
  - The correct answer  
  - hint of the correct answer
  - A short explanation (2–3 sentences) that helps the student understand why it’s correct  
- Keep the questions age/level appropriate.  
- Return the output as **raw JSON only** (no markdown, no extra text, no code fences).  

Each quiz item in JSON must include these fields:  
- question
- options
- hint
- answer
- difficulty ('easy', 'medium', 'hard')  
- explanation  

 - Return only valid JSON, no markdown, no code fences, no extra text.    
 `;

  const result = await AIModel.generateContent(prompt);
  let response = result.response.text();

  response = response.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(response);
  } catch (err) {
    console.error("❌ JSON parse error:", err.message);
    console.error("🔎 Raw response was:", response);
    throw new Error("Failed to parse AI response");
  }
};

module.exports = { GenerateQuiz };
