import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface QuestionFormState {
  name: string;
  email: string;
  topic: string;
  question: string;
}

const TOPICS = [
  { id: 'Dog Care', labelEn: 'Dog Care', labelBn: 'কুকুরের যত্ন', icon: '🐕' },
  { id: 'Cat Care', labelEn: 'Cat Care', labelBn: 'বিড়ালের যত্ন', icon: '🐱' },
  { id: 'Health', labelEn: 'Pet Health', labelBn: 'স্বাস্থ্য ও চিকিৎসা', icon: '💉' },
  { id: 'Nutrition', labelEn: 'Nutrition', labelBn: 'খাবার ও পুষ্টি', icon: '🥩' },
  { id: 'Training', labelEn: 'Training', labelBn: 'প্রশিক্ষণ ও আচরণ', icon: '🎓' },
  { id: 'General', labelEn: 'General / Other', labelBn: 'অন্যান্য প্রশ্ন', icon: '🐾' },
];

const RECENT_SAMPLE_QUESTIONS = [
  {
    topicEn: 'Cat Care',
    topicBn: 'বিড়ালের যত্ন',
    questionBn: 'ইনডোর বিড়ালকে কাঠের ফার্নিচার আঁচড়ানো থেকে কীভাবে বিরত রাখব?',
    questionEn: 'How do I stop my indoor cat from scratching wooden furniture?',
    authorBn: 'তানভীর, ধানমন্ডি',
    authorEn: 'Tanvir, Dhanmondi',
    statusBn: 'ব্লগের জন্য রিসার্চ চলছে',
    statusEn: 'Researching for Blog',
    icon: '🐱',
  },
  {
    topicEn: 'Dog Care',
    topicBn: 'কুকুরের যত্ন',
    questionBn: 'গরমের দিনে ৪ মাস বয়সী দেশি কুকুরছানার সেরা খাবার রুটিন কী হওয়া উচিত?',
    questionEn: 'What is the best feeding routine for a 4-month-old Deshi puppy during summer?',
    authorBn: 'সামিরা, উত্তরা',
    authorEn: 'Samira, Uttara',
    statusBn: 'আর্টিকেল লেখা হচ্ছে',
    statusEn: 'Drafting Article',
    icon: '🐕',
  },
  {
    topicEn: 'Health',
    topicBn: 'স্বাস্থ্য ও চিকিৎসা',
    questionBn: 'পার্শিয়ান বিড়ালের কানের ইনফেকশনের প্রাথমিক লক্ষণগুলো কীভাবে বুঝব?',
    questionEn: 'How to recognize early symptoms of ear infection in Persian cats?',
    authorBn: 'নাবিলা, মিরপুর',
    authorEn: 'Nabila, Mirpur',
    statusBn: 'শীঘ্রই উত্তর আসছে',
    statusEn: 'Answering Soon',
    icon: '💉',
  },
  {
    topicEn: 'Nutrition',
    topicBn: 'খাবার ও পুষ্টি',
    questionBn:
      'প্রতিদিন সেদ্ধ মুরগির মাংসের সাথে মিষ্টি কুমড়া দেওয়া কি কুকুরের জন্য স্বাস্থ্যকর?',
    questionEn: 'Is boiled chicken with pumpkin healthy for dogs on a daily basis?',
    authorBn: 'রহিম, বনানী',
    authorEn: 'Rahim, Banani',
    statusBn: 'পর্যালোচনাধীন',
    statusEn: 'In Review',
    icon: '🥩',
  },
];

