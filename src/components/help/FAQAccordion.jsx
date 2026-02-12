import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQItem = ({ question, answer, id, forceOpen }) => {
  const [open, setOpen] = useState(forceOpen || false);

  return (
    <div id={id} className="border-b border-[#D4E4D4]/50 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-gray-800 text-sm font-medium pr-4">{question}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#00A651] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#00A651] flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="pb-3 text-gray-600 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQAccordion = ({ faqs, forceOpenId }) => (
  <div className="bg-white border border-[#D4E4D4] rounded-xl px-4">
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
