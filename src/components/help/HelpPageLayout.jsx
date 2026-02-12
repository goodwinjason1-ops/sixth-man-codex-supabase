import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Printer, HelpCircle, Mail, Calendar } from 'lucide-react';
import iconMap from '../../utils/iconMap';
import { HELP_PAGES, HELP_CONTENT } from '../../data/helpContent';
import CollapsibleSection from './CollapsibleSection';
import FAQAccordion from './FAQAccordion';

const HIGHLIGHT_COLORS = {
  purple: 'bg-violet-500/10 border-violet-500/50 text-violet-300',
  pink: 'bg-pink-500/10 border-pink-500/50 text-pink-300',
  green: 'bg-green-500/10 border-green-500/50 text-green-300',
  amber: 'bg-amber-500/10 border-amber-500/50 text-amber-300',
  violet: 'bg-violet-500/10 border-violet-500/50 text-violet-300',
  yellow: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-300',
  blue: 'bg-blue-500/10 border-blue-500/50 text-blue-300',
};

const HelpPageLayout = ({ roleSlug }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hashTarget, setHashTarget] = useState(null);

  const page = HELP_PAGES[roleSlug];
  const content = HELP_CONTENT[roleSlug];

  useEffect(() => {
    if (location.hash) {
      setHashTarget(location.hash.slice(1));
    }
  }, [location.hash]);

  if (!page || !content) return null;

  const PageIcon = iconMap[page.icon] || HelpCircle;
  const colorClass = HIGHLIGHT_COLORS[page.highlightColor] || HIGHLIGHT_COLORS.green;

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#F5F9F5] border-b border-[#D4E4D4] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/help')}
            className="flex items-center gap-2 text-[#00A651] hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Help Center</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-1.5 border border-[#D4E4D4] rounded-lg text-gray-600 text-xs hover:bg-gray-100 transition-colors print:hidden"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-white border-2 border-[#D4E4D4] rounded-full flex items-center justify-center mx-auto mb-3">
            <PageIcon className="w-7 h-7 text-[#00A651]" />
          </div>
          <h1 className="text-gray-800 text-xl font-bold">{page.title}</h1>
          <p className="text-[#00A651] text-sm mt-1">{page.subtitle}</p>
        </div>

        {/* Overview Card */}
        <div className={`border rounded-xl p-4 mb-4 ${colorClass}`}>
          <h2 className="font-semibold text-sm mb-2">{content.overview.title}</h2>
          <p className="text-gray-700 text-sm">{content.overview.text}</p>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {content.sections.map((section) => (
            <CollapsibleSection
              key={section.id}
              id={section.id}
              title={section.title}
              icon={section.icon}
              content={section.content}
              defaultOpen={section.defaultOpen}
              forceOpen={hashTarget === section.id}
            />
          ))}
        </div>

        {/* FAQs */}
        {content.faqs && content.faqs.length > 0 && (
          <div className="mt-6">
            <h2 className="text-gray-800 font-bold text-base mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#00A651]" />
              Frequently Asked Questions
            </h2>
            <FAQAccordion faqs={content.faqs} forceOpenId={hashTarget} />
          </div>
        )}

        {/* Contact Footer */}
        <div className="mt-6 bg-white border border-[#D4E4D4] rounded-xl p-4">
          <p className="text-gray-700 text-sm">Need more help?</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3 bg-[#F5F9F5] rounded-lg p-3 border border-[#D4E4D4]/50">
              <Mail className="w-4 h-4 text-[#00A651]" />
              <span className="text-gray-800 text-sm">admin@emeraldlakers.com</span>
            </div>
            <div className="flex items-center gap-3 bg-[#F5F9F5] rounded-lg p-3 border border-[#D4E4D4]/50">
              <Calendar className="w-4 h-4 text-[#00A651]" />
              <span className="text-gray-600 text-sm">Response within 24-48 hours</span>
            </div>
          </div>
        </div>

        <div className="h-8" />
      </main>
    </div>
  );
};

export default HelpPageLayout;
