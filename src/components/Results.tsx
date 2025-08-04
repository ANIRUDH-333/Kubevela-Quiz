import React from 'react';
import { QuizResult, UserData } from '../types/quiz';

interface ResultsProps {
    results: QuizResult;
    userData?: UserData | null;
}

const Results: React.FC<ResultsProps> = ({ results, userData }) => {

    const getScoreColor = (percentage: number): string => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreMessage = (percentage: number): string => {
        if (percentage >= 90) return 'Excellent! Outstanding performance!';
        if (percentage >= 80) return 'Great job! Well done!';
        if (percentage >= 70) return 'Good work! Keep it up!';
        if (percentage >= 60) return 'Not bad! Room for improvement.';
        return 'Keep practicing! You can do better!';
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            {/* Logos */}
            <div className="flex justify-between items-center mb-6">
                <img
                    src="/oss-summit-logo.jpeg"
                    alt="OSS Summit Logo"
                    className="h-12 object-contain"
                />
                <img
                    src="/guidewire-logo.png"
                    alt="Guidewire Logo"
                    className="h-12 object-contain"
                />
            </div>
            
            {/* User Information */}
            {userData && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Quiz Participant</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Name:</span> {userData.name}</p>
                        <p><span className="font-medium">Email:</span> {userData.email}</p>
                        {userData.companyName && (
                            <p><span className="font-medium">Company:</span> {userData.companyName}</p>
                        )}
                    </div>
                </div>
            )}

            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Quiz Results</h2>
                <div className="mb-6">
                    <div className={`text-6xl font-bold mb-2 ${getScoreColor(results.percentage)}`}>
                        {results.percentage.toFixed(1)}%
                    </div>
                    <p className="text-lg text-gray-600">
                        {getScoreMessage(results.percentage)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Score Details</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Your Score:</span>
                            <span className="font-semibold text-gray-800">
                                {results.totalScore} / {results.maxScore}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Questions Answered:</span>
                            <span className="font-semibold text-gray-800">
                                {results.answeredQuestions} / {results.totalQuestions}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Performance</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Accuracy:</span>
                            <span className="font-semibold text-gray-800">
                                {results.answeredQuestions > 0
                                    ? ((results.totalScore / results.maxScore) * 100).toFixed(1)
                                    : '0.0'
                                }%
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Completion:</span>
                            <span className="font-semibold text-gray-800">
                                {((results.answeredQuestions / results.totalQuestions) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Difficulty Breakdown */}
            {results.difficultyBreakdown && (
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Performance by Difficulty</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Easy Questions */}
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-semibold text-green-800">Easy</h4>
                                <span className="text-sm text-green-600 font-medium">5 pts each</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Correct:</span>
                                    <span className="font-semibold text-gray-800">
                                        {results.difficultyBreakdown.easy.correct} / {results.difficultyBreakdown.easy.total}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Points:</span>
                                    <span className="font-semibold text-gray-800">
                                        {results.difficultyBreakdown.easy.points} / {results.difficultyBreakdown.easy.total * 5}
                                    </span>
                                </div>
                                <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full"
                                        style={{
                                            width: `${results.difficultyBreakdown.easy.total > 0
                                                ? (results.difficultyBreakdown.easy.correct / results.difficultyBreakdown.easy.total) * 100
                                                : 0}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Medium Questions */}
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-semibold text-yellow-800">Medium</h4>
                                <span className="text-sm text-yellow-600 font-medium">10 pts each</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Correct:</span>
                                    <span className="font-semibold text-gray-800">
                                        {results.difficultyBreakdown.medium.correct} / {results.difficultyBreakdown.medium.total}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Points:</span>
                                    <span className="font-semibold text-gray-800">
                                        {results.difficultyBreakdown.medium.points} / {results.difficultyBreakdown.medium.total * 10}
                                    </span>
                                </div>
                                <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-yellow-600 h-2 rounded-full"
                                        style={{
                                            width: `${results.difficultyBreakdown.medium.total > 0
                                                ? (results.difficultyBreakdown.medium.correct / results.difficultyBreakdown.medium.total) * 100
                                                : 0}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Hard Questions */}
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-semibold text-red-800">Hard</h4>
                                <span className="text-sm text-red-600 font-medium">20 pts each</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Correct:</span>
                                    <span className="font-semibold text-gray-800">
                                        {results.difficultyBreakdown.hard.correct} / {results.difficultyBreakdown.hard.total}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Points:</span>
                                    <span className="font-semibold text-gray-800">
                                        {results.difficultyBreakdown.hard.points} / {results.difficultyBreakdown.hard.total * 20}
                                    </span>
                                </div>
                                <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-red-600 h-2 rounded-full"
                                        style={{
                                            width: `${results.difficultyBreakdown.hard.total > 0
                                                ? (results.difficultyBreakdown.hard.correct / results.difficultyBreakdown.hard.total) * 100
                                                : 0}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Results;
