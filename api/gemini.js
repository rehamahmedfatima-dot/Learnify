// api/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// تهيئة Gemini باستخدام المفتاح من متغيرات البيئة
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // السماح فقط بـ POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { type, text, message } = req.body;

    // السياق الأساسي للكتاب (نفسه)
    const SYSTEM_CONTEXT = `أنت مدرس ذكي لتطبيق تعليم اللغة الفرنسية للمبتدئين.
الكتاب اسمه "Club @dos plus 1" وهو مخصص للصف الأول الثانوي.
يحتوي على 4 وحدات:
1. Le Club de ma classe (التعريف، الأصدقاء، الأعداد، الصفات)
2. Le Club des artistes (الهوايات، الأشهر، الأدوات المدرسية)
3. Le Club des lecteurs (المدرسة، الوقت، المواد، صفات الملكية)
4. Le Club des athlètes (وصف الأشخاص، العائلة، الرياضات)
أجب دائماً باللغة العربية مع تقديم كلمات فرنسية مفيدة، واشرح بطريقة بسيطة.`;

    let userPrompt = '';
    let responseType = 'text';

    // اختيار نوع الطلب
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
        responseType = 'json';
        break;
      default:
        return res.status(400).json({ error: 'نوع الطلب غير معروف' });
    }

    // استدعاء Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `${SYSTEM_CONTEXT}\n\n${userPrompt}`;
    const result = await model.generateContent(fullPrompt);
    const reply = result.response.text();

    // إذا كان نوع الطلب quiz، نحاول تحويل النص إلى JSON
    if (type === 'quiz') {
      try {
        // استخراج JSON من النص (قد يحتوي على نص إضافي)
        const jsonMatch = reply.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const quizData = JSON.parse(jsonMatch[0]);
          return res.status(200).json({ quiz: quizData });
        } else {
          // إذا لم نجد JSON، نعيد النص كخطأ
          return res.status(200).json({ quiz: reply, raw: true });
        }
      } catch (e) {
        return res.status(200).json({ quiz: reply, raw: true });
      }
    }

    // للـ explain و chat
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    return res.status(500).json({ error: 'فشل في معالجة الطلب' });
  }
}
