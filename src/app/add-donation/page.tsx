'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ArrowLeft, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

export default function AddDonationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    donorName: '',
    phone: '',
    amount: '',
    transactionId: '',
    message: '',
    isAnonymous: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.donorName.trim() || !formData.amount) {
      toast.error('कृपया नाम र सहयोग रकम अनिवार्य भर्नुहोस्।');
      return;
    }

    const numAmount = Number(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('कृपया सही रकम प्रविष्ट गर्नुहोस्।');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to submit donation');
      }

      toast.success('सहयोग सफलतापूर्वक दर्ता भयो! धन्यवाद 🙏');
      router.push('/donation');
    } catch (err: any) {
      toast.error(err.message || 'त्रुटि भयो। पुन: प्रयास गर्नुहोस्।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/70 via-slate-50 to-white text-slate-900 py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
      <Toaster position="top-center" />
      <div className="w-full max-w-xl space-y-6">
        
        {/* Back Link */}
        <div>
          <Link
            href="/donation"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-rose-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← अभियान पृष्ठमा फर्कनुहोस् (Back to Donation Page)</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-rose-100 shadow-2xl p-6 sm:p-10 space-y-6">
          
          <div className="text-center space-y-2 border-b border-slate-100 pb-5">
            <div className="inline-flex p-3 rounded-2xl bg-rose-50 text-rose-600 mb-1">
              <Heart className="w-7 h-7 fill-rose-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              सहयोग दर्ता फारम
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              सुमन भाइको उपचार कोषमा रकम पठाइसकेपछि आफ्नो नाम र रकम यहाँ दर्ता गर्नुहोस्।
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            
            {/* Donor Name */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                तपाईंको नाम (Full Name) *
              </label>
              <input
                type="text"
                required
                value={formData.donorName}
                onChange={(e) => setFormData(prev => ({ ...prev, donorName: e.target.value }))}
                placeholder="उदा: राम शर्मा / Ram Sharma"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>

            {/* Phone or Flat Number */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                सम्पर्क फोन / फ्ल्याट नम्बर (Phone or Flat)
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="98XXXXXXXX वा Flat 302"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                सहयोग रकम (Amount in Rs.) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="उदा: 2000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>

            {/* Transaction ID / Remarks */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                eSewa Txn ID वा Remarks (ऐच्छिक / Optional)
              </label>
              <input
                type="text"
                value={formData.transactionId}
                onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                placeholder="उदा: 19827361 वा Suman Sahayog"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>

            {/* Message / Prayer */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                सुमन भाइको लागि सन्देश वा शुभकामना (Message / Prayer - Optional)
              </label>
              <textarea
                rows={2}
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="सुमन भाइ छिट्टै निको हुनुहोस्..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <span>सहयोगी सूचीमा नाम गोप्य (Anonymous) राख्नुहोस्</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>दर्ता गर्दैछ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>सहयोग दर्ता गर्नुहोस् (Submit Donation)</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
