import { QuizQuestion } from '../types/quiz';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export interface QuestionResponse {
    success: boolean;
    questions: QuizQuestion[];
    source: 'google-sheets' | 'fallback';
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

            // Return fallback questions if backend is not available
            console.log('🔄 Using fallback questions due to error');
            return this.getFallbackQuestions();
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

            // Try to find in fallback questions
            const fallbackQuestions = this.getFallbackQuestions();
            return fallbackQuestions.find(q => q.id === id) || null;
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

    /**
     * Fallback questions (same as the original static data)
     */
    private static getFallbackQuestions(): QuizQuestion[] {
        return [
            {
                id: 1,
                question: "What is the capital of France?",
                options: ["London", "Berlin", "Paris", "Madrid"],
                correctAnswer: 2,
                weightage: 5
            },
            {
                id: 2,
                question: "Which programming language is known for its use in web development and has a React library?",
                options: ["Python", "JavaScript", "Java", "C++"],
                correctAnswer: 1,
                weightage: 10
            },
            {
                id: 3,
                question: "What is 2 + 2?",
                options: ["3", "4", "5", "6"],
                correctAnswer: 1,
                weightage: 3
            },
            {
                id: 4,
                question: "Which planet is known as the Red Planet?",
                options: ["Venus", "Mars", "Jupiter", "Saturn"],
                correctAnswer: 1,
                weightage: 7
            },
            {
                id: 5,
                question: "What is the largest ocean on Earth?",
                options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
                correctAnswer: 3,
                weightage: 6
            },
            {
                id: 6,
                question: "Who wrote 'Romeo and Juliet'?",
                options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
                correctAnswer: 1,
                weightage: 8
            },
            {
                id: 7,
                question: "What is the chemical symbol for gold?",
                options: ["Go", "Gd", "Au", "Ag"],
                correctAnswer: 2,
                weightage: 9
            },
            {
                id: 8,
                question: "Which year did World War II end?",
                options: ["1944", "1945", "1946", "1947"],
                correctAnswer: 1,
                weightage: 4
            },
            {
                id: 9,
                question: "What is the smallest prime number?",
                options: ["0", "1", "2", "3"],
                correctAnswer: 2,
                weightage: 5
            },
            {
                id: 10,
                question: "Which continent is the largest by area?",
                options: ["Africa", "Asia", "North America", "Europe"],
                correctAnswer: 1,
                weightage: 6
            },
            {
                id: 11,
                question: "What is the speed of light in vacuum?",
                options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
                correctAnswer: 0,
                weightage: 8
            },
            {
                id: 12,
                question: "Which HTML tag is used to create a hyperlink?",
                options: ["<link>", "<a>", "<href>", "<url>"],
                correctAnswer: 1,
                weightage: 4
            },
            {
                id: 13,
                question: "What is the square root of 144?",
                options: ["10", "11", "12", "13"],
                correctAnswer: 2,
                weightage: 3
            },
            {
                id: 14,
                question: "Who painted the Mona Lisa?",
                options: ["Pablo Picasso", "Vincent van Gogh", "Leonardo da Vinci", "Michelangelo"],
                correctAnswer: 2,
                weightage: 7
            },
            {
                id: 15,
                question: "What is the most abundant gas in Earth's atmosphere?",
                options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
                correctAnswer: 2,
                weightage: 6
            },
            {
                id: 16,
                question: "In React, what hook is used to manage component state?",
                options: ["useEffect", "useState", "useContext", "useReducer"],
                correctAnswer: 1,
                weightage: 5
            },
            {
                id: 17,
                question: "What is the currency of Japan?",
                options: ["Yuan", "Won", "Yen", "Dong"],
                correctAnswer: 2,
                weightage: 4
            },
            {
                id: 18,
                question: "Which CSS property is used to change text color?",
                options: ["font-color", "text-color", "color", "background-color"],
                correctAnswer: 2,
                weightage: 3
            },
            {
                id: 19,
                question: "What is the tallest mountain in the world?",
                options: ["K2", "Mount Everest", "Kangchenjunga", "Lhotse"],
                correctAnswer: 1,
                weightage: 5
            },
            {
                id: 20,
                question: "Which database query language is most commonly used?",
                options: ["NoSQL", "SQL", "GraphQL", "MongoDB"],
                correctAnswer: 1,
                weightage: 6
            }
        ];
    }
}
