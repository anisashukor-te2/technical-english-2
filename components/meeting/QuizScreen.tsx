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
    const colorClass = percentage >= 80 ? 'text-green-400' : percentage >= 50 ? 'text-yellow-400' : 'text-red-400';

    return (
      <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle className="text-slate-700" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
          <circle className={colorClass} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-4xl font-bold ${colorClass}`}>{percentage}%</span>
          <span className="text-sm text-slate-400">{score}/{questions.length} Correct</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6 pb-24">
      <Card title="Quiz Results">
        <div className="p-6 text-center">
          <ScoreCircle />
          <p className="mt-4 text-slate-300">
            {percentage >= 80 ? "Excellent work!" : percentage >= 50 ? "Good effort! Review the explanations to improve." : "Keep practicing! Review the explanations below."}
          </p>
        </div>
      </Card>

      <div className="space-y-4">
        {questions.map((q, index) => {
          const userAnswer = userAnswers[index];
          const isCorrect = userAnswer === q.correctAnswerIndex;
          return (
            <Card key={index} title={`Question ${index + 1}: ${isCorrect ? 'Correct' : 'Incorrect'}`}>
              <div className="p-4 space-y-3">
                <p className="font-semibold text-slate-300">{q.question}</p>
                <div className="space-y-2 text-sm">
                  {q.options.map((option, optIndex) => {
                    const isUserChoice = userAnswer === optIndex;
                    const isCorrectChoice = q.correctAnswerIndex === optIndex;
                    let bgClass = 'bg-slate-700/50';
                    if (isCorrectChoice) bgClass = 'bg-green-500/30';
                    if (isUserChoice && !isCorrect) bgClass = 'bg-red-500/30';

                    return (
                      <div key={optIndex} className={`p-2 rounded-md ${bgClass}`}>
                        <p>{isUserChoice && 'Your Answer: '}{isCorrectChoice && 'Correct Answer: '} {option}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg text-xs">
                    <p className="font-semibold text-fuchsia-400 mb-1">Explanation</p>
                    <p className="text-slate-400">{q.explanation}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="text-center pt-4 space-x-4">
        <button onClick={onRetake} className="bg-fuchsia-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-fuchsia-700 transition-colors">
          Retake Quiz
        </button>
        <button onClick={onBack} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-slate-500 transition-colors">
          Back to Menu
        </button>
      </div>
    </div>
  );
};

const QuizScreen: React.FC<QuizScreenProps> = ({ onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(Array(meetingQuizQuestions.length).fill(null));
  const [isFinished, setIsFinished] = useState(false);

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < meetingQuizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setIsFinished(true);
  };
  
  const handleRetake = () => {
    setIsFinished(false);
    setCurrentQuestionIndex(0);
    setUserAnswers(Array(meetingQuizQuestions.length).fill(null));
  };

  if (isFinished) {
    return <QuizResultScreen questions={meetingQuizQuestions} userAnswers={userAnswers} onRetake={handleRetake} onBack={onBack} />;
  }

  const currentQuestion = meetingQuizQuestions[currentQuestionIndex];
  const selectedAnswer = userAnswers[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === meetingQuizQuestions.length - 1;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-24">
      <Card title="Meeting Skills Knowledge Quiz">
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-slate-400">Question {currentQuestionIndex + 1} of {meetingQuizQuestions.length}</p>
            <h2 className="text-lg font-semibold text-slate-200 mt-1">{currentQuestion.question}</h2>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  selectedAnswer === index
                    ? 'border-fuchsia-500 bg-fuchsia-900/50'
                    : 'border-slate-700 bg-slate-800 hover:bg-slate-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center">
            <button onClick={handlePrev} disabled={currentQuestionIndex === 0} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-500 disabled:opacity-50">
              Previous
            </button>
            {isLastQuestion ? (
              <button onClick={handleSubmit} disabled={selectedAnswer === null} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50">
                Submit Quiz
              </button>
            ) : (
              <button onClick={handleNext} disabled={selectedAnswer === null} className="bg-fuchsia-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50">
                Next
              </button>
            )}
          </div>
        </div>
      </Card>
      <div className="text-center mt-8">
        <button onClick={onBack} className="text-sm text-fuchsia-400 hover:text-fuchsia-300 flex items-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to Menu
        </button>
      </div>
    </div>
  );
};

export default QuizScreen;