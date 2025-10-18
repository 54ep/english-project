const API_BASE_URL = "/api"; // `http://localhost:${PORT}/api`; # for Localhosts

export interface Word {
  id: string;
  english: string;
  arabic: string;
  dateAdded: string;
  correctAnswers: number;
  totalAttempts: number;
}

// نوع المستوى المخصص
export interface CustomLevel {
  name: string;
  wordIds: string[];
  attempts: number;
  correctAnswers: number;
  type?: 1 | 2; // 1 = انجليزي، 2 = عربي
}

class WordsAPI {
  // Get all words
  static async getWords(): Promise<Word[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/words`);
      if (!response.ok) {
        throw new Error("Failed to fetch words");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching words:", error);
      throw error;
    }
  }

  // Add a new word
  static async addWord(english: string, arabic: string): Promise<Word> {
    console.log("Adding word:", { english, arabic });
    try {
      const response = await fetch(`${API_BASE_URL}/words`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ english, arabic }),
      });

      if (!response.ok) {
        throw new Error("Failed to add word");
      }

      return await response.json();
    } catch (error) {
      console.error("Error adding word:", error);
      throw error;
    }
  }

  // Update a word
  static async updateWord(
    id: string,
    english: string,
    arabic: string
  ): Promise<Word> {
    try {
      const response = await fetch(`${API_BASE_URL}/words/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ english, arabic }),
      });

      if (!response.ok) {
        throw new Error("Failed to update word");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating word:", error);
      throw error;
    }
  }

  // Delete a word
  static async deleteWord(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/words/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete word");
      }
    } catch (error) {
      console.error("Error deleting word:", error);
      throw error;
    }
  }

  // Update word statistics
  static async updateWordStats(id: string, isCorrect: boolean): Promise<Word> {
    try {
      const response = await fetch(`${API_BASE_URL}/words/${id}/stats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isCorrect }),
      });

      if (!response.ok) {
        throw new Error("Failed to update word statistics");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating word statistics:", error);
      throw error;
    }
  }

  // Get all custom levels
  static async getCustomLevels(): Promise<CustomLevel[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-levels`);
      if (!response.ok) {
        throw new Error("Failed to fetch custom levels");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching custom levels:", error);
      throw error;
    }
  }

  // Add a new custom level
  static async addCustomLevel(level: CustomLevel): Promise<CustomLevel> {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-levels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(level),
      });
      if (!response.ok) {
        throw new Error("Failed to add custom level");
      }
      return await response.json();
    } catch (error) {
      console.error("Error adding custom level:", error);
      throw error;
    }
  }

  // Delete a custom level
  static async deleteCustomLevel(levelName: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/custom-levels/${encodeURIComponent(levelName)}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete custom level");
      }
    } catch (error) {
      console.error("Error deleting custom level:", error);
      throw error;
    }
  }

  // Update custom level stats
  static async updateCustomLevelStats(
    levelName: string,
    isCorrect: boolean
  ): Promise<CustomLevel> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/custom-levels/${encodeURIComponent(levelName)}/stats`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isCorrect }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update custom level statistics");
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating custom level statistics:", error);
      throw error;
    }
  }

  // Check server health
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error("Server health check failed:", error);
      return false;
    }
  }
}

export default WordsAPI;
