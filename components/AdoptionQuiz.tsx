import React, { useState } from 'react';
import { PawIcon } from './icons';

const AdoptionQuiz: React.FC = () => {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const questions = [
    {
      question: 'How much free time do you have daily?',
      options: [
        { text: 'Less than 1 hour', points: 1 },
        { text: '1-2 hours', points: 3 },
        { text: '3+ hours', points: 5 },
      ],
    },
    {
      question: 'What is your living situation?',
      options: [
        { text: 'Small Apartment (Shared)', points: 1 },
        { text: 'Apartment (Own/Family)', points: 3 },
        { text: 'House with Yard', points: 5 },
      ],
    },
    {
      question: 'Have you owned a pet before?',
      options: [
        { text: 'Never', points: 2 },
        { text: 'I grew up with pets', points: 3 },
        { text: "Yes, I'm an experienced owner", points: 5 },
      ],
    },
    {
      question: 'What is your budget for monthly pet/vet costs?',
      options: [
        { text: 'Tight / Unsure', points: 1 },
        { text: 'Moderate (2k - 5k BDT)', points: 3 },
        { text: 'Flexible / High', points: 5 },
      ],
    },
  ];

  const handleAnswer = (points: number) => {
    const newScore = score + points;
    setScore(newScore);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const getResult = () => {
    if (score < 8)
      return {
        title: 'Maybe Wait a Bit?',
        desc: 'Pet ownership requires significant time and resources. Consider fostering or volunteering first!',
        color: 'text-amber-500',
        icon: '🤔',
      };
    if (score < 14)
      return {
        title: "You're Getting There!",
        desc: 'A low-maintenance pet like a cat or an older dog might be a great fit for your lifestyle.',
        color: 'text-amber-500',
        icon: '😺',
      };
    return {
      title: 'You Are Ready!',
      desc: 'Your lifestyle looks perfect for a furry friend. Check out our adoption page!',
      color: 'text-green-500',
      icon: '🐶',
    };
  };

  const result = getResult();

  return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/40 rounded-2xl shadow-lg shadow-slate-900/5 dark:shadow-black/20 p-8 max-w-xl mx-auto w-full relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-orange-200 dark:bg-orange-800 rounded-full filter blur-[60px] opacity-30 dark:opacity-15"></div>
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-purple-200 dark:bg-purple-800 rounded-full filter blur-[60px] opacity-30 dark:opacity-15"></div>

      {!showResult ? (
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300">
              Question {step + 1} of {questions.length}
            </span>
            <PawIcon className="w-5 h-5 text-orange-500" />
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
          </div>

          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
            {questions[step].question}
          </h3>

          <div className="space-y-3">
            {questions[step].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option.points)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white/50 dark:bg-slate-700/30 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700/50 dark:hover:border-orange-500/50 transition-all duration-200 group active:scale-[0.98]"
              >
                <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                  {option.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center relative z-10 animate-fade-in">
          <div className="text-5xl mb-4">{result.icon}</div>
          <h3 className={`text-2xl md:text-3xl font-extrabold mb-4 ${result.color}`}>
            {result.title}
          </h3>
          <p className="text-base text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            {result.desc}
          </p>
          <button
            onClick={() => {
              setStep(0);
              setScore(0);
              setShowResult(false);
            }}
            className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200 font-semibold text-sm active:scale-[0.97]"
          >
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
};

export default AdoptionQuiz;
