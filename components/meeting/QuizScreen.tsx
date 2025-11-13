import React, { useState } from 'react';
import { meetingQuizQuestions, QuizQuestion } from '../../data/quizQuestions';
import Card from '../Card';

interface QuizScreenProps {
  onBack: () => void;
}

const QuizResultScreen: React.FC<{
  questions: QuizQuestion[];
  userAnswers: (number | null)[];
  onRetake: () => void;
  onBack: () => void;
}> = ({ questions, userAnswers, onRetake, onBack }) => {
  const score = userAnswers.reduce((acc, answer, index) => {
    return answer === questions[index].correctAnswerIndex ? acc + 1 : acc;
  }, 0);
  const percentage = Math.round((score / questions.length) * 100);

  const ScoreCircle = () => {
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const colorClass = percentage >= 80 ? 'text-green-500' : percentage >= 50 ? 'text-yellow-500' : 'text-red-500';

    return (
      <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle className="text-slate-700" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
          <circle className={colorClass} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-4xl font-bold ${colorClass.replace('text-green-500', 'text-green-400').replace('text-yellow-500', 'text-yellow-400').replace('text-red-500', 'text-red-400')}`}>{percentage}%</span>
          <span className="font-semibold text-slate-400">{score}/{questions.length} Correct</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
        <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Quiz Results</h2>
        </div>

        <Card title="Your Score">
            <div className="p-6 flex flex-col items-center">
                <ScoreCircle />
                <p className="mt-4 text-lg text-slate-300 text-center">
                    {percentage >= 80 ? "Excellent work! You have a strong grasp of the material." : percentage >= 50 ? "Good job! A few points to review, but a solid understanding." : "A good start. Review the explanations below to improve your understanding."}
                </p>
            </div>
        </Card>

        <Card title="Review Answers">
            <div className="p-4 space-y-4">
                {questions.map((q, index) => {
                    const userAnswer = userAnswers[index];
                    const isCorrect = userAnswer === q.correctAnswerIndex;
                    return (
                        <div key={index} className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                            <p className="font-semibold text-slate-200">{index + 1}. {q.question}</p>
                            <div className="mt-2 space-y-1">
                                {q.options.map((option, optIndex) => {
                                    const isSelected = userAnswer === optIndex;
                                    const isCorrectAnswer = q.correctAnswerIndex === optIndex;
                                    let colorClass = 'text-slate-400';
                                    if (isSelected && !isCorrect) colorClass = 'text-red-400 font-semibold';
                                    if (isCorrectAnswer) colorClass = 'text-green-400 font-semibold';
                                    
                                    return (
                                        <div key={optIndex} className={`flex items-start text-sm ${colorClass}`}>
                                            <span className="mr-2">{isCorrectAnswer ? '✔' : isSelected ? '✖' : '•'}</span>
                                            <span>{option}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            {!isCorrect && (
                                <div className="mt-2 p-2 bg-yellow-900/30 border-l-4 border-yellow-500 text-sm text-yellow-300">
                                    <strong>Explanation:</strong> {q.explanation}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
        
        <div className="flex justify-center gap-4 pt-4">
            <button onClick={onRetake} className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-700">
                Retake Quiz
            </button>
             <button onClick={onBack} className="bg-slate-600 text-slate-200 font-bold py-2 px-6 rounded-lg hover:bg-slate-500">
                Back to Menu
            </button>
        </div>
    </div>
  );
};

const QuizScreen: React.FC<QuizScreenProps> = ({ onBack }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(meetingQuizQuestions.length).fill(null));
    const [isFinished, setIsFinished] = useState(false);

    const handleAnswerSelect = (optionIndex: number) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setUserAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < meetingQuizQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setIsFinished(true);
        }
    };

    const handleRetake = () => {
        setCurrentQuestionIndex(0);
        setUserAnswers(new Array(meetingQuizQuestions.length).fill(null));
        setIsFinished(false);
    };

    if (isFinished) {
        return <QuizResultScreen questions={meetingQuizQuestions} userAnswers={userAnswers} onRetake={handleRetake} onBack={onBack} />;
    }

    const currentQuestion = meetingQuizQuestions[currentQuestionIndex];
    const selectedAnswer = userAnswers[currentQuestionIndex];

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white">Meeting Skills Quiz</h2>
                <p className="mt-1 text-slate-400">Question {currentQuestionIndex + 1} of {meetingQuizQuestions.length}</p>
            </div>

            <Card title={`Question ${currentQuestionIndex + 1}`}>
                <div className="p-6">
                    <p className="text-lg font-semibold text-slate-200 mb-6 min-h-[60px]">{currentQuestion.question}</p>
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                className={`w-full text-left p-4 border-2 rounded-lg transition-colors text-slate-300 ${
                                    selectedAnswer === index
                                        ? 'bg-cyan-900/50 border-cyan-500'
                                        : 'bg-slate-900/50 border-slate-700 hover:bg-slate-700/80'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            <div className="mt-6 flex justify-between items-center">
                <button onClick={onBack} className="text-sm text-cyan-400 hover:text-cyan-300">
                    Back to Menu
                </button>
                <button
                    onClick={handleNext}
                    disabled={selectedAnswer === null}
                    className="bg-cyan-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-cyan-700 disabled:bg-slate-600"
                >
                    {currentQuestionIndex < meetingQuizQuestions.length - 1 ? 'Next' : 'Finish'}
                </button>
            </div>
        </div>
    );
};

export default QuizScreen;
