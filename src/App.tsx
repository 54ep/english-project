import React, { useState, useEffect } from 'react';
import {  Plus, Brain, List, Trash2, Edit3, Check, X, Search, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import WordsAPI, { Word, CustomLevel } from './api/wordsAPI';
 
type View = 'home' | 'add' | 'test' | 'list' | 'search' | 'edit' | 'errors' | 'test-success' | 'custom-levels' | 'custom-test';

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
  const [isErrorsTest, setIsErrorsTest] = useState(false); // لتتبع نوع الاختبار
  const [isCheckingCustomAnswer, setIsCheckingCustomAnswer] = useState(false); // لتتبع حالة التحقق في الاختبار المخصص

  // مصفوفات الكلمات للاختبارات
  const [testWords, setTestWords] = useState<Word[]>([]); // كلمات الاختبار العادي
  const [errorTestWords, setErrorTestWords] = useState<Word[]>([]); // كلمات اختبار الأخطاء
  const [customTestWords, setCustomTestWords] = useState<Word[]>([]);

  // مستويات الاختبار المخصص
  const [customLevels, setCustomLevels] = useState<CustomLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [showLevelForm, setShowLevelForm] = useState(false);
  const [newLevelName, setNewLevelName] = useState('');
  const [selectedWordsForLevel, setSelectedWordsForLevel] = useState<string[]>([]);

  // Edit level state
  const [editingLevel, setEditingLevel] = useState<CustomLevel | null>(null);
  const [editLevelName, setEditLevelName] = useState('');
  const [editLevelWords, setEditLevelWords] = useState<string[]>([]);

  // Load words from API on component mount
  useEffect(() => {
    loadWords();
    loadCustomLevels();
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

  const loadCustomLevels = async () => {
    try {
      setLoading(true);
      setError(null);
      const levels = await WordsAPI.getCustomLevels();
      setCustomLevels(levels);
      setIsOnline(true);
    } catch (error) {
      console.error('Error loading custom levels:', error);
      setError('خطأ في تحميل المستويات. تأكد من تشغيل الخادم.');
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
    // عند بدء الاختبار العادي، نسجل جميع الكلمات في مصفوفة
    setTestWords([...words]);
    // اختيار كلمة عشوائية من المصفوفة
    const randomIndex = Math.floor(Math.random() * words.length);
    setCurrentTestWord(words[randomIndex]);
    setUserAnswer('');
    setShowResult(false);
    setIsErrorsTest(false);
    setCurrentView('test');
  };

  // بدء اختبار للكلمات التي أخطأ المستخدم فيها
  const startErrorsTest = () => {
    // عند بدء اختبار الكلمات الصعبة، نسجل فقط الكلمات التي أخطأ فيها المستخدم
    const errorWords = words.filter(word => word.totalAttempts > word.correctAnswers && word.totalAttempts > 0);
    if (errorWords.length === 0) {
      setCurrentView('test-success');
      return;
    }
    setErrorTestWords([...errorWords]);
    const randomIndex = Math.floor(Math.random() * errorWords.length);
    setCurrentTestWord(errorWords[randomIndex]);
    setUserAnswer('');
    setShowResult(false);
    setIsErrorsTest(true);
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
      
      // إذا كانت الإجابة صحيحة، احذف الكلمة من المصفوفة
      if (isAnswerCorrect) {
        if (isErrorsTest) {
          setErrorTestWords(prev => prev.filter(word => word.id !== currentTestWord.id));
        } else {
          setTestWords(prev => prev.filter(word => word.id !== currentTestWord.id));
        }
      }
    } catch (error) {
      console.error('Error updating word statistics:', error);
      setError('خطأ في تحديث الإحصائيات.');
      setIsOnline(false);
    }
  };

  const nextQuestion = () => {
    if (isErrorsTest) {
      if (errorTestWords.length === 0) {
        setCurrentView('test-success');
        return;
      }
      // اختيار كلمة عشوائية من الكلمات المتبقية
      const randomIndex = Math.floor(Math.random() * errorTestWords.length);
      setCurrentTestWord(errorTestWords[randomIndex]);
      setUserAnswer('');
      setShowResult(false);
    } else {
      if (testWords.length === 0) {
        setCurrentView('test-success');
        return;
      }
      const randomIndex = Math.floor(Math.random() * testWords.length);
      setCurrentTestWord(testWords[randomIndex]);
      setUserAnswer('');
      setShowResult(false);
    }
  };

  const getStats = () => {
    const totalWords = words.length;
    const totalAttempts = words.reduce((sum, word) => sum + word.totalAttempts, 0);
    const correctAnswers = words.reduce((sum, word) => sum + word.correctAnswers, 0);
    const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
    
    return { totalWords, totalAttempts, correctAnswers, accuracy };
  };

  // الحصول على الكلمات التي أخطأ المستخدم فيها
  const getErrorWords = () => {
    return words.filter(word => 
      word.totalAttempts > word.correctAnswers && word.totalAttempts > 0
    );
  };

  const addCustomLevel = async () => {
    if (!newLevelName.trim() || selectedWordsForLevel.length === 0) return;
    try {
      setLoading(true);
      setError(null);
      const newLevel: CustomLevel = {
        name: newLevelName.trim(),
        wordIds: selectedWordsForLevel,
        attempts: 0,
        correctAnswers: 0
      };
      const savedLevel = await WordsAPI.addCustomLevel(newLevel);
      setCustomLevels(prev => [...prev, savedLevel]);
      setNewLevelName('');
      setSelectedWordsForLevel([]);
      setShowLevelForm(false);
      setIsOnline(true);
    } catch (error) {
      console.error('Error adding custom level:', error);
      setError('خطأ في حفظ المستوى. تأكد من الاتصال بالخادم أو أن اسم المستوى غير مكرر.');
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const startCustomTest = (level: CustomLevel) => {
    const wordsForLevel = words.filter(word => level.wordIds.includes(word.id));
    setCustomTestWords([...wordsForLevel]);
    setSelectedLevel(level.name);
    setCurrentView('custom-test');
    // اختيار كلمة عشوائية من المستوى
    if (wordsForLevel.length > 0) {
      const randomIndex = Math.floor(Math.random() * wordsForLevel.length);
      setCurrentTestWord(wordsForLevel[randomIndex]);
      setUserAnswer('');
      setShowResult(false);
    }
  };

  const checkCustomAnswer = async () => {
    if (!currentTestWord || !selectedLevel) return;
    setIsCheckingCustomAnswer(true);
    const isAnswerCorrect = userAnswer.trim().toLowerCase() === currentTestWord.arabic.toLowerCase();
    setIsCorrect(isAnswerCorrect);
    setShowResult(true);
    try {
      setError(null);
      const updatedWord = await WordsAPI.updateWordStats(currentTestWord.id, isAnswerCorrect);
      setWords(prevWords => prevWords.map(word => word.id === currentTestWord.id ? updatedWord : word));
      // تحديث إحصائيات المستوى نفسه
      const updatedLevel = await WordsAPI.updateCustomLevelStats(selectedLevel, isAnswerCorrect);
      setCustomLevels(prev => prev.map(level => level.name === selectedLevel ? updatedLevel : level));
      setIsOnline(true);
      if (isAnswerCorrect) {
        setCustomTestWords(prev => prev.filter(word => word.id !== currentTestWord.id));
      }
    } catch (error) {
      setError('خطأ في تحديث الإحصائيات.');
      setIsOnline(false);
    } finally {
      setIsCheckingCustomAnswer(false);
    }
  };

  const nextCustomQuestion = () => {
    if (customTestWords.length === 0) {
      setCurrentView('test-success');
      return;
    }
    const randomIndex = Math.floor(Math.random() * customTestWords.length);
    setCurrentTestWord(customTestWords[randomIndex]);
    setUserAnswer('');
    setShowResult(false);
  };

  const deleteCustomLevel = async (levelName: string) => {
    try {
      setLoading(true);
      setError(null);
      await WordsAPI.deleteCustomLevel(levelName);
      setCustomLevels(prev => prev.filter(level => level.name !== levelName));
      setIsOnline(true);
    } catch (error) {
      setError('خطأ في حذف المستوى. تأكد من الاتصال بالخادم.');
      setIsOnline(false);
      console.error('Error deleting custom level:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelStats = (level: CustomLevel) => {
    const total = level.wordIds.length;
    const attempts = level.attempts || 0;
    const correct = level.correctAnswers || 0;
    const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
    return { total, attempts, correct, accuracy };
  };

  const renderHome = () => {
    const stats = getStats();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 p-2 sm:p-4">
        {/* Header with connection status */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex flex-col items-center justify-center bg-purple-600 text-white px-6 py-3 rounded-2xl shadow-lg mb-2 sm:mb-0">
            <span className="text-lg font-bold mb-1">الكلمات المحفوظة</span>
            <span className="text-3xl font-extrabold">{stats.totalWords}</span>
            </div>
            <div className="flex flex-col items-end justify-center w-full sm:w-auto text-white px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-purple-500 shadow-lg">
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 tracking-tight drop-shadow">مُحفظ الكلمات</h1>
            <p className="text-sm sm:text-base opacity-90 mb-2">تعلم الإنجليزية بسهولة</p>
            <div className="flex items-center justify-center w-full gap-2 mt-1">
              {isOnline ? (
              <>
                <Wifi size={18} className="text-green-400 animate-pulse" />
                <span className="text-xs sm:text-sm text-green-300 font-semibold">متصل</span>
              </>
              ) : (
              <>
                <WifiOff size={18} className="text-red-400 animate-pulse" />
                <span className="text-xs sm:text-sm text-red-300 font-semibold">غير متصل</span>
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

        <div className="max-w-4xl mx-auto w-full">
          {/* Hero Image and Welcome */}
          <div className="text-center mb-8">
            <div className="bg-white rounded-2xl p-4 sm:p-6 mb-6 shadow-lg">
              <img 
                src="https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=800" 
                alt="مكتبة" 
                className="w-full h-32 sm:h-48 object-cover rounded-xl mb-4"
              />
              <h2 className="text-xl font-bold text-gray-800 mb-2">مرحباً بك في تطبيق حفظ الكلمات</h2>
              <p className="text-gray-600 text-sm">طور مفردات اللغة الإنجليزية الخاصة بك بطريقة تفاعلية وممتعة</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => setCurrentView('list')}
              className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group"
            >
              <div className="bg-green-500 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <List className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">مراجعة الكلمات</h3>
              <p className="text-xs text-gray-600">تصفح جميع الكلمات المحفوظة</p>
            </button>

            <button
              onClick={startTest}
              disabled={words.length === 0}
              className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group disabled:opacity-50"
            >
              <div className="bg-pink-500 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Brain className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">اختبر نفسك</h3>
              <p className="text-xs text-gray-600">تحدى نفسك وراجع الكلمات الإنجليزية</p>
            </button>

            <button
              onClick={() => setCurrentView('add')}
              className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group"
            >
              <div className="bg-blue-500 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Plus className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">إضافة كلمة جديدة</h3>
              <p className="text-xs text-gray-600">أضف كلمات إنجليزية جديدة مع ترجمتها العربية</p>
            </button>

            <button
              onClick={() => setCurrentView('custom-levels')}
              className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group"
            >
              <div className="bg-yellow-500 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Brain className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">اختبار مخصص</h3>
              <p className="text-xs text-gray-600">أنشئ مستوياتك الخاصة واختبر كلمات محددة</p>
            </button>
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setCurrentView('search')}
              className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group"
            >
              <div className="bg-purple-500 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Search className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">البحث</h3>
              <p className="text-xs text-gray-600">ابحث عن كلمات محددة بسرعة</p>
            </button>

            <button
              onClick={() => setCurrentView('edit')}
              className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group"
            >
              <div className="bg-orange-500 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Edit3 className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">تعديل الكلمات</h3>
              <p className="text-xs text-gray-600">حرر أو احذف الكلمات الموجودة</p>
            </button>

            <button
              onClick={() => setCurrentView('errors')}
              className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group"
            >
              <div className="bg-red-500 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 p-4">
        <div className="max-w-md w-full mx-auto">
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
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 p-4 flex items-center justify-center ">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {!showResult ? (
              <>
                <div className="text-center mb-6">
                  <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="text-white" size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {isErrorsTest ? 'اختبار الكلمات الصعبة' : 'اختبار المفردات'}
                  </h2>
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
              <div className="flex flex-col items-center justify-center text-center w-full gap-4">
                <div className={`flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl mb-6 shadow-lg border transition-all duration-300 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                  style={{ minWidth: '220px', maxWidth: '400px', margin: '0 auto' }}>
                  <div className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-4 shadow-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}> 
                    <span className={`text-4xl sm:text-5xl ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>{isCorrect ? '✅' : '❌'}</span>
                  </div>
                  <div className={`text-xl sm:text-2xl font-bold mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{isCorrect ? 'إجابة صحيحة!' : 'إجابة خاطئة'}</div>
                  <div className="text-gray-700 text-base sm:text-lg mb-1 font-semibold" dir="ltr"><strong>{currentTestWord.english}</strong></div>
                  <div className="text-gray-600 text-sm sm:text-base mb-2" dir="rtl">المعنى الصحيح: <strong>{currentTestWord.arabic}</strong></div>
                  {isCorrect ? (
                    <div className="bg-green-50 rounded-xl p-3 mt-2 shadow text-green-700 text-sm sm:text-base font-medium animate-fade-in">
                      رائع! استمر في هذا الأداء المميز، كل إجابة صحيحة تقربك من إتقان اللغة أكثر 💪✨
                    </div>
                  ) : (
                    <div className="bg-red-50 rounded-xl p-3 mt-2 shadow text-red-700 text-sm sm:text-base font-medium animate-fade-in">
                      لا تقلق! الخطأ جزء من التعلم، حاول مرة أخرى وستتحسن مهاراتك مع الوقت 🚀
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs sm:max-w-sm mx-auto">
                  <button
                    onClick={nextQuestion}
                    
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium shadow hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    كلمة أخرى
                  </button>
                  <button
                    onClick={() => setCurrentView('home')}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium shadow hover:bg-gray-200 transition-colors"
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-400 via-purple-500 to-pink-500 p-4">
        <div className="max-w-4xl w-full mx-auto">
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
      <div className="min-h-screen flex items-center justify-center flex-col bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 p-4">
        <div className="max-w-4xl w-full mx-auto">
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

  const renderTestSuccess = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-teal-600 p-4 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 text-center flex flex-col items-center">
            <div className="bg-green-100 p-8 rounded-full mb-6 flex flex-col items-center justify-center shadow-lg">
              <div className="text-green-500 text-7xl mb-2 animate-bounce">🎉</div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full bg-green-400"></div>
                <div className="h-3 w-3 rounded-full bg-green-400"></div>
                <div className="h-3 w-3 rounded-full bg-green-400"></div>
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-green-800 mb-3">مبروك! أجتزت الاختبار بنجاح</h2>
            <p className="text-green-700 mb-4 text-lg">لقد أجبت بشكل صحيح على جميع الكلمات في هذا الاختبار 🎯</p>
            <div className="bg-green-50 rounded-xl p-4 mb-6 shadow">
              <p className="text-green-800 text-base font-medium">استمر في الممارسة للحفاظ على مستواك الممتاز، كلما تدربت أكثر زادت مهارتك! 💪</p>
            </div>
            <div className="mb-6">
              <span className="text-green-600 font-bold">نسبة النجاح: </span>
              <span className="text-green-700 text-xl font-extrabold">100%</span>
            </div>
            <div className="space-y-3 w-full">
              <button
                onClick={() => setCurrentView('add')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow"
              >
                إضافة كلمات جديدة
              </button>
              <button
                onClick={() => setCurrentView('home')}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors shadow"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderErrorsView = () => {
    const errorWords = getErrorWords();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 via-red-500 to-pink-500 p-4 flex items-center justify-center">
        <div className="max-w-4xl w-full mx-auto">
          <div className="text-center mb-6">
            <div className="bg-white rounded-2xl p-4 inline-block mb-4">
              <AlertCircle className="text-red-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">مراجعة الأخطاء</h2>
            <p className="text-red-100">تعلم من أخطائك السابقة ({errorWords.length} كلمة)</p>
          </div>

          {errorWords.length > 0 ? (
            <>
              <div className="space-y-3 mb-6">
                {errorWords.map((word) => (
                  <div key={word.id} className="bg-white rounded-xl shadow-lg p-4">
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
                        <div className="text-sm text-red-500 mt-2" dir="rtl">
                          نجح {word.correctAnswers} من {word.totalAttempts} محاولة
                          <span className="mr-2 text-gray-500">•</span>
                          نسبة الخطأ: {Math.round(((word.totalAttempts - word.correctAnswers) / word.totalAttempts) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-4 mb-6">
                <button
                  onClick={() => startErrorsTest()}
                  className="bg-white text-red-600 px-6 py-3 rounded-xl font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <Brain size={20} />
                  اختبار الكلمات الصعبة
                </button>
                <p className="text-white text-sm opacity-90">
                  سيتم اختبارك فقط على الكلمات التي أخطأت فيها سابقاً
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-white text-6xl mb-4">🎉</div>
              <p className="text-red-100 mb-4">أحسنت! ليس لديك أخطاء لمراجعتها</p>
              <p className="text-white text-sm opacity-80 mb-6">حاول اختبار نفسك على المزيد من الكلمات</p>
              <button
                onClick={() => startTest()}
                className="bg-white text-red-600 px-6 py-3 rounded-xl font-medium hover:bg-red-50 transition-colors flex items-center gap-2 mx-auto"
              >
                <Brain size={20} />
                ابدأ اختبار جديد
              </button>
            </div>
          )}

          <div className="text-center mt-6">
            <button
              onClick={() => setCurrentView('home')}
              className="bg-white text-red-600 px-6 py-3 rounded-xl font-medium hover:bg-red-50 transition-colors"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomLevels = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-600 p-4">
      <div className="max-w-2xl w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">الاختبارات المخصصة</h2>
          <p className="text-gray-600 text-sm mb-4">أنشئ مستوياتك الخاصة وأضف كلمات من القائمة المحفوظة</p>
          <button
            onClick={() => setShowLevelForm(true)}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors mb-4"
          >
            إضافة مستوى جديد
          </button>
          {customLevels.length === 0 && <div className="text-gray-500 mb-4">لا توجد مستويات بعد</div>}
          {customLevels.map(level => {
            const stats = getLevelStats(level);
            return (
              <div key={level.name} className="bg-yellow-50 rounded-xl p-4 mb-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-yellow-700">{level.name}</div>
                  <div className="text-xs text-gray-600">عدد الكلمات: {level.wordIds.length}</div>
                  <div className="text-xs text-gray-600">إجمالي المحاولات: {stats.attempts}</div>
                  <div className="text-xs text-gray-600">إجابات صحيحة: {stats.correct}</div>
                  <div className="text-xs text-gray-600">نسبة النجاح: {stats.accuracy}%</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startCustomTest(level)}
                    className="bg-yellow-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                  >
                    بدء اختبار المستوى
                  </button>
                  <button
                    onClick={() => startEditLevel(level)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => deleteCustomLevel(level.name)}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {showLevelForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">إضافة مستوى جديد</h2>
            <p className="text-gray-600 text-sm mb-4">اختر اسمًا فريدًا للمستوى وحدد الكلمات المراد تضمينها</p>
            <input
              type="text"
              value={newLevelName}
              onChange={e => setNewLevelName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              placeholder="اسم المستوى (مثلاً: مبتدئ، متوسط، صعب)"
            />
            <div className="mb-4">
              <div className="font-bold mb-2">اختر الكلمات من القائمة المحفوظة:</div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {words.map(word => (
                  <label key={word.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedWordsForLevel.includes(word.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedWordsForLevel(prev => [...prev, word.id]);
                        } else {
                          setSelectedWordsForLevel(prev => prev.filter(id => id !== word.id));
                        }
                      }}
                    />
                    <span className="text-blue-700 font-bold">{word.english}</span>
                    <span className="text-gray-600">{word.arabic}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={addCustomLevel}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
            >
              حفظ المستوى
            </button>
            <button
              onClick={() => setShowLevelForm(false)}
              className="ml-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              إلغاء
            </button>
          </div>
        )}
        {editingLevel && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-lg font-bold mb-2">تعديل المستوى</h3>
            <input
              type="text"
              value={editLevelName}
              onChange={e => setEditLevelName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              placeholder="اسم المستوى الجديد"
            />
            <div className="mb-4">
              <div className="font-bold mb-2">تعديل الكلمات في المستوى:</div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {words.map(word => (
                  <label key={word.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1">
                    <input
                      type="checkbox"
                      checked={editLevelWords.includes(word.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setEditLevelWords(prev => [...prev, word.id]);
                        } else {
                          setEditLevelWords(prev => prev.filter(id => id !== word.id));
                        }
                      }}
                    />
                    <span className="text-blue-700 font-bold">{word.english}</span>
                    <span className="text-gray-600">{word.arabic}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={saveEditLevel}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              حفظ التعديلات
            </button>
            <button
              onClick={cancelEditLevel}
              className="ml-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              إلغاء
            </button>
          </div>
        )}
      </div>
      <div className="text-center mt-6">
        <button
          onClick={() => setCurrentView('home')}
          className="bg-white text-yellow-600 px-6 py-3 rounded-xl font-medium hover:bg-yellow-50 transition-colors"
        >
          العودة للرئيسية
        </button>
      </div>
    </div>
  );

  const renderCustomTest = () => {
    if (!currentTestWord) return null;
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-600 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {!showResult ? (
              <>
                <div className="text-center mb-6">
                  <div className="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="text-white" size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">اختبار مستوى: {selectedLevel}</h2>
                  <p className="text-gray-600 text-sm">ما معنى هذه الكلمة بالعربية؟</p>
                </div>
                <div className="text-center mb-6">
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl mb-4 border-2 border-yellow-100">
                    <div className="text-3xl font-bold text-yellow-600 mb-2" dir="ltr">{currentTestWord.english}</div>
                  </div>
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-center"
                    placeholder="اكتب المعنى بالعربية..."
                    dir="rtl"
                    onKeyPress={e => e.key === 'Enter' && !isCheckingCustomAnswer && checkCustomAnswer()}
                    disabled={isCheckingCustomAnswer}
                  />
                </div>
                <button
                  onClick={checkCustomAnswer}
                  disabled={!userAnswer.trim() || isCheckingCustomAnswer}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 rounded-xl font-medium hover:from-yellow-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingCustomAnswer ? 'جاري التحقق...' : 'تحقق من الإجابة'}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center w-full gap-4">
                <div className={`flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl mb-6 shadow-lg border transition-all duration-300 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                  style={{ minWidth: '220px', maxWidth: '400px', margin: '0 auto' }}>
                  <div className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-4 shadow-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}> 
                    <span className={`text-4xl sm:text-5xl ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>{isCorrect ? '✅' : '❌'}</span>
                  </div>
                  <div className={`text-xl sm:text-2xl font-bold mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{isCorrect ? 'إجابة صحيحة!' : 'إجابة خاطئة'}</div>
                  <div className="text-gray-700 text-base sm:text-lg mb-1 font-semibold" dir="ltr"><strong>{currentTestWord.english}</strong></div>
                  <div className="text-gray-600 text-sm sm:text-base" dir="rtl">المعنى الصحيح: <strong>{currentTestWord.arabic}</strong></div>
                  {isCorrect ? (
                    <div className="bg-green-50 rounded-xl p-3 mt-2 shadow text-green-700 text-sm sm:text-base font-medium animate-fade-in">
                      رائع! استمر في هذا الأداء المميز، كل إجابة صحيحة تقربك من إتقان اللغة أكثر 💪✨
                    </div>
                  ) : (
                    <div className="bg-red-50 rounded-xl p-3 mt-2 shadow text-red-700 text-sm sm:text-base font-medium animate-fade-in">
                      لا تقلق! الخطأ جزء من التعلم، حاول مرة أخرى وستتحسن مهاراتك مع الوقت 🚀
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs sm:max-w-sm mx-auto">
                  <button
                    disabled={isCheckingCustomAnswer}
                    onClick={nextCustomQuestion}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 rounded-xl font-medium hover:from-yellow-600 hover:to-orange-700 transition-all"
                  >
                    كلمة أخرى
                  </button>
                  <button
                    onClick={() => { setCurrentView('custom-levels'); }}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    العودة للمستويات
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  function startEditLevel(level: CustomLevel) {
    setEditingLevel(level);
    setEditLevelName(level.name);
    setEditLevelWords([...level.wordIds]);
  }

  async function saveEditLevel() {
    if (!editingLevel) return;
    if (!editLevelName.trim() || editLevelWords.length === 0) return;
    try {
      setLoading(true);
      setError(null);
      await WordsAPI.deleteCustomLevel(editingLevel.name);
      const updatedLevel: CustomLevel = {
        name: editLevelName.trim(),
        wordIds: editLevelWords,
        attempts: editingLevel.attempts || 0,
        correctAnswers: editingLevel.correctAnswers || 0
      };
      const savedLevel = await WordsAPI.addCustomLevel(updatedLevel);
      setCustomLevels(prev => prev.map(l => l.name === editingLevel.name ? savedLevel : l));
      cancelEditLevel();
      setIsOnline(true);
    } catch (error) {
      setError('خطأ في تعديل المستوى. تأكد من الاتصال بالخادم أو أن اسم المستوى غير مكرر.');
      setIsOnline(false);
      console.error('Error updating custom level:', error);
    } finally {
      setLoading(false);
    }
  }

  function cancelEditLevel() {
    setEditingLevel(null);
    setEditLevelName('');
    setEditLevelWords([]);
  }

  return (
    <div className="font-sans">
      {currentView === 'home' && renderHome()}
      {currentView === 'add' && renderAddWord()}
      {currentView === 'test' && renderTest()}
      {currentView === 'list' && renderWordList()}
      {currentView === 'search' && renderSearch()}
      {currentView === 'edit' && renderWordList()}
      {currentView === 'errors' && renderErrorsView()}
      {currentView === 'custom-levels' && renderCustomLevels()}
      {currentView === 'custom-test' && renderCustomTest()}
      {currentView === 'test-success' && renderTestSuccess()}
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