const API_BASE_URL = '/api';

export interface Word {
  id: string;
  english: string;
  arabic: string;
  dateAdded: string;
  correctAnswers: number;
  totalAttempts: number;
}

class WordsAPI {
  // Get all words
  static async getWords(): Promise<Word[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/words`);
      if (!response.ok) {
        throw new Error('Failed to fetch words');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching words:', error);
      throw error;
    }
  }

  // Add a new word
  static async addWord(english: string, arabic: string): Promise<Word> {
    console.log('Adding word:', { english, arabic });
    try {
      const response = await fetch(`${API_BASE_URL}/words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ english, arabic }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add word');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding word:', error);
      throw error;
    }
  }

  // Update a word
  static async updateWord(id: string, english: string, arabic: string): Promise<Word> {
    try {
      const response = await fetch(`${API_BASE_URL}/words/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ english, arabic }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update word');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating word:', error);
      throw error;
    }
  }

  // Delete a word
  static async deleteWord(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/words/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete word');
      }
    } catch (error) {
      console.error('Error deleting word:', error);
      throw error;
    }
  }

  // Update word statistics
  static async updateWordStats(id: string, isCorrect: boolean): Promise<Word> {
    try {
      const response = await fetch(`${API_BASE_URL}/words/${id}/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isCorrect }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update word statistics');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating word statistics:', error);
      throw error;
    }
  }

  // Check server health
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  }
}

export default WordsAPI;
