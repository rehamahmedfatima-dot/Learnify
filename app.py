from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os

app = Flask(__name__)
CORS(app)  # للسماح بالتواصل مع الواجهة الأمامية

# ============================================
# 🔑 أدخل مفتاحك هنا، أو استخدم متغيرات البيئة
# ============================================
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY") or "YOUR_OPENAI_API_KEY_HERE"
openai.api_key = OPENAI_API_KEY

# ============================================
# 📘 سياق الكتاب (معلومات أساسية لتحسين الإجابات)
# ============================================
BOOK_CONTEXT = """
أنت مدرس ذكي لتطبيق تعليم اللغة الفرنسية للمبتدئين.
الكتاب اسمه "Club @dos plus 1" وهو مخصص للصف الأول الثانوي.
يحتوي على 4 وحدات:
1. Le Club de ma classe (التعريف، الأصدقاء، الأعداد، الصفات)
2. Le Club des artistes (الهوايات، الأشهر، الأدوات المدرسية)
3. Le Club des lecteurs (المدرسة، الوقت، المواد، صفات الملكية)
4. Le Club des athlètes (وصف الأشخاص، العائلة، الرياضات)
أجب دائماً باللغة العربية مع تقديم كلمات فرنسية مفيدة، واشرح بطريقة بسيطة.
"""

# ============================================
# 🤖 نقطة النهاية: شرح النص
# ============================================
@app.route("/api/explain", methods=["POST"])
def explain_text():
    data = request.json
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "لا يوجد نص للشرح"}), 400

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"{BOOK_CONTEXT}\nقم بشرح النص التالي بطريقة مبسطة جداً، مع ذكر الكلمات المهمة ومعناها."},
                {"role": "user", "content": f"اشرح لي هذا النص: {text}"}
            ],
            temperature=0.7,
            max_tokens=300
        )
        explanation = response.choices[0].message.content
        return jsonify({"explanation": explanation})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# 💬 نقطة النهاية: الشات الذكي
# ============================================
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "")
    if not user_message:
        return jsonify({"error": "لا توجد رسالة"}), 400

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"{BOOK_CONTEXT}\nأنت مساعد تعليمي ودود. أجب عن أسئلة الطالب حول اللغة الفرنسية والكتاب."},
                {"role": "user", "content": user_message}
            ],
            temperature=0.8,
            max_tokens=500
        )
        reply = response.choices[0].message.content
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# 📝 نقطة النهاية: توليد اختبار من نص
# ============================================
@app.route("/api/generate_quiz", methods=["POST"])
def generate_quiz():
    data = request.json
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "لا يوجد نص"}), 400

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"{BOOK_CONTEXT}\nاقرأ النص التالي وولّد 3 أسئلة اختيار من متعدد (MCQ) مع الإجابات الصحيحة. أعد النتيجة على شكل مصفوفة JSON بهذا الشكل: [{{'question':'...', 'options':['a','b','c'], 'correct':'a'}}]"},
                {"role": "user", "content": f"النص: {text}"}
            ],
            temperature=0.8,
            max_tokens=600
        )
        quiz = response.choices[0].message.content
        # محاولة تحويل النص إلى JSON (يمكن تحسينه)
        import json
        try:
            quiz_data = json.loads(quiz)
            return jsonify({"quiz": quiz_data})
        except:
            # إذا لم يكن JSON صحيحاً، نعيد النص الخام
            return jsonify({"quiz": quiz, "raw": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# 🧠 نقطة النهاية: توليد خريطة ذهنية
# ============================================
@app.route("/api/mindmap", methods=["POST"])
def generate_mindmap():
    data = request.json
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "لا يوجد نص"}), 400

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"{BOOK_CONTEXT}\nاستخرج المفاهيم الرئيسية من النص وقدّمها على شكل قائمة بسيطة (مصفوفة نصوص)."},
                {"role": "user", "content": f"استخرج المفاهيم من: {text}"}
            ],
            temperature=0.6,
            max_tokens=300
        )
        concepts = response.choices[0].message.content
        return jsonify({"concepts": concepts})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# 🚀 تشغيل الخادم
# ============================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