const AskPetBhai: React.FC = () => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [form, setForm] = useState<QuestionFormState>({
    name: '',
    email: '',
    topic: 'Dog Care',
    question: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const q = form.question.trim();
    if (q.length < 10) {
      setErrorMessage(
        isBn
          ? 'অনুগ্রহ করে কমপক্ষে ১০ অক্ষরের বিস্তারিত প্রশ্ন লিখুন।'
          : 'Please enter a question with at least 10 characters so our experts can answer it well.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim() || undefined,
          email: form.email.trim() || undefined,
          topic: form.topic,
          question: q,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit question');
      }

      setSubmitted(true);
      setForm({
        name: '',
        email: '',
        topic: 'Dog Care',
        question: '',
      });
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (isBn
            ? 'প্রশ্নটি জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
            : 'Unable to submit your question. Please try again in a moment.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="ask-petbhai-title" className="my-12 md:my-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-purple-500/10 dark:from-amber-900/20 dark:via-zinc-900/60 dark:to-orange-950/20 border border-amber-500/20 dark:border-amber-500/10 shadow-xl p-6 md:p-10 backdrop-blur-xl">
        {/* Playful background decors */}
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-sm font-semibold mb-3">
              <span>🐾</span>
              <span>{isBn ? 'পেটভাই কমিউনিটি ফোরাম' : 'Community Q&A'}</span>
            </div>
            <h2
              id="ask-petbhai-title"
              className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight"
            >
              {isBn
                ? 'আপনার পোষা প্রাণী সম্পর্কে কোনো প্রশ্ন আছে?'
                : 'Have a Question About Your Pet?'}
            </h2>
            <p className="mt-3 text-zinc-700 dark:text-zinc-300 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              {isBn
                ? 'খাবার, স্বাস্থ্য বা আচরণ সম্পর্কিত যেকোনো প্রশ্ন আমাদের জানান। আমাদের ভেটেরিনারি ও পেট কেয়ার টিম আপনার প্রশ্নের বিস্তারিত উত্তর নিয়ে নতুন ব্লগ পোস্ট লিখবে!'
                : 'Ask anything about pet food, behavior, or wellness. Our veterinary experts will review your question and write a dedicated in-depth blog guide answering it!'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Column */}
            <div className="lg:col-span-7 bg-white dark:bg-zinc-900/90 rounded-2xl p-6 md:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-lg">
              {submitted ? (
                <div className="text-center py-8 space-y-4 animate-fade-in">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
                    ✨
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    {isBn ? 'ধন্যবাদ! প্রশ্নটি গৃহীত হয়েছে!' : 'Thank You! Question Received!'}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm max-w-md mx-auto leading-relaxed">
                    {isBn
                      ? 'আমাদের বিশেষজ্ঞরা আপনার প্রশ্নটি পর্যালোচনা করবেন এবং শীঘ্রই এই বিষয়ে ব্লগে একটি তথ্যবহুল প্রবন্ধ প্রকাশ করবেন।'
                      : 'Our pet care experts are on it! We will analyze your query and turn it into a complete, easy-to-read blog post.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    {isBn ? 'আরেকটি প্রশ্ন করুন' : 'Ask Another Question'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div
                      role="alert"
                      className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl"
                    >
                      {errorMessage}
                    </div>
                  )}

                  {/* Topic selection pills */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-2">
                      {isBn ? 'বিষয় নির্বাচন করুন' : 'Select Topic'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map((t) => {
                        const isSelected = form.topic === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, topic: t.id }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                              isSelected
                                ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-amber-500/60'
                            }`}
                          >
                            <span>{t.icon}</span>
                            <span>{isBn ? t.labelBn : t.labelEn}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Question textarea */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label
                        htmlFor="ask-petbhai-question"
                        className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider"
                      >
                        {isBn ? 'আপনার প্রশ্ন *' : 'Your Question *'}
                      </label>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {form.question.length}/1000
                      </span>
                    </div>
                    <textarea
                      id="ask-petbhai-question"
                      required
                      minLength={10}
                      maxLength={1000}
                      rows={4}
                      value={form.question}
                      onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                      placeholder={
                        isBn
                          ? 'যেমন: গরমের দিনে দেশি বিড়ালের ডিহাইড্রেশন কীভাবে প্রতিরোধ করব? অথবা ২ মাসের কুকুরছানাকে কী কী টিকা দিতে হবে?'
                          : 'e.g., How can I keep my indoor cat cool in hot Dhaka weather? Or when should I start rabies vaccination for my puppy?'
                      }
                      className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>

                  {/* Optional user details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="ask-petbhai-name"
                        className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-1"
                      >
                        {isBn ? 'আপনার নাম (ঐচ্ছিক)' : 'Your Name (Optional)'}
                      </label>
                      <input
                        id="ask-petbhai-name"
                        type="text"
                        maxLength={80}
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder={isBn ? 'যেমন: সাকিব / টমির আব্বু' : 'e.g., Alex / Bruno’s mom'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ask-petbhai-email"
                        className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-1"
                      >
                        {isBn ? 'ইমেইল (ঐচ্ছিক নোটিফিকেশন)' : 'Email (Optional notification)'}
                      </label>
                      <input
                        id="ask-petbhai-email"
                        type="email"
                        maxLength={120}
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder={isBn ? 'you@example.com' : 'you@example.com'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || form.question.trim().length < 10}
                    className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:bg-slate-200 disabled:text-zinc-400 disabled:cursor-not-allowed dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin text-lg">⏳</span>
                        <span>{isBn ? 'জমা দেওয়া হচ্ছে...' : 'Submitting Question...'}</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>{isBn ? 'প্রশ্ন জমা দিন' : 'Submit My Question'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Community Questions Sidebar */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <span className="text-xl">💡</span>
                <h3 className="font-bold text-sm uppercase tracking-wider">
                  {isBn ? 'সম্প্রতি করা প্রশ্নসমূহ' : 'Questions Being Answered'}
                </h3>
              </div>

              <div className="space-y-3">
                {RECENT_SAMPLE_QUESTIONS.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/80 border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        <span>{item.icon}</span>
                        <span>
                          {item.topicBn}{' '}
                          <span className="opacity-60 text-[10px]">({item.topicEn})</span>
                        </span>
                      </span>
                      <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        {isBn ? item.statusBn : item.statusEn}
                      </span>
                    </div>
                    {/* Bilingual Question: Bangla prominent, English translation right below */}
                    <div className="space-y-1">
                      <p className="text-xs md:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                        "{item.questionBn || item.questionEn}"
                      </p>
                      {item.questionEn && item.questionEn !== item.questionBn && (
                        <p className="text-[11px] md:text-xs text-zinc-600 dark:text-zinc-400 italic leading-snug">
                          "{item.questionEn}"
                        </p>
                      )}
                    </div>
                    <div className="mt-2.5 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <span>{isBn ? 'প্রশ্নকর্তা:' : 'Asked by:'}</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {item.authorBn && item.authorEn
                          ? `${item.authorBn} / ${item.authorEn}`
                          : item.authorBn || item.authorEn}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin Note for User */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2">
                <span className="text-base leading-none">ℹ️</span>
                <p className="leading-relaxed">
                  {isBn
                    ? 'আপনার প্রশ্নের উত্তর তৈরি হলে তা ব্লগ পেজে প্রকাশিত হবে।'
                    : 'Submitted questions help shape our upcoming blog topics! Check back weekly for new detailed answers.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AskPetBhai;
