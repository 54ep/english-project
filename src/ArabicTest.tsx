import React, { useState, useEffect } from "react";

interface ArabicTestProps {
  onBack?: () => void;
  words: { arabic: string; english: string }[];
}

function getRandomIndex(exclude: number | null, max: number) {
  let idx = Math.floor(Math.random() * max);
  while (exclude !== null && max > 1 && idx === exclude) {
    idx = Math.floor(Math.random() * max);
  }
  return idx;
}

const ArabicTest: React.FC<ArabicTestProps> = ({ onBack, words }) => {
  const [currentIdx, setCurrentIdx] = useState<number>(() =>
    getRandomIndex(null, words.length)
  );
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    // إذا تغيرت قائمة الكلمات (مثلاً عند تحميلها من الخادم)، اختر كلمة جديدة
    setCurrentIdx(getRandomIndex(null, words.length));
    setInput("");
    setFeedback(null);
    setShowAnswer(false);
  }, [words]);

  if (!words.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 p-2 sm:p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-purple-700 mb-4">
            اختبار الكلمات العربية
          </h2>
          <div className="text-gray-600">
            لا توجد كلمات متاحة للاختبار حالياً.
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="w-full mt-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-xl font-bold shadow hover:from-purple-600 hover:to-purple-700 transition-all"
            >
              العودة للرئيسية
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // استخراج الكلمة الإنجليزية فقط من الإجابة (أول كلمة إنجليزية متصلة)
    const userEnglish = input.trim().toLowerCase();
    const correct = (words[currentIdx].english.match(/[a-zA-Z-]+/g)?.[0] || "")
      .trim()
      .toLowerCase();
    if (userEnglish === correct) {
      setFeedback("إجابة صحيحة ✅");
      setShowAnswer(true);
    } else {
      setFeedback("إجابة خاطئة ❌ حاول مرة أخرى!");
      setShowAnswer(false);
    }
  };

  const handleNext = () => {
    const nextIdx = getRandomIndex(currentIdx, words.length);
    setCurrentIdx(nextIdx);
    setInput("");
    setFeedback(null);
    setShowAnswer(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 p-2 sm:p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-center mb-4 text-purple-700">
          اختبار الكلمات العربية
        </h2>
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-purple-100 to-purple-50 p-6 rounded-xl mb-4 border-2 border-purple-200">
            <span className="text-3xl font-bold text-purple-700" dir="rtl">
              {words[currentIdx].arabic}
            </span>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center"
              placeholder="اكتب الكلمة بالإنجليزية..."
              dir="ltr"
              autoFocus
              disabled={showAnswer}
            />
            <button
              type="submit"
              disabled={!input.trim() || showAnswer}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              تحقق
            </button>
          </form>
        </div>
        {feedback && (
          <div
            className={`text-center mb-4 ${
              showAnswer ? "text-green-700" : "text-red-700"
            } text-lg font-semibold`}
          >
            {feedback}
          </div>
        )}
        {showAnswer && (
          <div className="text-center mb-4 text-purple-800">
            الإجابة الصحيحة: <strong>{words[currentIdx].english}</strong>
          </div>
        )}
        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-purple-100 to-purple-300 text-purple-800 px-4 py-2 rounded-xl font-medium hover:from-purple-200 hover:to-purple-400 transition-colors"
          >
            كلمة جديدة
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-xl font-bold shadow hover:from-purple-600 hover:to-purple-700 transition-all"
            >
              العودة للرئيسية
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArabicTest;
