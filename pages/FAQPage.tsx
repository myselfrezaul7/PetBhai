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
        data-expanded={isOpen}
        aria-controls={id}
      >
        <h3
          id={`faq-question-${id}`}
          className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white pr-4"
        >
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
  const faqSections = useMemo(
    () => [
      {
        title: '🛒 Shopping & Orders',
        faqs: [
          {
            id: 'place-order',
            question: 'How do I place an order on PetBhai?',
            answer: (
              <p>
                Browse our{' '}
                <Link to="/shop" className="text-orange-500 hover:underline">
                  shop
                </Link>
                , add items to your cart, proceed to checkout, and complete payment. Orders are
                processed within 24 hours and you&apos;ll receive tracking information via email.
              </p>
            ),
          },
          {
            id: 'delivery-areas',
            question: 'What areas do you deliver to?',
            answer: (
              <p>
                We deliver across Bangladesh including Dhaka, Chittagong, Sylhet, Rajshahi, Khulna,
                Rangpur, Barisal, and other major cities. Delivery times vary by location. You can
                check delivery availability for your area during checkout.
              </p>
            ),
          },
          {
            id: 'product-authenticity',
            question: 'Are the products on PetBhai authentic?',
            answer: (
              <p>
                Yes! We guarantee 100% authentic products from verified suppliers. We do not sell
                counterfeit or expired items. If you receive a product that doesn&apos;t meet
                quality standards, we&apos;ll replace it.
              </p>
            ),
          },
          {
            id: 'payment-methods',
            question: 'What payment methods are accepted?',
            answer: (
              <p>
                We accept bKash, Nagad, credit/debit cards, and cash on delivery (COD) for most
                areas within Bangladesh.
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
        ],
      },
      {
        title: '🐾 Pet Adoption',
        faqs: [
          {
            id: 'adoption-process',
            question: 'How can I adopt a pet through PetBhai?',
            answer: (
              <p>
                Visit our{' '}
                <Link to="/adopt" className="text-orange-500 hover:underline">
                  Adopt page
                </Link>
                , browse available pets, fill out the adoption application, and our team will
                contact you for next steps including an interview, a home check, and a
                meet-and-greet with the pet.
              </p>
            ),
          },
          {
            id: 'adoption-fee',
            question: 'Is there an adoption fee?',
            answer: (
              <div>
                <p>
                  <strong>PetBhai does not charge any adoption fee.</strong> We believe every animal
                  deserves a loving home, not a price tag. However, adopters are expected to:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Keep vaccinations up to date</li>
                  <li>Spay or neuter the adopted pet</li>
                  <li>Provide a safe and caring environment</li>
                </ul>
                <p className="mt-2 font-semibold text-orange-500">
                  We proudly promote <span className="font-black">#AdoptDontShop</span>. PetBhai
                  does not support buying, selling, or breeding of animals.
                </p>
              </div>
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
                immediately. Provide as much detail as possible, including the location and the
                animal&apos;s condition. Your report will alert our rescue team to the situation.
              </p>
            ),
          },
        ],
      },
      {
        title: '🏥 Veterinary Services',
        faqs: [
          {
            id: 'vet-consultation',
            question: 'How does online vet consultation work?',
            answer: (
              <p>
                Book a consultation through our{' '}
                <Link to="/services" className="text-orange-500 hover:underline">
                  Services page
                </Link>
                , describe your pet&apos;s symptoms, and connect with a licensed vet via chat or
                video call. You&apos;ll receive advice and prescriptions digitally.
              </p>
            ),
          },
          {
            id: 'ai-vs-vet',
            question: 'Can the AI assistant replace a vet?',
            answer: (
              <p>
                No. Our{' '}
                <Link to="/ai-assistant" className="text-orange-500 hover:underline">
                  AI Assistant
                </Link>{' '}
                provides general pet care guidance only. For medical emergencies or serious health
                concerns, always consult a licensed veterinarian.
              </p>
            ),
          },
        ],
      },
      {
        title: '🤝 Community & Volunteering',
        faqs: [
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
            id: 'contact-support',
            question: 'How do I contact customer support?',
            answer: (
              <p>
                Use our{' '}
                <Link to="/ai-assistant" className="text-orange-500 hover:underline">
                  AI Assistant
                </Link>{' '}
                for instant help, or reach us via email at{' '}
                <a href="mailto:petbhaibd@gmail.com" className="text-orange-500 hover:underline">
                  petbhaibd@gmail.com
                </a>
                . We typically respond within 24 hours.
              </p>
            ),
          },
        ],
      },
    ],
    []
  );

  // Memoized toggle handler
  const handleToggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  // Track cumulative index across sections
  let cumulativeIndex = 0;

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
      <header className="text-center mb-8 sm:mb-12 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-slate-800 dark:text-white">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-lg text-slate-700 dark:text-slate-200 mt-3 sm:mt-4 px-2">
          Have questions? We've got answers! Find information about our adoption process, products,
          and how you can help.
        </p>
      </header>
      <section
        className="max-w-3xl mx-auto glass-card-ios overflow-hidden"
        aria-label="FAQ accordion"
      >
        {faqSections.map((section) => {
          const sectionItems = section.faqs.map((faq, localIndex) => {
            const globalIndex = cumulativeIndex + localIndex;
            return (
              <FAQItem
                key={faq.id}
                id={faq.id}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === globalIndex}
                onClick={() => handleToggle(globalIndex)}
              />
            );
          });
          cumulativeIndex += section.faqs.length;
          return (
            <div key={section.title}>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white px-4 sm:px-6 pt-5 sm:pt-6 pb-1">
                {section.title}
              </h2>
              {sectionItems}
            </div>
          );
        })}
      </section>

      {/* Still have questions? */}
      <div className="max-w-3xl mx-auto mt-8 sm:mt-12 text-center">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-3">
          Still Have Questions?
        </h2>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-sm sm:text-base">
          <Link
            to="/community"
            className="text-orange-500 hover:text-orange-600 font-semibold hover:underline"
          >
            Ask the Community
          </Link>
          <span className="text-slate-400">•</span>
          <a
            href="mailto:petbhaibd@gmail.com"
            className="text-orange-500 hover:text-orange-600 font-semibold hover:underline"
          >
            Email Support
          </a>
        </div>
      </div>
    </main>
  );
};

export default FAQPage;
