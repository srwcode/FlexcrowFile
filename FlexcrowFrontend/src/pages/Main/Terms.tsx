import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-center py-4 px-4">
          <div className="flex items-center">
            <div 
              className="text-flexcrow-600 font-bold text-2xl cursor-pointer" 
              onClick={() => navigate('/')}
            >
              <span>Flex</span>
              <span className="relative text-gray-500">
                crow
                <span className="absolute -top-0.5 right-0 w-2 h-2 bg-flexcrow-500 rounded-full"></span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-flexcrow-600 mb-8 hover:underline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-gray-700 mb-3">
                Welcome to Flexcrow. These Terms of Service ("Terms") govern your access to and use of Flexcrow's website, products, and services ("Services"). Please read these Terms carefully before using our Services.
              </p>
              <p className="text-gray-700">
                By accessing or using our Services, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the Services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Eligibility</h2>
              <p className="text-gray-700 mb-3">
                The Services are intended solely for users who are 18 years of age or older. Any use of the Services by anyone under 18 is expressly prohibited. By using the Services, you represent and warrant that you are 18 years of age or older.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Account Registration</h2>
              <p className="text-gray-700 mb-3">
                To use certain features of our Services, you must register for an account. When you register, you must provide accurate and complete information. You are solely responsible for the activity that occurs on your account, and you must keep your account password secure.
              </p>
              <p className="text-gray-700 mb-3">
                You must notify us immediately of any breach of security or unauthorized use of your account. We will not be liable for any losses caused by any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Escrow Services</h2>
              <p className="text-gray-700 mb-3">
                Our primary service is providing escrow services for transactions between buyers and sellers. By using our escrow service, you agree to the following:
              </p>
              <ul className="list-disc pl-8 text-gray-700 mb-3 space-y-2">
                <li>You will provide accurate and complete information about the transaction.</li>
                <li>You will comply with all laws and regulations applicable to the transaction.</li>
                <li>You will not use our Services for any illegal or unauthorized purpose.</li>
                <li>You understand that we act as a neutral third party and do not favor either buyers or sellers.</li>
              </ul>
              <p className="text-gray-700">
                We reserve the right to refuse service to anyone for any reason at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Fees and Payments</h2>
              <p className="text-gray-700 mb-3">
                We charge fees for our Services as described on our website. Fees are non-refundable except as required by law or as explicitly stated in these Terms.
              </p>
              <p className="text-gray-700 mb-3">
                You agree to pay all fees and charges incurred in connection with your use of the Services. All fees are quoted in the currency specified on our website and are subject to change.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Dispute Resolution</h2>
              <p className="text-gray-700 mb-3">
                If a dispute arises between a buyer and seller, we will review the case and make a decision based on our dispute resolution policy. Our decision is final and binding.
              </p>
              <p className="text-gray-700 mb-3">
                To resolve a dispute, we may request additional information from either party. Failure to provide requested information may result in a decision adverse to the non-responsive party.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Limitation of Liability</h2>
              <p className="text-gray-700 mb-3">
                In no event shall Flexcrow, its officers, directors, employees, or agents, be liable to you for any direct, indirect, incidental, special, punitive, or consequential damages whatsoever resulting from any:
              </p>
              <ul className="list-disc pl-8 text-gray-700 mb-3 space-y-2">
                <li>Errors, mistakes, or inaccuracies of content</li>
                <li>Personal injury or property damage of any nature whatsoever</li>
                <li>Unauthorized access to or use of our servers and/or any personal information stored therein</li>
                <li>Interruption or cessation of transmission to or from our Services</li>
                <li>Bugs, viruses, trojan horses, or the like which may be transmitted through our Services by any third party</li>
              </ul>
              <p className="text-gray-700">
                The foregoing limitation of liability shall apply to the fullest extent permitted by law in the applicable jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Indemnification</h2>
              <p className="text-gray-700">
                You agree to defend, indemnify, and hold harmless Flexcrow and its officers, directors, employees, and agents, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses arising from your use of and access to the Services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Modifications to Terms</h2>
              <p className="text-gray-700">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Governing Law</h2>
              <p className="text-gray-700">
                These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about these Terms, please contact us at legal@flexcrow.com.
              </p>
            </section>

            <div className="text-gray-700 pt-4 border-t">
              <p>Last updated: March 20, 2025</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-flexcrow-950 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">© 2024 Flexcrow. All rights reserved.</p>
            <div className="flex space-x-4">
              <a href="/terms" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
              <a href="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;