import React, { useState, useEffect } from 'react';
import {  Plus, Brain, List, Trash2, Edit3, Check, X, Search, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import WordsAPI, { Word } from './api/wordsAPI';
 
type View = 'home' | 'add' | 'test' | 'list' | 'search' | 'edit' | 'errors';

function App() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [englishInput, setEnglishInput] = useState('');
  const [arabicInput, setArabicInput] = useState('');
  const [currentTestWord, setCurrentTestWord] = useState<Word | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [editingWord, setEditingWord] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load words from API on component mount
  useEffect(() => {
    loadWords();
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    const health = await WordsAPI.checkHealth();
    setIsOnline(health);
  };

  const loadWords = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedWords = await WordsAPI.getWords();
      setWords(fetchedWords);
      setIsOnline(true);
    } catch (error) {
      console.error('Error loading words:', error);
      setError('خطأ في تحميل الكلمات. تأكد من تشغيل الخادم.');
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const addWord = async () => {
    if (englishInput.trim() && arabicInput.trim()) {
      try {
        setLoading(true);
        setError(null);
        const newWord = await WordsAPI.addWord(englishInput.trim(), arabicInput.trim());
        setWords(prevWords => [...prevWords, newWord]);
        setEnglishInput('');
        setArabicInput('');
        setIsOnline(true);
      } catch (error) {
        console.error('Error adding word:', error);
        setError('خطأ في إضافة الكلمة. تأكد من الاتصال بالخادم.');
        setIsOnline(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteWord = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await WordsAPI.deleteWord(id);
      setWords(prevWords => prevWords.filter(word => word.id !== id));
      setIsOnline(true);
    } catch (error) {
      console.error('Error deleting word:', error);
      setError('خطأ في حذف الكلمة. تأكد من الاتصال بالخادم.');
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const updateWord = async (id: string, english: string, arabic: string) => {
    try {
      setLoading(true);
      setError(null);
      const updatedWord = await WordsAPI.updateWord(id, english.trim(), arabic.trim());
      setWords(prevWords => 
        prevWords.map(word => word.id === id ? updatedWord : word)
      );
      setEditingWord(null);
      setIsOnline(true);
    } catch (error) {
      console.error('Error updating word:', error);
      setError('خطأ في تحديث الكلمة. تأكد من الاتصال بالخادم.');
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    if (words.length === 0) return;
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentTestWord(randomWord);
    setUserAnswer('');
    setShowResult(false);
    setCurrentView('test');
  };

  const checkAnswer = async () => {
    if (!currentTestWord) return;
    
    const isAnswerCorrect = userAnswer.trim().toLowerCase() === currentTestWord.arabic.toLowerCase();
    setIsCorrect(isAnswerCorrect);
    setShowResult(true);

    // Update statistics via API
    try {
      setError(null);
      const updatedWord = await WordsAPI.updateWordStats(currentTestWord.id, isAnswerCorrect);
      setWords(prevWords => 
        prevWords.map(word => word.id === currentTestWord.id ? updatedWord : word)
      );
      setIsOnline(true);
    } catch (error) {
      console.error('Error updating word statistics:', error);
      setError('خطأ في تحديث الإحصائيات.');
      setIsOnline(false);
    }
  };

  const nextQuestion = () => {
    startTest();
  };

  const getStats = () => {
    const totalWords = words.length;
    const totalAttempts = words.reduce((sum, word) => sum + word.totalAttempts, 0);
    const correctAnswers = words.reduce((sum, word) => sum + word.correctAnswers, 0);
    const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
    
    return { totalWords, totalAttempts, correctAnswers, accuracy };
  };

  const renderHome = () => {
    const stats = getStats();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 p-4">
        {/* Header with connection status */}
        <div className="flex justify-between items-center mb-8">
          <div className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm">
            الكلمات المحفوظة
            <br />
            {stats.totalWords}
          </div>
          <div className="text-white text-right">
            <h1 className="text-xl font-bold">مُحفظ الكلمات</h1>
            <p className="text-sm opacity-90">تعلم الإنجليزية بسهولة</p>
            <div className="flex items-center gap-1 mt-1">
              {isOnline ? (
                <>
                  <Wifi size={16} className="text-green-300" />
                  <span className="text-xs text-green-300">متصل</span>
                </>
              ) : (
                <>
                  <WifiOff size={16} className="text-red-300" />
                  <span className="text-xs text-red-300">غير متصل</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <button
              onClick={loadWords}
              className="mt-2 bg-red-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-red-700"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="bg-white bg-opacity-90 rounded-xl p-4 mb-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-purple-600">جاري التحميل...</p>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Hero Image and Welcome */}
          <div className="text-center mb-8">
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
              <img 
                src="https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=800" 
                alt="مكتبة" 
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
              <h2 className="text-xl font-bold text-gray-800 mb-2">مرحباً بك في تطبيق حفظ الكلمات</h2>
              <p className="text-gray-600 text-sm">طور مفردات اللغة الإنجليزية الخاصة بك بطريقة تفاعلية وممتعة</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-4 rounded-2xl text-center">
              <div className="text-2xl font-bold">{stats.accuracy}</div>
              <div className="text-sm opacity-90">نسبة النجاح</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-500 text-white p-4 rounded-2xl text-center">
              <div className="text-2xl font-bold">{stats.correctAnswers}</div>
              <div className="text-sm opacity-90">إجابات صحيحة</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-2xl text-center">
              <div className="text-2xl font-bold">{stats.totalWords}</div>
              <div className="text-sm opacity-90">إجمالي الكلمات</div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => setCurrentView('list')}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group"
            >
              <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <List className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">مراجعة الكلمات</h3>
              <p className="text-xs text-gray-600">تصفح جميع الكلمات المحفوظة</p>
            </button>

            <button
              onClick={startTest}
              disabled={words.length === 0}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group disabled:opacity-50"
            >
              <div className="bg-pink-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Brain className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">اختبر نفسك</h3>
              <p className="text-xs text-gray-600">تحدى نفسك وراجع الكلمات الإنجليزية</p>
            </button>

            <button
              onClick={() => setCurrentView('add')}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group"
            >
              <div className="bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Plus className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">إضافة كلمة جديدة</h3>
              <p className="text-xs text-gray-600">أضف كلمات إنجليزية جديدة مع ترجمتها العربية</p>
            </button>
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setCurrentView('search')}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group"
            >
              <div className="bg-purple-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Search className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">البحث</h3>
              <p className="text-xs text-gray-600">ابحث عن كلمات محددة بسرعة</p>
            </button>

            <button
              onClick={() => setCurrentView('edit')}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group"
            >
              <div className="bg-orange-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Edit3 className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">تعديل الكلمات</h3>
              <p className="text-xs text-gray-600">حرر أو احذف الكلمات الموجودة</p>
            </button>

            <button
              onClick={() => setCurrentView('errors')}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group"
            >
              <div className="bg-red-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <AlertCircle className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">مراجعة الأخطاء</h3>
              <p className="text-xs text-gray-600">راجع الإجابات الخاطئة لتحسين أدائك</p>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddWord = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="text-center mb-6">
              <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="text-white" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">إضافة كلمة جديدة</h2>
              <p className="text-gray-600 text-sm">أضف كلمة إنجليزية جديدة مع ترجمتها العربية</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الكلمة الإنجليزية</label>
                <input
                  type="text"
                  value={englishInput}
                  onChange={(e) => setEnglishInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="اكتب الكلمة الإنجليزية..."
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المعنى بالعربية</label>
                <input
                  type="text"
                  value={arabicInput}
                  onChange={(e) => setArabicInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="اكتب المعنى بالعربية..."
                  dir="rtl"
                />
              </div>

              <button
                onClick={addWord}
                disabled={!englishInput.trim() || !arabicInput.trim() || loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  'حفظ الكلمة'
                )}
              </button>
            </div>

            <button
              onClick={() => setCurrentView('home')}
              className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTest = () => {
    if (!currentTestWord) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {!showResult ? (
              <>
                <div className="text-center mb-6">
                  <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="text-white" size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">اختبار المفردات</h2>
                  <p className="text-gray-600 text-sm">ما معنى هذه الكلمة بالعربية؟</p>
                </div>

                <div className="text-center mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mb-4 border-2 border-blue-100">
                    <div className="text-3xl font-bold text-blue-600 mb-2" dir="ltr">
                      {currentTestWord.english}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-center"
                    placeholder="اكتب المعنى بالعربية..."
                    dir="rtl"
                    onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                  />
                </div>

                <button
                  onClick={checkAnswer}
                  disabled={!userAnswer.trim()}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  تحقق من الإجابة
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className={`p-6 rounded-xl mb-6 ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                  <div className={`text-6xl mb-3 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {isCorrect ? '✅' : '❌'}
                  </div>
                  <div className="text-lg font-bold mb-2">
                    {isCorrect ? 'إجابة صحيحة!' : 'إجابة خاطئة'}
                  </div>
                  <div className="text-gray-700">
                    <div className="mb-1" dir="ltr"><strong>{currentTestWord.english}</strong></div>
                    <div dir="rtl">المعنى الصحيح: <strong>{currentTestWord.arabic}</strong></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={nextQuestion}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    كلمة أخرى
                  </button>
                  
                  <button
                    onClick={() => setCurrentView('home')}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    العودة للرئيسية
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWordList = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-pink-500 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="bg-white rounded-2xl p-4 inline-block mb-4">
              <List className="text-purple-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">قائمة الكلمات المحفوظة</h2>
            <p className="text-purple-100">إجمالي {words.length} كلمة</p>
          </div>

          <div className="space-y-3 mb-6">
            {words.map((word) => (
              <div key={word.id} className="bg-white rounded-xl shadow-lg p-4">
                {editingWord === word.id ? (
                  <EditWordForm
                    word={word}
                    onSave={(english, arabic) => updateWord(word.id, english, arabic)}
                    onCancel={() => setEditingWord(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg" dir="ltr">
                          {word.english}
                        </div>
                        <div className="text-lg text-gray-700 bg-gray-50 px-3 py-1 rounded-lg" dir="rtl">
                          {word.arabic}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-2" dir="rtl">
                        أضيفت في {word.dateAdded} • 
                        {word.totalAttempts > 0 && (
                          <> نجح {word.correctAnswers} من {word.totalAttempts} محاولة</>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingWord(word.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => deleteWord(word.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {words.length === 0 && (
            <div className="text-center py-12">
              <div className="text-white text-6xl mb-4">📚</div>
              <p className="text-purple-100 mb-4">لا توجد كلمات محفوظة بعد</p>
              <button
                onClick={() => setCurrentView('add')}
                className="bg-white text-purple-600 px-6 py-3 rounded-xl font-medium hover:bg-purple-50 transition-colors"
              >
                أضف كلمتك الأولى
              </button>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => setCurrentView('home')}
              className="bg-white text-purple-600 px-6 py-3 rounded-xl font-medium hover:bg-purple-50 transition-colors"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSearch = () => {
    const filteredWords = words.filter(word => 
      word.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.arabic.includes(searchTerm)
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="bg-white rounded-2xl p-4 inline-block mb-4">
              <Search className="text-purple-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">البحث في الكلمات</h2>
            <p className="text-purple-100">ابحث عن كلمة محددة</p>
          </div>

          <div className="bg-white rounded-xl p-4 mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="ابحث بالإنجليزية أو العربية..."
            />
          </div>

          <div className="space-y-3 mb-6">
            {filteredWords.map((word) => (
              <div key={word.id} className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="text-lg font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg" dir="ltr">
                    {word.english}
                  </div>
                  <div className="text-lg text-gray-700 bg-gray-50 px-3 py-1 rounded-lg" dir="rtl">
                    {word.arabic}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredWords.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <div className="text-white text-6xl mb-4">🔍</div>
              <p className="text-purple-100">لم يتم العثور على نتائج</p>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => setCurrentView('home')}
              className="bg-white text-purple-600 px-6 py-3 rounded-xl font-medium hover:bg-purple-50 transition-colors"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans">
      {currentView === 'home' && renderHome()}
      {currentView === 'add' && renderAddWord()}
      {currentView === 'test' && renderTest()}
      {currentView === 'list' && renderWordList()}
      {currentView === 'search' && renderSearch()}
      {(currentView === 'edit' || currentView === 'errors') && renderWordList()}
    </div>
  );
}

const EditWordForm: React.FC<{
  word: Word;
  onSave: (english: string, arabic: string) => void;
  onCancel: () => void;
}> = ({ word, onSave, onCancel }) => {
  const [english, setEnglish] = useState(word.english);
  const [arabic, setArabic] = useState(word.arabic);

  const handleSave = () => {
    if (english.trim() && arabic.trim()) {
      onSave(english, arabic);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <input
          type="text"
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          dir="ltr"
        />
        <input
          type="text"
          value={arabic}
          onChange={(e) => setArabic(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          dir="rtl"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Check size={16} />
          حفظ
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <X size={16} />
          إلغاء
        </button>
      </div>
    </div>
  );
};

export default App;