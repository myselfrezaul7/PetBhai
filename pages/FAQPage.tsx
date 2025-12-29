import React, { useState, useCallback, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';

interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
  id: string;
}

// Single FAQ item component with accordion functionality - memoized
const FAQItem: React.FC<FAQItemProps> = memo(({ question, answer, isOpen, onClick, id }) => {
  return (
    <div className="border-b border-slate-300/50 dark:border-slate-600/50 last:border-b-0">
      <button
        onClick={onClick}
        className="w-full flex justify-between items-center text-left py-4 sm:py-5 px-4 sm:px-6 touch-manipulation active:bg-slate-100/50 dark:active:bg-slate-700/50 transition-colors"
        aria-expanded={isOpen}
        aria-controls={id}
      >
        <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white pr-4">
          {question}
        </h3>
        <span
          className={`flex-shrink-0 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div
        id={id}
        role="region"
        aria-labelledby={`faq-question-${id}`}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}
      >
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 text-slate-700 dark:text-slate-300 text-sm sm:text-base">
          <div className="prose prose-slate dark:prose-invert max-w-none prose-sm sm:prose-base">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
});

FAQItem.displayName = 'FAQItem';

const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Memoize FAQs data to prevent recreation on each render
  const faqs = useMemo(
    () => [
      {
        id: 'adoption-process',
        question: 'What is the adoption process?',
        answer: (
          <p>
            Our adoption process is designed to ensure our animals go to loving, permanent homes. It
            starts with filling out an{' '}
            <Link to="/adopt" className="text-orange-500 hover:underline">
              application form
            </Link>{' '}
            for the pet you are interested in. Our team will then review it and get in touch for an
            interview and a home check. If everything goes well, you can welcome your new family
            member!
          </p>
        ),
      },
      {
        id: 'delivery-areas',
        question: 'Where do you deliver products from the shop?',
        answer: (
          <p>
            We currently deliver to all major districts across Bangladesh. Delivery charges may vary
            based on your location. We are constantly expanding our delivery network, so stay tuned!
          </p>
        ),
      },
      {
        id: 'return-policy',
        question: 'What is your return policy?',
        answer: (
          <p>
            We accept returns for unopened and unused products within 7 days of purchase. Please
            contact our customer service with your order number to initiate a return. Note that
            perishable items like food are generally not eligible for return unless there is a
            quality issue.
          </p>
        ),
      },
      {
        id: 'volunteering',
        question: 'How can I volunteer with PetBhai?',
        answer: (
          <p>
            We are always looking for passionate volunteers! You can help with shelter care,
            adoption events, transportation, and more. Please fill out our{' '}
            <Link to="/volunteer" className="text-orange-500 hover:underline">
              volunteer application form
            </Link>
            , and our team will get in touch with you about available opportunities.
          </p>
        ),
      },
      {
        id: 'stray-rescue',
        question: 'What should I do if I find a stray or injured animal?',
        answer: (
          <p>
            If you find an animal in need of rescue, please fill out our{' '}
            <Link to="/report" className="text-orange-500 hover:underline">
              rescue report form
            </Link>{' '}
            immediately. Provide as much detail as possible, including the location and the animal's
            condition. Your report will alert our rescue team to the situation.
          </p>
        ),
      },
    ],
    []
  );

  // Memoized toggle handler
  const handleToggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-16 animate-fade-in">
      <header className="text-center mb-8 sm:mb-12 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-slate-800 dark:text-white">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-lg text-slate-700 dark:text-slate-200 mt-3 sm:mt-4 px-2">
          Have questions? We've got answers! Find information about our adoption process, products,
          and how you can help.
        </p>
      </header>
      <section className="max-w-3xl mx-auto glass-card overflow-hidden" aria-label="FAQ accordion">
        {faqs.map((faq, index) => (
          <FAQItem
            key={faq.id}
            id={faq.id}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onClick={() => handleToggle(index)}
          />
        ))}
      </section>
    </main>
  );
};

export default FAQPage;
