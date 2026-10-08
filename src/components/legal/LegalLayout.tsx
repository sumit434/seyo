import React, { useState } from 'react';
import { ArrowLeft, Shield, FileText, RefreshCw, Mail, Phone, MapPin, Clock } from 'lucide-react';

export type LegalTabKey = 'contact' | 'terms' | 'privacy' | 'refund';

interface LegalLayoutProps {
  initialTab?: LegalTabKey;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ initialTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState<LegalTabKey>(initialTab);

  const handleTabChange = (tab: LegalTabKey) => {
    setActiveTab(tab);
    const path = tab === 'terms' ? '/terms' : tab === 'privacy' ? '/privacy' : tab === 'refund' ? '/refund-policy' : '/terms';
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f3f2] text-[#10181c] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0e7c66] hover:text-[#0a6252] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>
          <span className="text-xs font-medium text-[#6a787e]">
            Effective Date: October 2026
          </span>
        </div>

        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#0e7c66] text-white flex items-center justify-center font-black text-2xl mx-auto mb-3 shadow-sm">
            S
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#10181c]">
            Legal, Compliance & Policies
          </h1>
          <p className="mt-2 text-sm text-[#6a787e]">
            Official business policies and compliance documentation for the SEYO Platform
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 border-b border-[#e2e7e6] pb-4">
          <button
            type="button"
            onClick={() => handleTabChange('terms')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-[#0e7c66] text-white shadow-sm'
                : 'bg-white text-[#6a787e] hover:bg-[#e2e7e6] border border-[#e2e7e6]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Terms & Conditions
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('privacy')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#0e7c66] text-white shadow-sm'
                : 'bg-white text-[#6a787e] hover:bg-[#e2e7e6] border border-[#e2e7e6]'
            }`}
          >
            <Shield className="w-4 h-4" />
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('refund')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'refund'
                ? 'bg-[#0e7c66] text-white shadow-sm'
                : 'bg-white text-[#6a787e] hover:bg-[#e2e7e6] border border-[#e2e7e6]'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Cancellation & Refund
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('contact')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-[#0e7c66] text-white shadow-sm'
                : 'bg-white text-[#6a787e] hover:bg-[#e2e7e6] border border-[#e2e7e6]'
            }`}
          >
            <Mail className="w-4 h-4" />
            About & Contact
          </button>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl border border-[#e2e7e6] shadow-xs p-6 sm:p-10 text-sm leading-relaxed space-y-6 text-left">
          {/* TAB: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-5">
              <div className="border-b border-[#f1f3f2] pb-3">
                <h2 className="text-xl font-bold text-[#10181c]">Terms and Conditions of Service</h2>
                <p className="text-xs text-[#6a787e] mt-1">Last Updated: October 2026</p>
              </div>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">1. Introduction & Overview</h3>
                <p>
                  These Terms and Conditions (“Terms”) govern the purchase, access, and usage of the <strong>SEYO Platform</strong> (“Service”, “Platform”), provided by SEYO Technologies India (“SEYO”, “we”, “our”, or “us”). By selecting a subscription tier, completing payment, or using the SEYO merchant terminal and customer reward stations, you (“Merchant”, “you”) agree to be legally bound by these Terms.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">2. Description of the SEYO Service</h3>
                <p>
                  SEYO is an in-store customer engagement and loyalty operating platform designed for physical merchants, dining establishments, cafes, and retail stores. Our platform includes dynamic front-counter QR stations, NFC physical tag integration, digital milestone stamp cards, gamified 100% all-win spin wheels, customer review accelerators with Google Maps integration, and on-site staff PIN-protected verification terminals.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">3. Merchant Eligibility & Account Registration</h3>
                <p>
                  To be eligible to purchase a SEYO subscription license, you must operate a legitimate physical commercial enterprise or retail location. You must provide a valid merchant business email address during checkout. A single-use, cryptographically verified setup magic link is dispatched only after verified payment confirmation. You are responsible for safeguarding your staff verification PIN and terminal access.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">4. Subscription Tiers & Payment Processing</h3>
                <p>
                  SEYO provides four functional tiers: <strong>Spin & Win</strong>, <strong>Loyal Legend</strong>, <strong>Review Accelerator</strong>, and the all-in-one <strong>SEYO Combined Suite</strong>. Subscription charges are billed in advance as recurring or one-time license fees in Indian Rupees (INR) or designated foreign equivalents. All online payments are handled securely through PCI-DSS Level 1 certified third-party payment gateways (e.g., Razorpay). SEYO never stores, processes, or captures payment card numbers, CVVs, or net-banking credentials.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">5. Merchant Responsibilities & Physical Fulfillment</h3>
                <p>
                  Merchants are strictly responsible for:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-[#2a383f]">
                  <li>Honoring all active promotional discounts, spin prizes, and loyalty vouchers redeemed at their physical store.</li>
                  <li>Maintaining active front-counter hardware (display screens or NFC tags) for customer interaction.</li>
                  <li>Fulfilling food, beverage, or retail goods associated with customer reward redemptions. SEYO is a software provider and does not manufacture or supply physical goods.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">6. Acceptable Use & Fair Interaction Policy</h3>
                <p>
                  You agree not to manipulate, simulate, or spoof customer visits, QR scans, or NFC session keys. You may not automate bot interaction, forge staff PIN verifications, or submit fraudulent reviews. SEYO enforces cryptographic short-lived session tokens and one-session-key/one-customer binding. Attempts to reverse-engineer or tamper with these security controls will result in immediate service suspension.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">7. Service Availability & Uptime</h3>
                <p>
                  We strive to maintain a 99.9% uptime for cloud-hosted customer reward stations and staff terminals. Scheduled maintenance or unforeseen network interruptions will be communicated in advance whenever feasible. SEYO is not liable for merchant-side hardware failures, on-premise Wi-Fi outages, or third-party telecom disruptions.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">8. Intellectual Property</h3>
                <p>
                  All proprietary software code, algorithms, user interfaces, branding, logos, and digital designs comprising SEYO are the exclusive intellectual property of SEYO Technologies India. You are granted a revocable, non-exclusive, non-transferable license during your paid subscription term.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">9. Cancellation & Refund Policy Reference</h3>
                <p>
                  Subscriptions may be cancelled at any time through account settings or by notifying <strong>support@seyo.app</strong>. For complete details regarding eligibility windows and payment reversal guidelines, please review our separate <a href="/refund-policy" className="text-[#0e7c66] font-semibold underline">Cancellation & Refund Policy</a>.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">10. Limitation of Liability</h3>
                <p>
                  To the maximum extent permitted by applicable Indian law, SEYO and its officers, directors, and employees shall not be liable for indirect, incidental, punitive, or consequential damages resulting from lost profits, customer disputes, or inability to use the platform. Our aggregate liability is strictly limited to the amount paid by the merchant for the specific service in the preceding one (1) month.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">11. Contact & Governing Law</h3>
                <p>
                  These Terms are governed by and construed in accordance with the laws of India, with exclusive jurisdiction in the courts of Pune, Maharashtra. For legal notices, contact <strong>legal@seyo.app</strong>.
                </p>
              </section>
            </div>
          )}

          {/* TAB: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="border-b border-[#f1f3f2] pb-3">
                <h2 className="text-xl font-bold text-[#10181c]">Privacy & Data Protection Policy</h2>
                <p className="text-xs text-[#6a787e] mt-1">Last Updated: October 2026</p>
              </div>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">1. Introduction</h3>
                <p>
                  SEYO Technologies India (“SEYO”, “we”, “our”) respects your privacy and is committed to protecting the confidential data of our merchant partners and their visiting patrons. This Privacy Policy details how we collect, handle, protect, and process information.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">2. Information We Collect</h3>
                <div className="space-y-2 text-xs text-[#2a383f]">
                  <p>
                    <strong>A. Merchant Information:</strong> When you purchase or configure SEYO, we collect your business contact email, establishment name, business category, location details (city/country/timezone), branding assets (logos, emojis, accent colors), and staff terminal security PINs (stored exclusively as salted, cryptographic PBKDF2 hashes).
                  </p>
                  <p>
                    <strong>B. Payment & Order Identifiers:</strong> We store Razorpay order IDs, transaction timestamps, payment status, and subscription tier references. <em>We never store credit card numbers, CVVs, net-banking credentials, or UPI PINs.</em>
                  </p>
                  <p>
                    <strong>C. Guest / Patron Information:</strong> Customers interacting with in-store QR/NFC stations input their mobile number solely as a non-OTP identifier. We store visit counters, timestamps, reward eligibility milestones, and optional feedback ratings.
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">3. How We Use Collected Information</h3>
                <p>
                  We utilize collected information strictly to:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-[#2a383f]">
                  <li>Provision the merchant dashboard and issue encrypted onboarding magic links.</li>
                  <li>Calculate customer loyalty visit milestones and enforce daily midnight cooldowns.</li>
                  <li>Enable on-site staff verification and reward redemption workflows.</li>
                  <li>Facilitate customer review handoffs to verified merchant Google Business profiles.</li>
                  <li>Send transactional service updates and billing receipts.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">4. Payment Processing Through Razorpay</h3>
                <p>
                  All online payments made on SEYO are processed by Razorpay Software Private Limited. When you submit payment, your payment details are transmitted directly to Razorpay over an encrypted TLS connection. Razorpay is certified PCI-DSS Level 1 compliant. SEYO only receives confirmation of payment status, order ID, and transaction references.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">5. Zero Third-Party Sale of Personal Data</h3>
                <p>
                  We do not sell, rent, monetize, or trade merchant or customer contact lists to advertisers, data brokers, or unaffiliated commercial entities. Data is only shared with trusted infrastructure providers (such as hosting and payment gateways) strictly necessary for delivering the service.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">6. Data Security & Cryptographic Protection</h3>
                <p>
                  SEYO applies multi-layered security measures, including HTTPS/TLS encryption in transit, salted cryptographic hashing for staff access PINs, short-lived 15-minute token expirations for QR engagement sessions, and automated rate limiting to prevent unauthorized scraping or brute-force access.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">7. Data Retention & User Rights</h3>
                <p>
                  Merchant account records and patron visit logs are retained for the duration of the active subscription license. Merchants may request complete data exports or permanent account deletion by contacting our grievance team at <strong>privacy@seyo.app</strong>.
                </p>
              </section>
            </div>
          )}

          {/* TAB: CANCELLATION & REFUND */}
          {activeTab === 'refund' && (
            <div className="space-y-5">
              <div className="border-b border-[#f1f3f2] pb-3">
                <h2 className="text-xl font-bold text-[#10181c]">Cancellation & Refund Policy</h2>
                <p className="text-xs text-[#6a787e] mt-1">Last Updated: October 2026</p>
              </div>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">1. Policy Overview</h3>
                <p>
                  SEYO strives to provide an exceptional, transparent onboarding experience for all retail, dining, and physical merchants. This policy sets forth the clear conditions under which software subscriptions can be cancelled and refunds issued.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">2. Subscription Cancellation</h3>
                <p>
                  Merchants may cancel their SEYO subscription license at any time. To cancel, navigate to your merchant terminal account profile or send an email to <strong>support@seyo.app</strong> with your registered business email and merchant ID. Upon cancellation, your terminal and reward stations will continue operating through the end of the current pre-paid billing period, after which access will expire without further billing.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">3. Refund Eligibility Window</h3>
                <p>
                  We offer a <strong>7-day full refund guarantee</strong> from the timestamp of payment for newly purchased SEYO licenses, provided that the merchant has not deployed the QR/NFC stations live in their physical store with active customer visits. Once live customer visits have been recorded, fees become non-refundable for the current billing cycle.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">4. Failed or Unsuccessful Transactions</h3>
                <p>
                  If an online payment fails or is interrupted before completion, the SEYO service is not activated, and no setup magic link is dispatched. If your bank account or card was debited for a failed transaction, the interbank clearing system will automatically reverse the charge within 2 to 4 business days.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">5. Technical Onboarding Issues</h3>
                <p>
                  If you successfully complete payment but encounter technical difficulties accessing your single-use setup magic link or configuring your staff terminal, our priority engineering desk is available at <strong>support@seyo.app</strong>. If we cannot resolve the onboarding issue within 48 hours of your notification, you are eligible for an immediate 100% refund.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">6. Duplicate Charges</h3>
                <p>
                  In the event of accidental duplicate payments for the same merchant tier, please notify us immediately. Upon verification, the duplicate charge will be refunded immediately without deduction.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-base text-[#10181c]">7. Refund Processing Method & Timeline</h3>
                <p>
                  Approved refunds are processed via our payment gateway (Razorpay) and credited back directly to the original payment source (Credit/Debit Card, UPI, or Net Banking account). In accordance with standard banking and National Automated Clearing House (NACH) timelines, refunds typically reflect in your account within <strong>5 to 7 business days</strong>.
                </p>
              </section>
            </div>
          )}

          {/* TAB: ABOUT & CONTACT */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="border-b border-[#f1f3f2] pb-3">
                <h2 className="text-xl font-bold text-[#10181c]">About SEYO & Official Contact Details</h2>
                <p className="text-xs text-[#6a787e] mt-1">Verified Corporate Information</p>
              </div>

              <p>
                <strong>SEYO Technologies India</strong> is an innovative offline-to-online customer engagement software provider. We equip brick-and-mortar restaurants, cafes, and retail stores with dynamic reward stations, fast-track stamp loyalty cards, and Google review acceleration terminals.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#f1f3f2] border border-[#e2e7e6] space-y-1">
                  <div className="flex items-center gap-2 text-[#0e7c66] font-bold text-xs uppercase">
                    <Mail className="w-4 h-4" /> Customer & Merchant Support
                  </div>
                  <p className="font-semibold text-sm">support@seyo.app</p>
                  <p className="text-xs text-[#6a787e]">Response time: Within 24 hours</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#f1f3f2] border border-[#e2e7e6] space-y-1">
                  <div className="flex items-center gap-2 text-[#0e7c66] font-bold text-xs uppercase">
                    <Phone className="w-4 h-4" /> Merchant Assistance Hotline
                  </div>
                  <p className="font-semibold text-sm">+91 98765 43210</p>
                  <p className="text-xs text-[#6a787e]">Mon–Fri, 10:00 AM – 6:00 PM IST</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#f1f3f2] border border-[#e2e7e6] space-y-1">
                  <div className="flex items-center gap-2 text-[#0e7c66] font-bold text-xs uppercase">
                    <MapPin className="w-4 h-4" /> Registered Operating Address
                  </div>
                  <p className="font-semibold text-sm">SEYO Technologies India</p>
                  <p className="text-xs text-[#6a787e]">
                    Commercial Tower Suite 402, Senapati Bapat Road, Pune, Maharashtra 411016, India
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#f1f3f2] border border-[#e2e7e6] space-y-1">
                  <div className="flex items-center gap-2 text-[#0e7c66] font-bold text-xs uppercase">
                    <Clock className="w-4 h-4" /> Grievance & Compliance Officer
                  </div>
                  <p className="font-semibold text-sm">Compliance Desk</p>
                  <p className="text-xs text-[#6a787e]">grievance@seyo.app</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-[#6a787e] space-y-2">
          <p>© {new Date().getFullYear()} SEYO Technologies India. All rights reserved.</p>
          <div className="flex justify-center gap-4 text-[11px]">
            <a href="/terms" className="hover:text-[#10181c]">Terms & Conditions</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-[#10181c]">Privacy Policy</a>
            <span>•</span>
            <a href="/refund-policy" className="hover:text-[#10181c]">Cancellation & Refund</a>
          </div>
        </div>
      </div>
    </div>
  );
};
