import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Single FAQ item component with accordion functionality
const FAQItem: React.FC<{
  question: string;
  answer: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}> = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-slate-300/50 dark:border-slate-600/50 last:border-b-0">
      <button
        onClick={onClick}
        className="w-full flex justify-between items-center text-left py-5 px-6"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question.replace(/\s+/g, '-')}`}
      >
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{question}</h3>
        <span
          className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div
        id={`faq-answer-${question.replace(/\s+/g, '-')}`}
        role="region"
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}
      >
        <div className="px-6 pb-5 text-slate-700 dark:text-slate-300">
          <div className="prose prose-slate dark:prose-invert max-w-none">{answer}</div>
        </div>
      </div>
    </div>
  );
};

const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What is the adoption process?',
      answer: (
        <p>
          Our adoption process is designed to ensure our animals go to loving, permanent homes. It
          starts with filling out an <Link to="/adopt">application form</Link> for the pet you are
          interested in. Our team will then review it and get in touch for an interview and a home
          check. If everything goes well, you can welcome your new family member!
        </p>
      ),
    },
    {
      question: 'Where do you deliver products from the shop?',
      answer: (
        <p>
          We currently deliver to all major districts across Bangladesh. Delivery charges may vary
          based on your location. We are constantly expanding our delivery network, so stay tuned!
        </p>
      ),
    },
    {
      question: 'What is your return policy?',
      answer: (
        <p>
          We accept returns for unopened and unused products within 7 days of purchase. Please
          contact our customer service with your order number to initiate a return. Note that
          perishable items like food are generally not eligible for return unless there is a quality
          issue.
        </p>
      ),
    },
    {
      question: 'How can I volunteer with PetBhai?',
      answer: (
        <p>
          We are always looking for passionate volunteers! You can help with shelter care, adoption
          events, transportation, and more. Please fill out our{' '}
          <Link to="/volunteer">volunteer application form</Link>, and our team will get in touch
          with you about available opportunities.
        </p>
      ),
    },
    {
      question: 'What should I do if I find a stray or injured animal?',
      answer: (
        <p>
          If you find an animal in need of rescue, please fill out our{' '}
          <Link to="/report">rescue report form</Link> immediately. Provide as much detail as
          possible, including the location and the animal's condition. Your report will alert our
          rescue team to the situation.
        </p>
      ),
    },
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container mx-auto px-6 py-16 animate-fade-in">
      <div className="text-center mb-12 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-slate-700 dark:text-slate-200 mt-4">
          Have questions? We've got answers! Find information about our adoption process, products,
          and how you can help.
        </p>
      </div>
      <div className="max-w-3xl mx-auto glass-card overflow-hidden">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onClick={() => handleToggle(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default FAQPage;
