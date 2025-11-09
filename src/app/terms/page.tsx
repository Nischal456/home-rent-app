'use client';

import { useState } from 'react';
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
        items: ["Monthly fixed charge: Rs 500 (general maintenance).", "Costs exceeding Rs 500/month billed additionally."]
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
        items: ["मासिक सेवा शुल्क: रु ५०० (सामान्य मर्मतको लागि)।", "रु ५०० भन्दा बढी खर्च भएमा अतिरिक्त बिल गरिनेछ।"]
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
      {/* "Best of Best" Print Styles: Magazine-style 2-column layout for perfect 1-page fit */}
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 1.5cm 2cm; }
          body { background: white !important; color: #1a1a1a !important; font-size: 9.5pt; line-height: 1.3; }
          .no-print { display: none !important; }
          .print-container { box-shadow: none !important; border: none !important; padding: 0 !important; }
          /* The Magic: Two-column layout for the body content */
          .print-columns { column-count: 2; column-gap: 2.5rem; column-rule: 1px solid #eee; orphans: 3; widows: 3; }
          .print-header { text-align: center; margin-bottom: 1.5rem; border-bottom: 2px solid #1a1a1a; padding-bottom: 1rem; }
          .print-section { break-inside: avoid; margin-bottom: 1rem; }
          .print-intro { font-style: italic; margin-bottom: 1.5rem; font-size: 10pt; opacity: 0.8; }
          h1 { font-size: 22pt !important; margin-bottom: 0.2rem !important; color: black !important; }
          h2 { font-size: 10pt !important; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.2rem !important; color: #444 !important; }
          ul { padding-left: 1.2em !important; margin: 0 !important; }
          li { margin-bottom: 0.15em !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 font-sans print:bg-white">
        {/* --- Header (Hidden on Print) --- */}
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-20 no-print">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon" className="md:hidden"><Link href="/"><ArrowLeft className="h-5 w-5" /></Link></Button>
              <Link href="/" className="font-bold text-xl text-primary">STG Tower</Link>
              <span className="text-sm font-medium text-muted-foreground hidden sm:block">{lang === 'en' ? 'Terms & Conditions' : 'नियम तथा सर्तहरू'}</span>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden md:flex gap-2">
                    <Printer className="h-4 w-4" /> Print
                </Button>
                <div className="flex items-center bg-gray-100 p-1 rounded-md border">
                    <button onClick={() => setLang('en')} className={cn('px-3 py-1 text-xs font-medium rounded-sm transition-all', lang === 'en' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-gray-900')}>EN</button>
                    <button onClick={() => setLang('np')} className={cn('px-3 py-1 text-xs font-medium rounded-sm transition-all', lang === 'np' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-gray-900')}>NP</button>
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
                  <Card className="border-0 shadow-xl print-container">
                      <CardContent className="p-8 md:p-12 print:p-0">
                          {/* Document Header */}
                          <div className="text-center mb-10 print-header">
                              <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 no-print">
                                  <FileText className="w-6 h-6 text-primary" />
                              </div>
                              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 print:text-black">{t.title}</h1>
                              <p className="text-lg text-muted-foreground print:hidden">{t.subtitle}</p>
                          </div>

                          {/* Intro Paragraph */}
                          <p className="text-gray-700 bg-gray-50 p-5 rounded-xl border-l-4 border-primary mb-10 print-intro print:bg-transparent print:p-0 print:border-0">
                              {t.intro}
                          </p>

                          {/* Clauses Section - Multi-column on print */}
                          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 print:space-y-0 print:print-columns">
                              {t.sections.map((section, index) => (
                                  <motion.div key={index} variants={itemVariants} className="print-section">
                                      <div className="flex items-center gap-2.5 mb-2 print:mb-1">
                                          <div className="p-1.5 rounded-md bg-primary/10 text-primary no-print">{section.icon}</div>
                                          <h2 className="text-xl font-bold text-gray-900 print:m-0">{section.title}</h2>
                                      </div>
                                      <ul className="space-y-1.5 text-gray-600 pl-11 list-disc print:pl-4 print:text-black">
                                          {section.items.map((item, i) => <li key={i}>{item}</li>)}
                                      </ul>
                                  </motion.div>
                              ))}
                          </motion.div>

                          <Separator className="my-10 print:my-6 print:hidden" />

                          {/* Footer */}
                          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground gap-4 print:text-xs print:mt-auto print:border-t print:pt-4">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 no-print" />
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