import React, { useState, useCallback, useEffect } from 'react';
import QuestionComponent from './components/QuestionComponent';
import Results from './components/Results';
import QuizDebugInfo from './components/QuizDebugInfo';
import UserRegistration from './components/UserRegistration';
import { UserAnswer, QuizResult, QuizQuestion, UserData } from './types/quiz';
import { selectRandomQuestions } from './utils/questionSelector';
import { useQuestions } from './hooks/useQuestions';
import { saveUserData } from './services/userService';

const App: React.FC = () => {
    const { questions: allQuestions, loading, error } = useQuestions();
    const [selectedQuestions, setSelectedQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);
    const [quizResults, setQuizResults] = useState<QuizResult | null>(null);
    const [isQuizStarted, setIsQuizStarted] = useState<boolean>(false);
    const [backendHealth, setBackendHealth] = useState<string>('checking...');
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isRegistrationLoading, setIsRegistrationLoading] = useState<boolean>(false);

    // Check backend health
    useEffect(() => {
        const checkBackend = async () => {
            try {
                console.log('🏥 Checking backend health...');
                const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
                const response = await fetch(`${apiUrl}/health`);
                if (response.ok) {
                    const data = await response.json();
                    setBackendHealth(`✅ ${data.message}`);
                    console.log('🏥 Backend health check passed:', data);
                } else {
                    setBackendHealth(`❌ Backend responded with ${response.status}`);
                }
            } catch (error) {
                setBackendHealth(`❌ Backend unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`);
                console.error('🏥 Backend health check failed:', error);
            }
        };

        checkBackend();
    }, []);

    // Debug logging
    useEffect(() => {
        console.log('🎯 App mounted - Debug info:', {
            allQuestionsLength: allQuestions.length,
            loading,
            error,
            isQuizStarted,
            backendHealth
        });
    }, [allQuestions, loading, error, isQuizStarted, backendHealth]);

    // Initialize quiz with random questions
    const initializeQuiz = useCallback(() => {
        if (allQuestions.length === 0) return;

        // Updated parameters: target score of 100 points for 10 questions
        // This allows for a good mix of Easy (5), Medium (10), and Hard (20) questions
        const randomQuestions = selectRandomQuestions(allQuestions, 100, 10);
        setSelectedQuestions(randomQuestions);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setIsQuizCompleted(false);
        setQuizResults(null);
        setIsQuizStarted(true);
    }, [allQuestions]);

    // Initialize quiz when questions are loaded
    useEffect(() => {
        if (!isQuizStarted && allQuestions.length > 0 && userData) {
            initializeQuiz();
        }
    }, [initializeQuiz, isQuizStarted, allQuestions, userData]);

    const handleUserRegistration = useCallback(async (formData: UserData) => {
        setIsRegistrationLoading(true);
        try {
            await saveUserData(formData);
            setUserData(formData);
            console.log('✅ User data saved successfully:', formData);
        } catch (error) {
            console.error('❌ Failed to save user data:', error);
            // Still allow the user to proceed with the quiz
            setUserData(formData);
        } finally {
            setIsRegistrationLoading(false);
        }
    }, []);

    const handleAnswerSelect = useCallback((questionId: number, optionIndex: number) => {
        setUserAnswers(prevAnswers => {
            const existingAnswerIndex = prevAnswers.findIndex(answer => answer.questionId === questionId);

            if (existingAnswerIndex !== -1) {
                // Update existing answer
                const updatedAnswers = [...prevAnswers];
                updatedAnswers[existingAnswerIndex] = { questionId, selectedOption: optionIndex };
                return updatedAnswers;
            } else {
                // Add new answer
                return [...prevAnswers, { questionId, selectedOption: optionIndex }];
            }
        });
    }, []);

    const handleNextQuestion = useCallback(() => {
        if (currentQuestionIndex < selectedQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    }, [currentQuestionIndex, selectedQuestions.length]);

    const handlePreviousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    }, [currentQuestionIndex]);

    const calculateResults = useCallback((): QuizResult => {
        let totalScore = 0;
        const maxScore = selectedQuestions.reduce((sum, question) => sum + question.weightage, 0);

        // Initialize difficulty breakdown
        const difficultyBreakdown = {
            easy: { correct: 0, total: 0, points: 0 },
            medium: { correct: 0, total: 0, points: 0 },
            hard: { correct: 0, total: 0, points: 0 }
        };

        // Count questions by difficulty
        selectedQuestions.forEach(question => {
            if (question.weightage === 5) {
                difficultyBreakdown.easy.total++;
            } else if (question.weightage === 10) {
                difficultyBreakdown.medium.total++;
            } else if (question.weightage === 20) {
                difficultyBreakdown.hard.total++;
            }
        });

        // Calculate score and difficulty breakdown
        userAnswers.forEach(answer => {
            const question = selectedQuestions.find(q => q.id === answer.questionId);
            if (question && question.correctAnswer === answer.selectedOption) {
                totalScore += question.weightage;
                
                // Update difficulty-specific correct answers and points
                if (question.weightage === 5) {
                    difficultyBreakdown.easy.correct++;
                    difficultyBreakdown.easy.points += question.weightage;
                } else if (question.weightage === 10) {
                    difficultyBreakdown.medium.correct++;
                    difficultyBreakdown.medium.points += question.weightage;
                } else if (question.weightage === 20) {
                    difficultyBreakdown.hard.correct++;
                    difficultyBreakdown.hard.points += question.weightage;
                }
            }
        });

        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

        return {
            totalScore,
            maxScore,
            percentage,
            answeredQuestions: userAnswers.length,
            totalQuestions: selectedQuestions.length,
            difficultyBreakdown
        };
    }, [userAnswers, selectedQuestions]);

    const handleSubmitQuiz = useCallback(() => {
        const results = calculateResults();
        setQuizResults(results);
        setIsQuizCompleted(true);
    }, [calculateResults]);

    const handleRetakeQuiz = useCallback(() => {
        // Reset quiz state but keep user data
        setSelectedQuestions([]);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setIsQuizCompleted(false);
        setQuizResults(null);
        setIsQuizStarted(false);
        // Don't reset userData to avoid re-registration
    }, []);

    const getCurrentAnswer = useCallback((questionId: number): number | null => {
        const answer = userAnswers.find(answer => answer.questionId === questionId);
        return answer ? answer.selectedOption : null;
    }, [userAnswers]);

    const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            action();
        }
    };

    // Show registration form if user hasn't registered yet
    if (!userData) {
        return (
            <UserRegistration 
                onSubmit={handleUserRegistration}
                isLoading={isRegistrationLoading}
            />
        );
    }

    if (isQuizCompleted && quizResults) {
        return (
            <div className="min-h-screen bg-gray-100 py-8">
                <div className="container mx-auto px-4">
                    <Results 
                        results={quizResults} 
                        userData={userData}
                        onRetakeQuiz={handleRetakeQuiz} 
                    />
                </div>
            </div>
        );
    }

    // Show loading state while questions are being loaded
    if (loading || selectedQuestions.length === 0) {
        console.log('🔄 Rendering loading state:', { loading, selectedQuestionsLength: selectedQuestions.length, allQuestionsLength: allQuestions.length });
        return (
            <div className="min-h-screen bg-gray-100 py-8 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                        {loading ? 'Loading questions...' : 'Preparing your quiz...'}
                    </p>
                    <div className="mt-4 text-sm text-gray-500">
                        <p>Debug: Loading={loading ? 'true' : 'false'}</p>
                        <p>Questions loaded: {allQuestions.length}</p>
                        <p>Error: {error || 'none'}</p>
                        <p>Backend: {backendHealth}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state if questions failed to load
    if (error && allQuestions.length === 0) {
        return (
            <div className="min-h-screen bg-gray-100 py-8 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Questions</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = selectedQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / selectedQuestions.length) * 100;
    const totalScore = selectedQuestions.reduce((sum, q) => sum + q.weightage, 0);

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    {/* User Info */}
                    {userData && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <span><strong>Participant:</strong> {userData.name}</span>
                                <span><strong>Email:</strong> {userData.email}</span>
                                {userData.companyName && (
                                    <span><strong>Company:</strong> {userData.companyName}</span>
                                )}
                            </div>
                        </div>
                    )}

                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
                        Quiz Application
                    </h1>

                    {/* Quiz Info */}
                    <div className="text-center mb-4">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            Total Score: {totalScore} points
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Question {currentQuestionIndex + 1} of {selectedQuestions.length}</span>
                            <span>{progress.toFixed(0)}% Complete</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Answered Questions Count */}
                    <div className="text-center text-sm text-gray-600">
                        Answered: {userAnswers.length} / {selectedQuestions.length} questions
                    </div>
                </div>

                {/* Debug Info - Development only */}
                <QuizDebugInfo
                    questions={selectedQuestions}
                    show={import.meta.env.DEV}
                />

                {/* Question */}
                <QuestionComponent
                    question={currentQuestion}
                    questionNumber={currentQuestionIndex + 1}
                    selectedOption={getCurrentAnswer(currentQuestion.id)}
                    onAnswerSelect={handleAnswerSelect}
                />

                {/* Navigation */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={handlePreviousQuestion}
                            onKeyDown={(e) => handleKeyDown(e, handlePreviousQuestion)}
                            disabled={currentQuestionIndex === 0}
                            className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentQuestionIndex === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
                                }`}
                            tabIndex={0}
                            aria-label="Go to previous question"
                        >
                            Previous
                        </button>

                        <div className="flex space-x-4">
                            {currentQuestionIndex < selectedQuestions.length - 1 ? (
                                <button
                                    onClick={handleNextQuestion}
                                    onKeyDown={(e) => handleKeyDown(e, handleNextQuestion)}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    tabIndex={0}
                                    aria-label="Go to next question"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmitQuiz}
                                    onKeyDown={(e) => handleKeyDown(e, handleSubmitQuiz)}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                    tabIndex={0}
                                    aria-label="Submit quiz and view results"
                                >
                                    Submit Quiz
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
