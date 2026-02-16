import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawIcon, HeartIcon } from '../components/icons';

interface Question {
  id: number;
  text: string;
  options: {
    label: string;
    value: string;
    score: Record<string, number>; // Points for different pet types
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'Reviewing your lifestyle... How much free time do you have daily for a pet?',
    options: [
      {
        label: 'Less than 30 minutes',
        value: 'low',
        score: { cat: 2, fish: 5, reptile: 4, dog: -2, bird: 1 },
      },
      {
        label: '1-2 hours',
        value: 'medium',
        score: { cat: 5, dog: 3, rabbit: 4, bird: 3, fish: 1 },
      },
      {
        label: 'More than 3 hours',
        value: 'high',
        score: { dog: 5, bird: 4, cat: 3, rabbit: 3, fish: 1 },
      },
    ],
  },
  {
    id: 2,
    text: 'What describes your living situation in Bangladesh?',
    options: [
      {
        label: 'Small Apartment (No Balcony)',
        value: 'small_apt',
        score: { fish: 5, hamster: 5, cat: 3, dog: -1, bird: 2 },
      },
      {
        label: 'Apartment with Balcony',
        value: 'med_apt',
        score: { cat: 5, dog: 1, bird: 4, rabbit: 3 },
      },
      {
        label: 'House with Garden/Roof Access',
        value: 'house',
        score: { dog: 5, cat: 4, bird: 3, rabbit: 4 },
      },
    ],
  },
  {
    id: 3,
    text: 'What about noise? How much barking/noise can you tolerate?',
    options: [
      {
        label: 'Prefer Absolute Silence',
        value: 'silent',
        score: { fish: 5, reptile: 5, hamster: 3, cat: 2, dog: -5, bird: -3 },
      },
      {
        label: 'Some noise is okay',
        value: 'moderate',
        score: { cat: 5, rabbit: 4, dog: 2, bird: 1 },
      },
      {
        label: "Don't mind noise at all",
        value: 'loud',
        score: { bird: 5, dog: 5, cat: 4 },
      },
    ],
  },
  {
    id: 4,
    text: 'What is your monthly budget for pet care?',
    options: [
      {
        label: '500-2000 BDT',
        value: 'low',
        score: { fish: 5, hamster: 4, bird: 3, cat: 1, dog: -1 },
      },
      {
        label: '2000-5000 BDT',
        value: 'medium',
        score: { cat: 5, rabbit: 4, bird: 3, dog: 2 },
      },
      {
        label: '5000+ BDT',
        value: 'high',
        score: { dog: 5, cat: 5, bird: 4, exotic: 3 },
      },
    ],
  },
  {
    id: 5,
    text: 'Are you looking for a cuddle buddy or an independent friend?',
    options: [
      {
        label: 'Constant Cuddles!',
        value: 'cuddle',
        score: { dog: 5, cat: 3, rabbit: 2, fish: -5 },
      },
      {
        label: 'Independent & Chill',
        value: 'chill',
        score: { cat: 5, reptile: 4, fish: 4, dog: -2 },
      },
      {
        label: 'Playful & Active',
        value: 'active',
        score: { dog: 5, bird: 4, rabbit: 3, cat: 3 },
      },
    ],
  },
];

const PetCompatibilityPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({
    dog: 0,
    cat: 0,
    bird: 0,
    fish: 0,
    rabbit: 0,
    hamster: 0,
    reptile: 0,
  });
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (scoreUpdate: Record<string, number>) => {
    setScores((prev) => {
      const newScores = { ...prev };
      Object.entries(scoreUpdate).forEach(([key, value]) => {
        if (newScores[key] !== undefined) {
          newScores[key] += value;
        }
      });
      return newScores;
    });

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const getWinner = () => {
    return Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setScores({ dog: 0, cat: 0, bird: 0, fish: 0, rabbit: 0, hamster: 0, reptile: 0 });
    setShowResult(false);
  };

  const [winnerPet, winnerScore] = showResult ? getWinner() : ['', 0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden min-h-[500px] flex flex-col">
        {/* Header */}
        <div className="p-8 bg-orange-500 text-white text-center relative">
          <PawIcon className="w-24 h-24 absolute -top-4 -left-4 text-orange-400 opacity-50 rotate-[-15deg]" />
          <HeartIcon className="w-16 h-16 absolute top-10 right-4 text-orange-400 opacity-50 rotate-[15deg]" />
          <h1 className="text-3xl font-bold relative z-10">Pet Matchmaker</h1>
          <p className="opacity-90 relative z-10">
            Find your perfect companion for life in Bangladesh!
          </p>
        </div>

        {/* Content */}
        <div className="flex-grow p-8 flex flex-col justify-center">
          {!showResult ? (
            <div>
              <div className="mb-8">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <span>
                    Question {currentStep + 1} of {QUESTIONS.length}
                  </span>
                  <span>{Math.round(((currentStep + 1) / QUESTIONS.length) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-orange-500 h-full transition-all duration-500 ease-out"
                    style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-8 text-center leading-relaxed">
                {QUESTIONS[currentStep].text}
              </h2>

              <div className="grid gap-4">
                {QUESTIONS[currentStep].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option.score)}
                    className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-slate-700 dark:hover:border-orange-500 transition-all font-semibold text-left flex items-center group"
                  >
                    <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 flex items-center justify-center mr-4 group-hover:bg-orange-500 group-hover:text-white transition-colors text-sm font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center animate-scale-in">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-6xl shadow-xl mb-6 border-4 border-white dark:border-slate-700">
                {winnerPet === 'dog' && '🐶'}
                {winnerPet === 'cat' && '🐱'}
                {winnerPet === 'bird' && '🦜'}
                {winnerPet === 'fish' && '🐠'}
                {winnerPet === 'rabbit' && '🐰'}
                {winnerPet === 'hamster' && '🐹'}
                {winnerPet === 'reptile' && '🦎'}
              </div>

              <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 capitalize">
                You should get a {winnerPet}!
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto">
                Based on your answers, a {winnerPet} fits your lifestyle perfectly. They match your
                activity level, space, and budget for a happy life together in BD.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/adopt')}
                  className="bg-orange-500 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 shadow-lg"
                >
                  Find {winnerPet}s for Adoption
                </button>
                <button
                  onClick={resetQuiz}
                  className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white px-8 py-3 rounded-full font-bold hover:bg-slate-300 dark:hover:bg-slate-600"
                >
                  Retake Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetCompatibilityPage;
