import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// عرض الملفات الثابتة للتطبيق المبني
app.use(express.static(path.join(__dirname, "../dist")));

// Path to the JSON file where words will be stored
const WORDS_FILE = path.join(__dirname, "data", "words.json");

// Path to the JSON file for custom levels
const CUSTOM_LEVELS_FILE = path.join(__dirname, "data", "custom-levels.json");

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

// Initialize the custom levels file if it doesn't exist
async function initializeCustomLevelsFile() {
  try {
    await fs.access(CUSTOM_LEVELS_FILE);
  } catch {
    await fs.writeFile(CUSTOM_LEVELS_FILE, JSON.stringify([], null, 2));
  }
}

// Read words from JSON file
async function readWords() {
  try {
    const data = await fs.readFile(WORDS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading words file:", error);
    return [];
  }
}

// Write words to JSON file
async function writeWords(words) {
  try {
    await fs.writeFile(WORDS_FILE, JSON.stringify(words, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing words file:", error);
    return false;
  }
}

// Read custom levels from JSON file
async function readCustomLevels() {
  try {
    const data = await fs.readFile(CUSTOM_LEVELS_FILE, "utf8");
    // add level type if missing for backward compatibility
    const levels = JSON.parse(data);
    levels.forEach((level) => {
      if (!level.type) {
        level.type = 1; // default to English if type is missing
      }
    });
    await writeCustomLevels(levels); // update file with new types
    return levels;
  } catch (error) {
    console.error("Error reading custom levels file:", error);
    return [];
  }
}

// Write custom levels to JSON file
async function writeCustomLevels(levels) {
  try {
    await fs.writeFile(CUSTOM_LEVELS_FILE, JSON.stringify(levels, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing custom levels file:", error);
    return false;
  }
}

// Routes

// Get all words
app.get("/api/words", async (req, res) => {
  try {
    const words = await readWords();
    res.json(words);
  } catch (error) {
    res.status(500).json({ error: "خطأ في قراءة الكلمات" });
  }
});

// Add a new word
app.post("/api/words", async (req, res) => {
  try {
    const { english, arabic } = req.body;

    if (!english || !arabic) {
      return res
        .status(400)
        .json({ error: "الكلمة الإنجليزية والعربية مطلوبة" });
    }

    const words = await readWords();
    const newWord = {
      id: Date.now().toString(),
      english: english.trim(),
      arabic: arabic.trim(),
      dateAdded: new Date().toLocaleDateString("ar-SA"),
      correctAnswers: 0,
      totalAttempts: 0,
    };

    words.push(newWord);
    const success = await writeWords(words);

    if (success) {
      res.status(201).json(newWord);
    } else {
      res.status(500).json({ error: "خطأ في حفظ الكلمة" });
    }
  } catch (error) {
    res.status(500).json({ error: "خطأ في إضافة الكلمة" });
  }
});

// Update a word
app.put("/api/words/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const words = await readWords();
    const wordIndex = words.findIndex((word) => word.id === id);

    if (wordIndex === -1) {
      return res.status(404).json({ error: "الكلمة غير موجودة" });
    }

    words[wordIndex] = { ...words[wordIndex], ...updates };
    const success = await writeWords(words);

    if (success) {
      res.json(words[wordIndex]);
    } else {
      res.status(500).json({ error: "خطأ في تحديث الكلمة" });
    }
  } catch (error) {
    res.status(500).json({ error: "خطأ في تحديث الكلمة" });
  }
});

// Delete a word
app.delete("/api/words/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const words = await readWords();
    const filteredWords = words.filter((word) => word.id !== id);

    if (words.length === filteredWords.length) {
      return res.status(404).json({ error: "الكلمة غير موجودة" });
    }

    const success = await writeWords(filteredWords);

    if (success) {
      res.json({ message: "تم حذف الكلمة بنجاح" });
    } else {
      res.status(500).json({ error: "خطأ في حذف الكلمة" });
    }
  } catch (error) {
    res.status(500).json({ error: "خطأ في حذف الكلمة" });
  }
});

// Update word statistics
app.post("/api/words/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    const { isCorrect } = req.body;

    const words = await readWords();
    const wordIndex = words.findIndex((word) => word.id === id);

    if (wordIndex === -1) {
      return res.status(404).json({ error: "الكلمة غير موجودة" });
    }

    words[wordIndex].totalAttempts += 1;
    if (isCorrect) {
      words[wordIndex].correctAnswers += 1;
    }

    const success = await writeWords(words);

    if (success) {
      res.json(words[wordIndex]);
    } else {
      res.status(500).json({ error: "خطأ في تحديث الإحصائيات" });
    }
  } catch (error) {
    res.status(500).json({ error: "خطأ في تحديث الإحصائيات" });
  }
});

