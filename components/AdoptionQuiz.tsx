import React, { useState } from 'react';
import { PawIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

const AdoptionQuiz: React.FC = () => {
    const { t } = useLanguage();
    const [step, setStep] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);

    const questions = [
        {
            question: "How much free time do you have daily?",
            options: [
                { text: "Less than 1 hour", points: 1 },
                { text: "1-2 hours", points: 3 },
                { text: "3+ hours", points: 5 },
            ],
        },
        {
            question: "What is your living situation?",
            options: [
                { text: "Small Apartment (Shared)", points: 1 },
                { text: "Apartment (Own/Family)", points: 3 },
                { text: "House with Yard", points: 5 },
            ],
        },
        {
            question: "Have you owned a pet before?",
            options: [
                { text: "Never", points: 2 },
                { text: "I grew up with pets", points: 3 },
                { text: "Yes, I'm an experienced owner", points: 5 },
            ],
        },
        {
            question: "What is your budget for monthly pet/vet costs?",
            options: [
                { text: "Tight / Unsure", points: 1 },
                { text: "Moderate (2k - 5k BDT)", points: 3 },
                { text: "Flexible / High", points: 5 },
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
        if (score < 8) return {
            title: "Maybe Wait a Bit?",
            desc: "Pet ownership requires significant time and resources. Consider fostering or volunteering first!",
            color: "text-amber-500",
            icon: "🤔"
        };
        if (score < 14) return {
            title: "You're Getting There!",
            desc: "A low-maintenance pet like a cat or an older dog might be a great fit for your lifestyle.",
            color: "text-blue-500",
            icon: "😺"
        };
        return {
            title: "You Are Ready!",
            desc: "Your lifestyle looks perfect for a furry friend. Check out our adoption page!",
            color: "text-green-500",
            icon: "🐶"
        };
    };

    const result = getResult();

    return (
        <div className="glass-card-ios p-8 max-w-xl mx-auto w-full relative overflow-hidden">
            {/* Blobs */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-orange-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>

            {!showResult ? (
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Question {step + 1} of {questions.length}
                        </span>
                        <PawIcon className="w-6 h-6 text-orange-500 animate-pulse" />
                    </div>

                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-8">
                        {questions[step].question}
                    </h3>

                    <div className="space-y-3">
                        {questions[step].options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswer(option.points)}
                                className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 transition-all duration-200 group"
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
                    <div className="text-6xl mb-4">{result.icon}</div>
                    <h3 className={`text-3xl font-extrabold mb-4 ${result.color}`}>
                        {result.title}
                    </h3>
                    <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                        {result.desc}
                    </p>
                    <button
                        onClick={() => { setStep(0); setScore(0); setShowResult(false); }}
                        className="px-6 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold text-sm"
                    >
                        Retake Quiz
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdoptionQuiz;
