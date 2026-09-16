'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, Copy, Check, Download, Users, PlusCircle, 
  Calendar, Clock, ShieldCheck, Sparkles, ArrowRight, 
  TrendingUp, Phone, CheckCircle2, Loader2
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

interface Donor {
  _id: string;
  donorName: string;
  amount: number;
  isAnonymous: boolean;
  message?: string;
  createdAt: string;
}

export default function DonationPage() {
  const [data, setData] = useState<{
    stats: {
      targetAmount: number;
      totalCollected: number;
      remainingAmount: number;
      percentage: number;
      totalDonors: number;
    };
    donors: Donor[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const esewaId = '9860397374'; // eSewa ID

  const fetchData = async () => {
    try {
      const res = await fetch('/api/donations');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(esewaId);
    setCopied(true);
    toast.success('eSewa ID कपी भयो: ' + esewaId, { icon: '📋' });
    setTimeout(() => setCopied(false), 2000);
  };

  const target = data?.stats.targetAmount || 200000;
  const collected = data?.stats.totalCollected || 85500;
  const remaining = data?.stats.remainingAmount ?? (target - collected);
  const percentage = data?.stats.percentage ?? Math.min(100, Math.round((collected / target) * 100));
  const donorCount = data?.stats.totalDonors || data?.donors.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-slate-50 to-white text-slate-900 py-8 px-4 sm:px-6">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12">

        {/* 1. Header & Hero Title */}
        <div className="text-center space-y-3 pt-2 sm:pt-6">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>STG Community • आकस्मिक स्वास्थ्य सहयोग</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            ❤️ सुमन भाइको उपचारको लागि सहयोग
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            हाम्रो STG Community का सुरक्षा गार्ड <strong>सुमन भाइ</strong> ICU मा उपचाररत हुनुहुन्छ।
          </p>

          <div className="pt-1">
            <span className="inline-block font-serif italic text-base sm:text-lg text-amber-800 bg-amber-50/90 border border-amber-200/80 px-4 py-1.5 rounded-2xl shadow-xs">
              “सानो सहयोग, ठूलो सहारा।”
            </span>
          </div>
        </div>

        {/* 2. Visual Progress Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                Donation Progress
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                सहयोग संकलन विवरण
              </h2>
            </div>
          </div>

          {/* 3 Metric Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Required</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Rs. {target.toLocaleString()}
              </div>
              <span className="text-xs text-slate-500 block mt-0.5">आवश्यक रकम</span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">Total Collected</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                Rs. {collected.toLocaleString()}
              </div>
              <span className="text-xs text-emerald-700 font-medium block mt-0.5">
                {donorCount} जना सहयोगीहरूबाट ({percentage}%)
              </span>
            </div>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200">
              <span className="text-[11px] font-bold text-rose-800 uppercase block">Remaining</span>
              <div className="text-xl sm:text-2xl font-black text-rose-700 mt-1">
                Rs. {remaining.toLocaleString()}
              </div>
              <span className="text-xs text-rose-700 block mt-0.5">बाँकी आवश्यक रकम</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm font-bold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>संकलन प्रगति: {percentage}%</span>
              </span>
              <span className="text-emerald-700 font-extrabold">
                Rs. {collected.toLocaleString()} / Rs. {target.toLocaleString()}
              </span>
            </div>

            <div className="w-full h-4 sm:h-5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. The eSewa QR Code & Scan Section */}
        <div className="bg-white rounded-3xl border-2 border-emerald-300 shadow-xl p-6 sm:p-10 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Official eSewa QR Code</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Scan & Donate with eSewa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              eSewa एप वा कुनै पनि बैंकिङ एपबाट सिधै स्क्यान गरी रकम पठाउनुहोस्।
            </p>
          </div>

          {/* QR Code Container */}
          <div className="relative mx-auto w-64 h-64 sm:w-80 sm:h-80 bg-white rounded-3xl p-3 border-2 border-emerald-400 shadow-lg group hover:scale-[1.02] transition-transform">
            <Image
              src="/qr.jpg"
              alt="eSewa QR Code for Suman Bhai Donation"
              fill
              className="object-contain p-2 rounded-2xl"
              priority
            />
          </div>

          {/* Copy eSewa ID / Number Bar */}
          <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="text-left pl-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">eSewa ID / Number</span>
              <span className="text-base font-extrabold text-slate-900 tracking-wider">{esewaId}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy ID'}</span>
            </button>
          </div>

          {/* Instruction Note */}
          <div className="max-w-md mx-auto bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm p-4 rounded-2xl font-medium leading-relaxed text-center">
            <p className="font-bold text-slate-900 mb-0.5">📢 eSewa भुक्तानी गर्दा ध्यान दिनुपर्ने:</p>
            कृपया रकम पठाउँदा Remarks मा <strong>"Suman Upachar"</strong> र आफ्नो नाम/फ्ल्याट नम्बर लेखिदिनुहोला।
          </div>

        </div>

        {/* 4. Heartfelt Nepali Message */}
        <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50 rounded-3xl border border-rose-200 shadow-md p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
            <Heart className="w-5 h-5 fill-rose-600 text-rose-600" />
            <span>STG Community को हार्दिक सन्देश</span>
          </div>

          <div className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line font-serif">
{`हाम्रो STG Community का सुरक्षा गार्ड सुमन भाइ गम्भीर स्वास्थ्य अवस्थामा ICU मा उपचाररत हुनुहुन्छ। यस्तो कठिन परिस्थितिमा उहाँ र उहाँको परिवारलाई हाम्रो सानो सहयोगले पनि ठूलो सहारा दिन सक्छ।

त्यसैले STG Community का सम्पूर्ण सदस्यहरू मिलेर आफ्नो इच्छाअनुसार सानो–ठूलो सहयोग/दान गरिदिनुहुन हार्दिक अनुरोध गर्दछौँ। सहयोगको रकमभन्दा पनि हाम्रो एकता, मानवता र साथ ठूलो कुरा हो।

आऔँ, सुमन भाइको उपचारमा हाम्रो सानो सहयोगबाट ठूलो आशा र सहारा बनौँ। 🙏

धन्यवाद।
STG Community`}
          </div>
        </div>

        {/* 5. Donators List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                Community Donors
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                सहयोगी मनहरू (Donator List)
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {(data?.donors && data.donors.length > 0) ? (
              data.donors.map((d) => (
                <div
                  key={d._id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-rose-200 hover:shadow-sm transition-all flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                        {d.isAnonymous ? '?' : d.donorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">
                          {d.donorName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <span className="font-extrabold text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                      Rs. {d.amount.toLocaleString()}
                    </span>
                  </div>

                  {d.message && (
                    <p className="text-xs text-slate-600 italic bg-white p-2 rounded-xl border border-slate-100">
                      "{d.message}"
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-slate-400 text-sm">
                अहिलेसम्म कुनै सहयोग दर्ता भएको छैन। पहिलो सहयोगी बन्नुहोस्!
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-4 pb-10 space-y-2">
          <p>© 2026 STG Community • सानो सहयोग, ठूलो सहारा।</p>
          <div className="flex justify-center gap-4">
            <Link href="/" className="hover:text-slate-600">Home</Link>
            <span>•</span>
            <Link href="/dashboard" className="hover:text-slate-600">Dashboard</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
