'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Shield, CreditCard, Wrench, Zap, Clock, Eye, Ban, DoorOpen, Printer, AlertTriangle, Mail, Phone } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Lang = 'en' | 'np';

const content = {
  en: {
    title: "Rental Terms & Conditions",
    subtitle: "Governing your tenancy at STG Tower",
    intro: "By signing a lease agreement with STG Tower (\"Landlord\") and occupying a unit (\"Premises\"), you (\"Tenant\") agree to abide by the following terms designed to ensure a safe, secure, and high-quality living environment.",
    sections: [
      {
        icon: <Clock className="h-4 w-4" />, title: "1. Contract & Renewal",
        items: ["Mandatory initial contract period of 2 years.", "Automatic 15% rent increase upon renewal after 2 years."]
      },
      {
        icon: <CreditCard className="h-4 w-4" />, title: "2. Rent Payment",
        items: ["Rent must be paid 3 months in advance.", "All payments must be made digitally via the STG Tower Portal."]
      },
      {
        icon: <Zap className="h-4 w-4" />, title: "3. Utilities",
        items: ["Electricity: Rs 19 per unit (as per sub-meter) Three-phase Line .", "Water: Rs 0.30 per liter based on consumption tanker water and occasionally from the Melamchi water supply."]
      },
      {
        icon: <Wrench className="h-4 w-4" />, title: "4. Service Charges",
        items: [
           "Monthly fixed charge: Rs 500 (general maintenance).", 
           "Costs exceeding Rs 500/month billed additionally.",
           "Zero Elevator Charge: Premium, 24/7 dual-elevator access is completely free of any usage or maintenance fees."
        ]
      },
      {
        icon: <Shield className="h-4 w-4" />, title: "5. Security",
        items: ["Monthly security charge: Rs 1000.", "Covers 12-hour professional security guard service."]
      },
      {
        icon: <AlertTriangle className="h-4 w-4" />, title: "6. Damages",
        items: ["Tenant must maintain property in good condition.", "Damage beyond normal wear and tear must be compensated."]
      },
      {
        icon: <Eye className="h-4 w-4" />, title: "7. Inspections",
        items: ["Landlord reserves the right to inspect with prior reasonable notice for safety or maintenance."]
      },
      {
        icon: <Ban className="h-4 w-4" />, title: "8. Restrictions",
        items: ["NO unlawful activities on premises.", "NO disturbing neighbors; maintain peace.", "NO structural changes without prior written approval."]
      },
      {
        icon: <DoorOpen className="h-4 w-4" />, title: "9. Termination",
        items: ["The tenant must give at least 30 days’ written notice to the landlord before leaving the flat or room. The tenant may not vacate without such notice."]
      }
    ],
    contact: "Contact Management"
  },
  np: {
    title: "भाडाका नियम तथा सर्तहरू",
    subtitle: "एस टी जी टावरमा तपाईंको बसाइ व्यवस्थित गर्ने सर्तहरू",
    intro: "एस टी जी टावर (\"घरधनी\") सँग सम्झौतामा हस्ताक्षर गरेर र इकाई ओगटेपछि, तपाईं (\"भाडावाल\") सुरक्षित र गुणस्तरीय वातावरण सुनिश्चित गर्न निम्न सर्तहरूमा सहमत हुनुहुन्छ।",
    sections: [
      {
        icon: <Clock className="h-4 w-4" />, title: "१. सम्झौता र नवीकरण",
        items: ["२ वर्षको अनिवार्य प्रारम्भिक सम्झौता।", "२ वर्ष पछि नवीकरण गर्दा भाडा स्वतः १५% ले वृद्धि हुनेछ।"]
      },
      {
        icon: <CreditCard className="h-4 w-4" />, title: "२. भाडा भुक्तानी",
        items: ["भाडा ३ महिनाको अग्रिम रूपमा बुझाउनुपर्नेछ।", "सबै भुक्तानीहरू डिजिटल पोर्टल मार्फत गरिनुपर्छ।"]
      },
      {
        icon: <Zap className="h-4 w-4" />, title: "३. उपयोगिता दरहरू",
        items: ["बिजुली: रु १९ प्रति युनिट (सब-मिटर अनुसार) थ्री-फेज बिजुली लाइन।", "पानी: रु ०.३५ प्रति लिटर (खपत अनुसार) ट्यांकर पानी तथा कहिलेकाहीँ मेलम्ची खानेपानी ।"]
      },
      {
        icon: <Wrench className="h-4 w-4" />, title: "४. सेवा शुल्क",
        items: [
           "मासिक सेवा शुल्क: रु ५०० (सामान्य मर्मतको लागि)।", 
           "रु ५०० भन्दा बढी खर्च भएमा अतिरिक्त बिल गरिनेछ।",
           "कुनै लिफ्ट शुल्क छैन: प्रिमियम २४ सै घण्टा लिफ्ट सुविधा उपयोग गर्न वा मर्मत गर्न कुनै अतिरिक्त शुल्क लाग्ने छैन।"
        ]
      },
      {
        icon: <Shield className="h-4 w-4" />, title: "५. सुरक्षा सेवा",
        items: ["मासिक सुरक्षा शुल्क: रु १००० (१२-घण्टे गार्ड सेवा)।"]
      },
      {
        icon: <AlertTriangle className="h-4 w-4" />, title: "६. क्षतिपूर्ति",
        items: ["सम्पत्तिलाई राम्रो अवस्थामा राख्नुपर्छ।", "सामान्य टुटफुट बाहेकको क्षतिको क्षतिपूर्ति भाडावालले व्यहोर्नुपर्नेछ।"]
      },
      {
        icon: <Eye className="h-4 w-4" />, title: "७. निरीक्षण",
        items: ["घरधनीले पूर्व जानकारी दिएर निरीक्षण गर्ने अधिकार राख्छ।"]
      },
      {
        icon: <Ban className="h-4 w-4" />, title: "८. प्रतिबन्धहरू",
        items: ["कुनै पनि गैरकानुनी गतिविधि गर्न पाइने छैन।", "हल्ला गरेर छिमेकीलाई असर पार्न पाइने छैन।", "पूर्व स्वीकृति बिना संरचनात्मक परिवर्तन गर्न पाइने छैन।"]
      },
      {
        icon: <DoorOpen className="h-4 w-4" />, title: "९. सम्झौता अन्त्य",
        items: ["फ्ल्याट वा कोठा छोड्नु अघि कम्तीमा ३० दिनअघि मकानधनीलाई लिखित सूचना दिनुपर्छ। यस्तो सूचना नदिई कोठा छोड्न पाइने छैन।"]
      }
    ],
    contact: "सम्पर्क व्यवस्थापन"
  }
};