// Get all custom levels
app.get("/api/custom-levels", async (req, res) => {
  try {
    const levels = await readCustomLevels();
    res.json(levels);
  } catch (error) {
    res.status(500).json({ error: "خطأ في قراءة المستويات" });
  }
});

// Add a new custom level
app.post("/api/custom-levels", async (req, res) => {
  try {
    const { name, wordIds, type } = req.body;
    if (!name || !wordIds || !Array.isArray(wordIds)) {
      return res
        .status(400)
        .json({ error: "اسم المستوى وقائمة الكلمات مطلوبة" });
    }
    const levels = await readCustomLevels();
    if (levels.find((l) => l.name === name)) {
      return res.status(400).json({ error: "اسم المستوى مستخدم بالفعل" });
    }
    const newLevel = {
      name: name.trim(),
      wordIds,
      attempts: 0,
      correctAnswers: 0,
      type,
    };
    levels.push(newLevel);
    const success = await writeCustomLevels(levels);
    if (success) {
      res.status(201).json(newLevel);
    } else {
      res.status(500).json({ error: "خطأ في حفظ المستوى" });
    }
  } catch (error) {
    res.status(500).json({ error: "خطأ في إضافة المستوى" });
  }
});

// Delete a custom level
app.delete("/api/custom-levels/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const levels = await readCustomLevels();
    const filteredLevels = levels.filter((level) => level.name !== name);
    if (levels.length === filteredLevels.length) {
      return res.status(404).json({ error: "المستوى غير موجود" });
    }
    const success = await writeCustomLevels(filteredLevels);
    if (success) {
      res.json({ message: "تم حذف المستوى بنجاح" });
    } else {
      res.status(500).json({ error: "خطأ في حذف المستوى" });
    }
  } catch (error) {
    res.status(500).json({ error: "خطأ في حذف المستوى" });
  }
});

// Update custom level statistics
app.post("/api/custom-levels/:name/stats", async (req, res) => {
  try {
    const { name } = req.params;
    const { isCorrect } = req.body;
    const levels = await readCustomLevels();
    const levelIndex = levels.findIndex((level) => level.name === name);
    if (levelIndex === -1) {
      return res.status(404).json({ error: "المستوى غير موجود" });
    }
    levels[levelIndex].attempts = (levels[levelIndex].attempts || 0) + 1;
    if (isCorrect) {
      levels[levelIndex].correctAnswers =
        (levels[levelIndex].correctAnswers || 0) + 1;
    }
    const success = await writeCustomLevels(levels);
    if (success) {
      res.json(levels[levelIndex]);
    } else {
      res.status(500).json({ error: "خطأ في تحديث الإحصائيات" });
    }
  } catch (error) {
    res.status(500).json({ error: "خطأ في تحديث الإحصائيات" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// عرض صفحة التطبيق الرئيسية لأي route غير موجود
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// Initialize and start server
async function startServer() {
  try {
    await ensureDataDirectory();
    await initializeWordsFile();
    await initializeCustomLevelsFile();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 Words data stored in: ${WORDS_FILE}`);
      console.log(`📊 Custom levels stored in: ${CUSTOM_LEVELS_FILE}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
}

startServer();
