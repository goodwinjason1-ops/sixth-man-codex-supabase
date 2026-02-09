import React from 'react';
import { Lightbulb, Info, CheckCircle2 } from 'lucide-react';
import StepList from './StepList';

const Paragraph = ({ text }) => <p>{text}</p>;

const Steps = ({ items }) => <StepList items={items} />;

const Tip = ({ title, text }) => (
  <div className="bg-[#1a8a68]/30 rounded-lg p-3">
    <div className="flex items-start gap-2">
      <Lightbulb className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
      <p className="text-xs text-white/90">
        <strong className="text-[#4ade80]">{title}:</strong> {text}
      </p>
    </div>
  </div>
);

const InfoCard = ({ items }) => (
  <div className="space-y-2">
    {items.map((item, i) => (
      <div key={i} className="bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
        <h4 className="text-[#4ade80] font-semibold text-xs mb-1">{item.label}</h4>
        <p className="text-xs">{item.text}</p>
      </div>
    ))}
  </div>
);

const Checklist = ({ items }) => (
  <div className="space-y-2.5">
    {items.map((text, i) => (
      <div key={i} className="flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
        <p className="text-xs">{text}</p>
      </div>
    ))}
  </div>
);

const RENDERERS = {
  paragraph: Paragraph,
  steps: Steps,
  tip: Tip,
  'info-card': InfoCard,
  checklist: Checklist,
};

const ContentBlockRenderer = ({ blocks }) => (
  <div className="space-y-3">
    {blocks.map((block, i) => {
      const Renderer = RENDERERS[block.type];
      if (!Renderer) return null;
      return <Renderer key={i} {...block} />;
    })}
  </div>
);

export default ContentBlockRenderer;
