import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheckIcon,
  TruckIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ScaleIcon,
  UserIcon,
} from '../components/icons';

const TermsPage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    let targetId: string | null = null;
    if (location.pathname === '/delete-account' || location.hash === '#delete-account') {
      targetId = 'delete-account';
    } else if (location.pathname === '/privacy' || location.hash === '#privacy') {
      targetId = 'privacy';
    }

    if (targetId) {
      const resolvedId = targetId;
      const timer = window.setTimeout(() => {
        const el = document.getElementById(resolvedId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
      return () => window.clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-10 sm:py-16">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <DocumentTextIcon
            className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-90"
            aria-hidden="true"
          />
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-3 sm:mb-4">
            Terms and Conditions
          </h1>
          <p className="text-sm sm:text-lg text-orange-100 max-w-2xl mx-auto px-2">
            Welcome to PetBhai. By accessing our website and purchasing our products, you agree to
            the following terms.
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Section 1 */}
          <section className="mb-10 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full mr-4">
                <UserIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                1. Eligibility & User Responsibility
              </h2>
            </div>
            <div className="pl-16 space-y-4 text-slate-600 dark:text-slate-300">
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Age Requirement
                </h3>
                <p>
                  You must be at least 18 years old to create an account or make a purchase on
                  PetBhai.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Account Integrity
                </h3>
                <p>
                  Users are responsible for providing accurate information. Fraudulent activity,
                  spamming, or unauthorized use of site content is strictly prohibited.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full mr-4">
                <CreditCardIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                2. Orders and Payments
              </h2>
            </div>
            <div className="pl-16 space-y-4 text-slate-600 dark:text-slate-300">
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Payment Options
                </h3>
                <p className="mb-3">We currently accept the following payment methods:</p>
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <div className="inline-flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2 text-emerald-900 shadow-xs dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs">
                      COD
                    </div>
                    <span className="text-sm font-semibold">Cash on Delivery</span>
                  </div>
                  <div className="inline-flex items-center gap-2.5 rounded-xl border border-pink-200 bg-pink-50/80 px-3.5 py-2 text-pink-950 shadow-xs dark:border-pink-500/30 dark:bg-pink-950/30 dark:text-pink-200">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D12053] text-white shadow-xs">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12.8 2.5L20 8.2l-4.5 4.9 5.7 3.4-9.8 5L14 14.8l-7.2-2.1L12.8 2.5z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold tracking-tight">bKash</span>
                  </div>
                  <div className="inline-flex items-center gap-2.5 rounded-xl border border-orange-200 bg-orange-50/80 px-3.5 py-2 text-orange-950 shadow-xs dark:border-orange-500/30 dark:bg-orange-950/30 dark:text-orange-200">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#ED1C24] to-[#F7941D] text-white shadow-xs">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5a4.5 4.5 0 1 1 4.5-4.5 4.5 4.5 0 0 1-4.5 4.5z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold tracking-tight">Nagad</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Availability
                </h3>
                <p>
                  All orders are subject to product availability. If an item is out of stock after
                  an order is placed, we will notify you promptly.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Pricing</h3>
                <p>
                  All prices are listed in BDT (Bangladeshi Taka). PetBhai reserves the right to
                  change prices without prior notice.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full mr-4">
                <TruckIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                3. Shipping and Delivery
              </h2>
            </div>
            <div className="pl-16 space-y-4 text-slate-600 dark:text-slate-300">
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Processing Time
                </h3>
                <p>Orders are typically processed within 24 hours.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Delivery Timeline
                </h3>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Inside Dhaka:</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      2 days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Outside Dhaka:</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      3–4 days
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Shipping Fees
                </h3>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Inside Dhaka:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      Free (Limited Time Offer)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Outside Dhaka:</span>
                    <span className="font-semibold">BDT 100 (Flat Fee)</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Handover</h3>
                <p>
                  Once a package is handed to our delivery partner, the shipping address cannot be
                  changed.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mr-4">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                4. Cancellations, Returns, and Refunds
              </h2>
            </div>
            <div className="pl-16 space-y-4 text-slate-600 dark:text-slate-300">
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Cancellation
                </h3>
                <p>
                  You may cancel an order for free before it is handed over to the courier. If the
                  parcel is already with the delivery partner, the customer is liable to pay the
                  delivery fee to cancel.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Return Policy
                </h3>
                <p>
                  Returns are accepted only for damaged or defective items. You must report the
                  issue within{' '}
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    48 hours
                  </span>{' '}
                  of delivery.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Refund Policy
                </h3>
                <p>
                  Approved refunds will be processed via the original payment method (or bKash)
                  within{' '}
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    48 hours
                  </span>{' '}
                  of the return being verified.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section
            id="privacy"
            className="mb-10 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mr-4">
                <ShieldCheckIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                5. Privacy Policy, Data Safety & Account Deletion
              </h2>
            </div>
            <div className="pl-16 space-y-4 text-slate-600 dark:text-slate-300">
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Data Collection & Purpose
                </h3>
                <p>We collect only the information necessary to provide PetBhai services:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                  <li>
                    <strong>Account & Order Information:</strong> Name, email address, phone number,
                    and delivery address used to authenticate your account, fulfill pet supply
                    orders, and book veterinary or grooming services.
                  </li>
                  <li>
                    <strong>Pet Profiles & Reminders:</strong> Pet names, breeds, and vaccination
                    schedules you optionally save in the Pet Dashboard.
                  </li>
                  <li>
                    <strong>Community & AI Assistant Inputs:</strong> Posts, comments, uploaded pet
                    photos, and questions submitted to the Community Hub or PetBhai AI Assistant.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Data Sharing & Encryption
                </h3>
                <p>
                  All data transmitted between the PetBhai mobile app/website and our servers is
                  encrypted in transit via HTTPS/TLS. We do not sell your personal data to third
                  parties or display third-party advertising.
                </p>
              </div>
              <div id="delete-account">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Account & Data Deletion Policy
                </h3>
                <p>
                  You can permanently delete your PetBhai account and associated personal data at
                  any time:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                  <li>
                    <strong>In-App / Web Self-Service:</strong> Sign in, go to{' '}
                    <Link
                      to="/profile"
                      className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
                    >
                      My Profile
                    </Link>
                    , scroll to the <em>Danger Zone</em> section, and select{' '}
                    <strong>Delete Account</strong>.
                  </li>
                  <li>
                    <strong>Via Email Request:</strong> If you cannot access the app, email{' '}
                    <a
                      href="mailto:petbhaibd@gmail.com?subject=Account%20Deletion%20Request"
                      className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
                    >
                      petbhaibd@gmail.com
                    </a>{' '}
                    from your registered email address with the subject{' '}
                    <em>&quot;Account Deletion Request&quot;</em>. Requests are processed within 7
                    business days, removing your profile, saved pets, reminders, and community
                    identifiers.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Community Safety (UGC) & AI Veterinary Disclaimer
                </h3>
                <p>
                  Users can report objectionable community posts/comments or block abusive users
                  directly from any post in the Community Hub. The PetBhai AI Assistant provides
                  general educational and first-aid pet care guidance only and is{' '}
                  <strong>
                    not a substitute for professional veterinary diagnosis or treatment
                  </strong>
                  . Users can flag any AI response using the in-chat <em>Report</em> button.
                </p>
              </div>
            </div>
          </section>

          {/* Legal Compliance Section */}
          <section className="mb-10 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-2xl p-6 md:p-8">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-full mr-4">
                <ScaleIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                Legal Compliance (Bangladesh Law)
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 pl-16">
              In accordance with the{' '}
              <strong>Digital Commerce Management Guidelines 2021 of Bangladesh</strong>, we include
              the following clauses:
            </p>
            <div className="pl-16 space-y-4 text-slate-600 dark:text-slate-300">
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Display of Total Price
                </h3>
                <p>
                  The final checkout price will clearly show the product price, VAT (if applicable),
                  and delivery charges before you confirm the order.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Complaint Officer
                </h3>
                <p>
                  If you have any grievances, you may contact our support team at{' '}
                  <a
                    href="mailto:petbhaibd@gmail.com"
                    className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
                  >
                    petbhaibd@gmail.com
                  </a>
                  . We aim to acknowledge complaints within{' '}
                  <span className="font-semibold">48 hours</span> and resolve them within{' '}
                  <span className="font-semibold">15–30 days</span>.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Product Description
                </h3>
                <p>
                  We strive to ensure that all pet products (food, accessories, etc.) are described
                  accurately. In case of a significant mismatch between the website
                  image/description and the received product, the customer holds the right to a full
                  refund.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Governing Law
                </h3>
                <p>
                  These terms are governed by and construed in accordance with the laws of the{' '}
                  <strong>People's Republic of Bangladesh</strong>. Any disputes will be subject to
                  the jurisdiction of the courts in Dhaka.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-10 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mr-4">
                <svg
                  className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                6. Content Ownership
              </h2>
            </div>
            <div className="pl-16 text-slate-600 dark:text-slate-300">
              <p>
                All content, including images, logos, and text on the PetBhai website, is the
                intellectual property of PetBhai. Use of this content for commercial purposes
                without written permission is strictly prohibited.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-10 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-full mr-4">
                <svg
                  className="w-6 h-6 text-teal-600 dark:text-teal-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                7. Changes to Terms
              </h2>
            </div>
            <div className="pl-16 text-slate-600 dark:text-slate-300">
              <p>
                PetBhai reserves the right to update these terms at any time. We will post updates
                on this page, and your continued use of the site constitutes acceptance of the new
                terms.
              </p>
            </div>
          </section>

          {/* Last Updated */}
          <div className="text-center text-sm text-slate-500 dark:text-slate-300 mt-8">
            <p>Last Updated: December 25, 2025</p>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link
              to="/"
              className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all transform hover:scale-105 shadow-lg touch-manipulation active:scale-95 text-sm sm:text-base"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default TermsPage;
