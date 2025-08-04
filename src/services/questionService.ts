import { QuizQuestion } from '../types/quiz';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export interface QuestionResponse {
    success: boolean;
    questions: QuizQuestion[];
    source: 'google-sheets' | 'cached-fallback' | 'error';
    error?: string;
}

export interface SingleQuestionResponse {
    success: boolean;
    question: QuizQuestion;
}

export class QuestionService {
    /**
     * Fetch all questions from the backend
     */
    static async getAllQuestions(): Promise<QuizQuestion[]> {
        try {
            console.log(`🔗 Fetching questions from: ${API_BASE_URL}/questions`);

            // Add timeout to the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(`${API_BASE_URL}/questions`, {
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            clearTimeout(timeoutId);

            console.log(`📡 Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: QuestionResponse = await response.json();

            console.log(`📊 Backend response:`, {
                success: data.success,
                source: data.source,
                questionCount: data.questions?.length || 0
            });

            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch questions');
            }

            console.log(`✅ Questions loaded from: ${data.source} (${data.questions.length} questions)`);
            return data.questions;

        } catch (error) {
            console.error('❌ Error fetching questions from backend:', error);

            // More specific error messages
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    console.error('🕐 Request timed out after 10 seconds');
                } else if (error.message.includes('Failed to fetch')) {
                    console.error('🔌 Network error - backend may be down or unreachable');
                } else if (error.message.includes('CORS')) {
                    console.error('🚫 CORS error - backend may not allow frontend origin');
                } else {
                    console.error(`🚨 Unexpected error: ${error.message}`);
                }
            }

            // No fallback questions available - throw error
            throw error;
        }
    }

    /**
     * Fetch a specific question by ID
     */
    static async getQuestionById(id: number): Promise<QuizQuestion | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/questions/${id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: SingleQuestionResponse = await response.json();

            if (!data.success) {
                throw new Error('Failed to fetch question');
            }

            return data.question;

        } catch (error) {
            console.error(`Error fetching question ${id}:`, error);
            // No fallback questions available - return null
            return null;
        }
    }

    /**
     * Check if backend is available
     */
    static async checkBackendHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return response.ok;
        } catch (error) {
            console.warn('Backend health check failed:', error);
            return false;
        }
    }
}
