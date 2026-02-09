import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQItem = ({ question, answer, id, forceOpen }) => {
  const [open, setOpen] = useState(forceOpen || false);

  return (
    <div id={id} className="border-b border-[#1a8a68]/50 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-white text-sm font-medium pr-4">{question}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="pb-3 text-white/70 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQAccordion = ({ faqs, forceOpenId }) => (
  <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl px-4">
    {faqs.map((faq) => (
      <FAQItem
        key={faq.id}
        id={faq.id}
        question={faq.question}
        answer={faq.answer}
        forceOpen={forceOpenId === faq.id}
      />
    ))}
  </div>
);

export default FAQAccordion;
