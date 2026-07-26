// api/ai.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API key missing',
        details: 'GEMINI_API_KEY environment variable is not set'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // ✅ التعديل هنا: تغيير اسم النموذج
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    const { type, text, message } = req.body;

    const SYSTEM_CONTEXT = `أنت مدرس ذكي لتطبيق تعليم اللغة الفرنسية للمبتدئين.
الكتاب اسمه "Club @dos plus 1" وهو مخصص للصف الأول الثانوي.
يحتوي على 4 وحدات:
1. Le Club de ma classe (التعريف، الأصدقاء، الأعداد، الصفات)
2. Le Club des artistes (الهوايات، الأشهر، الأدوات المدرسية)
3. Le Club des lecteurs (المدرسة، الوقت، المواد، صفات الملكية)
4. Le Club des athlètes (وصف الأشخاص، العائلة، الرياضات)
أجب دائماً باللغة العربية مع تقديم كلمات فرنسية مفيدة، واشرح بطريقة بسيطة.`;

    let userPrompt = '';
    let isQuiz = false;

    switch (type) {
      case 'explain':
        userPrompt = `اشرح لي هذا النص بطريقة مبسطة جداً، مع ذكر الكلمات المهمة ومعناها: ${text}`;
        break;
      case 'chat':
        userPrompt = message;
        break;
      case 'quiz':
        userPrompt = `اقرأ النص التالي وولّد 3 أسئلة اختيار من متعدد (MCQ) مع الإجابات الصحيحة. أعد النتيجة على شكل JSON فقط بهذا الشكل: [{"question":"...", "options":["a","b","c"], "correct":"a"}] 
النص: ${text}`;
        isQuiz = true;
        break;
      default:
        return res.status(400).json({ error: 'نوع الطلب غير معروف' });
    }

    const fullPrompt = `${SYSTEM_CONTEXT}\n\n${userPrompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let reply = response.text();

    if (isQuiz) {
      try {
        const jsonMatch = reply.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const quizData = JSON.parse(jsonMatch[0]);
          return res.status(200).json({ quiz: quizData });
        } else {
          return res.status(200).json({ quiz: reply, raw: true });
        }
      } catch (e) {
        return res.status(200).json({ quiz: reply, raw: true });
      }
    }

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({ 
      error: 'فشل في معالجة الطلب',
      details: error.message
    });
  }
}