export default function TermsPage() {
  const [lang, setLang] = useState<Lang>('en');
  const t = content[lang];

  // Animation variants for staggered reveal
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  return (
    <>
      {/* 0-Lag Pure Auto-Printing Styles that override all React framer-motion layers */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 1cm 1cm; }
          body { background: white !important; font-size: 10pt; line-height: 1.35; color: black !important; -webkit-print-color-adjust: exact; }
          
          /* Hide non-printable elements */
          .no-print, header, nav, footer, button { display: none !important; }
          
          /* Reset container to allow natural page flow (Fixes blank page) */
          .print-container {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
            transform: none !important; 
            overflow: visible !important;
          }
          
          .print-container * {
            color: black !important;
            box-shadow: none !important;
            transform: none !important;
          }
          
          /* Background gradients and UI effects should disappear */
          .bg-gradient-to-r, .bg-gradient-to-tr, .bg-gradient-to-bl, .backdrop-blur-xl, .backdrop-blur-3xl {
            background: transparent !important;
            backdrop-filter: none !important;
          }
          
          /* The Magic: Two-column layout for the body content */
          .print-columns { column-count: 2; column-gap: 2rem; column-rule: 1px solid #ddd; display: block !important; margin-top: 1rem; }
          .print-header { text-align: center; margin-bottom: 1rem; border-bottom: 2px solid #000; padding-bottom: 0.5rem; display: block !important; width: 100%; }
          .print-section { break-inside: avoid; margin-bottom: 1rem; display: block !important; }
          .print-intro { font-style: italic; margin-bottom: 1rem; padding: 10px; border-left: 4px solid #000 !important; display: block !important; background: transparent !important; }
          
          h1 { font-size: 22pt !important; margin-top: 0 !important; margin-bottom: 0.2rem !important; font-weight: 900 !important; }
          h2 { font-size: 11pt !important; text-transform: uppercase; font-weight: 800 !important; letter-spacing: 0.05em; margin-bottom: 0.2rem !important; }
          ul { padding-left: 1.2em !important; margin: 0 !important; }
          li { margin-bottom: 0.25em !important; display: list-item !important; }
          
          /* Force SVG icons to render correctly in print */
          svg { width: 14pt !important; height: 14pt !important; }
        }
      `}} />

      <div className="min-h-screen bg-gray-50 font-sans print:bg-white">
        {/* --- Header (Hidden on Print) --- */}
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-20 no-print">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Ultra Premium Animated Back Button */}
              <Button asChild variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-white/80 border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(11,40,99,0.08)] hover:border-blue-200 hover:bg-white transition-all duration-300 group shrink-0">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 text-slate-500 group-hover:text-[#0B2863] group-hover:-translate-x-0.5 transition-all duration-300" />
                </Link>
              </Button>
              
              <Link href="/" className="font-black text-lg md:text-xl text-slate-800 tracking-tight hover:text-[#0B2863] transition-colors">STG TOWER</Link>
              
              <div className="hidden sm:flex items-center gap-3">
                <div className="h-4 w-[1px] bg-slate-200"></div>
                <span className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">{lang === 'en' ? 'Terms & Policies' : 'नियम तथा सर्तहरू'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-5">
                <Button onClick={() => window.print()} variant="outline" className="hidden md:flex gap-2 h-10 px-5 rounded-full border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-blue-200 hover:bg-blue-50/50 hover:text-[#0B2863] transition-all cursor-pointer font-bold text-slate-600">
                    <Printer className="h-4 w-4" /> Print Document
                </Button>
                
                {/* 0-Lag Ultra Premium iOS Style Segmented Control */}
                <div className="relative flex items-center bg-slate-100/80 backdrop-blur-md p-1 rounded-full border border-slate-200/60 shadow-inner w-32 md:w-36 h-10 md:h-12 shrink-0">
                    {/* Sliding Pill */}
                    <div className={cn("absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-out z-10", lang === 'en' ? 'translate-x-0 left-1' : 'translate-x-full left-1')}></div>
                    
                    <button onClick={() => setLang('en')} className={cn('relative z-20 w-1/2 h-full flex items-center justify-center text-sm md:text-base font-black transition-colors duration-300', lang === 'en' ? 'text-[#0B2863]' : 'text-slate-400 hover:text-slate-600')}>EN</button>
                    <button onClick={() => setLang('np')} className={cn('relative z-20 w-1/2 h-full flex items-center justify-center text-sm md:text-base font-black transition-colors duration-300', lang === 'np' ? 'text-[#0B2863]' : 'text-slate-400 hover:text-slate-600')}>NP</button>
                </div>
            </div>
          </div>
        </header>

        {/* --- Main Content --- */}
        <main className="container mx-auto px-4 py-8 md:py-12 max-w-4xl print:max-w-none print:p-0">
          <AnimatePresence mode="wait">
              <motion.div
                  key={lang}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
              >
                  <Card className="border border-white/60 shadow-[0_20px_80px_rgba(11,40,99,0.07)] rounded-[2.5rem] bg-white/70 backdrop-blur-3xl print-container relative overflow-hidden group">
                      {/* Ambient Background Shimmers */}
                      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-blue-100/40 to-transparent blur-3xl pointer-events-none -z-10"></div>
                      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-50/50 to-transparent blur-3xl pointer-events-none -z-10"></div>
                      
                      <CardContent className="p-8 md:p-14 lg:p-16 print:p-0 relative z-10">
                          {/* Document Header */}
                          <div className="text-center mb-16 print-header">
                              <div className="mx-auto bg-gradient-to-b from-[#0B2863] to-blue-800 w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mb-6 no-print shadow-[0_10px_20px_rgba(11,40,99,0.2)] hover:rotate-6 transition-transform duration-500 cursor-default">
                                  <FileText className="w-8 h-8 md:w-10 md:h-10 text-white" />
                              </div>
                              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 mb-4 print:text-black">{t.title}</h1>
                              <p className="text-lg md:text-xl text-slate-500 font-semibold print:hidden tracking-wide uppercase">{t.subtitle}</p>
                          </div>

                          {/* Intro Paragraph */}
                          <div className="bg-gradient-to-r from-blue-100/80 to-transparent p-[1px] rounded-2xl mb-12 shadow-sm">
                            <p className="text-slate-700 font-medium bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-2xl border-l-[6px] border-[#0B2863] leading-relaxed text-base md:text-lg print-intro print:bg-transparent print:p-0 print:border-0">
                                {t.intro}
                            </p>
                          </div>

                          {/* Clauses Section - Premium Grid/Stack */}
                          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 md:space-y-12 print:space-y-0 print:print-columns">
                              {t.sections.map((section, index) => (
                                  <motion.div key={index} variants={itemVariants} className="print-section group/section relative">
                                      <div className="hidden md:block absolute -left-8 top-6 bottom-0 w-[2px] bg-slate-100 group-hover/section:bg-blue-200 transition-colors"></div>
                                      
                                      <div className="flex items-start gap-4 md:gap-5 mb-4 print:mb-1 relative z-10">
                                          <div className="p-3 md:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-[#0B2863] group-hover/section:scale-110 group-hover/section:bg-[#0B2863] group-hover/section:text-white group-hover/section:shadow-md transition-all duration-300 no-print shrink-0 relative">
                                            {/* Glow on hover */}
                                            <div className="absolute inset-0 bg-[#0B2863]/20 blur-md rounded-2xl opacity-0 group-hover/section:opacity-100 -z-10 transition-opacity"></div>
                                            {React.cloneElement(section.icon as React.ReactElement, { className: "w-5 h-5 md:w-6 md:h-6" })}
                                          </div>
                                          <div className="pt-2 md:pt-3">
                                            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight print:m-0 group-hover/section:text-[#0B2863] transition-colors">{section.title}</h2>
                                          </div>
                                      </div>
                                      <ul className="space-y-3 text-slate-600 font-medium pl-[4rem] md:pl-[5.25rem] list-disc marker:text-emerald-400 print:pl-4 print:text-black">
                                          {section.items.map((item, i) => <li key={i} className="leading-snug md:leading-relaxed">{item}</li>)}
                                      </ul>
                                  </motion.div>
                              ))}
                          </motion.div>

                          <Separator className="my-12 md:my-16 bg-slate-200 print:my-6 print:hidden" />

                          {/* Footer */}
                          <div className="flex flex-col md:flex-row justify-between items-center text-sm font-bold text-slate-500 gap-6 print:text-xs print:mt-auto print:border-t print:pt-4">
                              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-200 shadow-sm no-print">
                                <Shield className="h-4 w-4" />
                                <span>{lang === 'en' ? 'By signing, you agree to all terms.' : 'हस्ताक्षर गरेर, तपाईं सबै सर्तहरूमा सहमत हुनुहुन्छ।'}</span>
                              </div>
                              <div className="flex items-center gap-4 print:hidden">
                                  <span className="font-medium">{t.contact}</span>
                                  <a href="mailto:stgtowerhouse@gmail.com" className="flex items-center gap-1.5 text-primary hover:underline transition-colors"><Mail className="h-3.5 w-3.5"/> Email</a>
                                  <a href="tel:9822790665" className="flex items-center gap-1.5 text-primary hover:underline transition-colors"><Phone className="h-3.5 w-3.5"/> Call</a>
                              </div>
                               <div className="hidden print:block font-bold">STG Tower Management</div>
                          </div>
                      </CardContent>
                  </Card>
              </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}