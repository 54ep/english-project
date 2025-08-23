import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// عرض الملفات الثابتة للتطبيق المبني
app.use(express.static(path.join(__dirname, '../dist')));

// Path to the JSON file where words will be stored
const WORDS_FILE = path.join(__dirname, 'data', 'words.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(WORDS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Initialize the words file if it doesn't exist
async function initializeWordsFile() {
  try {
    await fs.access(WORDS_FILE);
  } catch {
    // File doesn't exist, create it with empty array
    await fs.writeFile(WORDS_FILE, JSON.stringify([], null, 2));
  }
}

// Read words from JSON file
async function readWords() {
  try {
    const data = await fs.readFile(WORDS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading words file:', error);
    return [];
  }
}

// Write words to JSON file
async function writeWords(words) {
  try {
    await fs.writeFile(WORDS_FILE, JSON.stringify(words, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing words file:', error);
    return false;
  }
}

// Routes

// Get all words
app.get('/api/words', async (req, res) => {
  try {
    const words = await readWords();
    res.json(words);
  } catch (error) {
    res.status(500).json({ error: 'خطأ في قراءة الكلمات' });
  }
});

// Add a new word
app.post('/api/words', async (req, res) => {
  try {
    const { english, arabic } = req.body;
    
    if (!english || !arabic) {
      return res.status(400).json({ error: 'الكلمة الإنجليزية والعربية مطلوبة' });
    }

    const words = await readWords();
    const newWord = {
      id: Date.now().toString(),
      english: english.trim(),
      arabic: arabic.trim(),
      dateAdded: new Date().toLocaleDateString('ar-SA'),
      correctAnswers: 0,
      totalAttempts: 0
    };

    words.push(newWord);
    const success = await writeWords(words);
    
    if (success) {
      res.status(201).json(newWord);
    } else {
      res.status(500).json({ error: 'خطأ في حفظ الكلمة' });
    }
  } catch (error) {
    res.status(500).json({ error: 'خطأ في إضافة الكلمة' });
  }
});

// Update a word
app.put('/api/words/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const words = await readWords();
    const wordIndex = words.findIndex(word => word.id === id);
    
    if (wordIndex === -1) {
      return res.status(404).json({ error: 'الكلمة غير موجودة' });
    }

    words[wordIndex] = { ...words[wordIndex], ...updates };
    const success = await writeWords(words);
    
    if (success) {
      res.json(words[wordIndex]);
    } else {
      res.status(500).json({ error: 'خطأ في تحديث الكلمة' });
    }
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تحديث الكلمة' });
  }
});

// Delete a word
app.delete('/api/words/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const words = await readWords();
    const filteredWords = words.filter(word => word.id !== id);
    
    if (words.length === filteredWords.length) {
      return res.status(404).json({ error: 'الكلمة غير موجودة' });
    }

    const success = await writeWords(filteredWords);
    
    if (success) {
      res.json({ message: 'تم حذف الكلمة بنجاح' });
    } else {
      res.status(500).json({ error: 'خطأ في حذف الكلمة' });
    }
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف الكلمة' });
  }
});

// Update word statistics
app.post('/api/words/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { isCorrect } = req.body;
    
    const words = await readWords();
    const wordIndex = words.findIndex(word => word.id === id);
    
    if (wordIndex === -1) {
      return res.status(404).json({ error: 'الكلمة غير موجودة' });
    }

    words[wordIndex].totalAttempts += 1;
    if (isCorrect) {
      words[wordIndex].correctAnswers += 1;
    }

    const success = await writeWords(words);
    
    if (success) {
      res.json(words[wordIndex]);
    } else {
      res.status(500).json({ error: 'خطأ في تحديث الإحصائيات' });
    }
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تحديث الإحصائيات' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// عرض صفحة التطبيق الرئيسية لأي route غير موجود
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Initialize and start server
async function startServer() {
  try {
    await ensureDataDirectory();
    await initializeWordsFile();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 Words data stored in: ${WORDS_FILE}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer();
