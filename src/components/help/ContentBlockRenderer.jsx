import React from 'react';
import { Lightbulb, Info, CheckCircle2 } from 'lucide-react';
import StepList from './StepList';
import AnnotatedScreenshot from '../tutorial/AnnotatedScreenshot';
import AnimatedWalkthrough from '../tutorial/AnimatedWalkthrough';
import FlowChart from '../tutorial/FlowChart';
import ProcessFlow from '../tutorial/ProcessFlow';
import VideoPlayer from '../tutorial/VideoPlayer';
import PracticeArea from '../practice/PracticeArea';
import Callout from './Callout';
import { getInfographic } from '../../data/infographicContent';

const Paragraph = ({ text }) => <p>{text}</p>;

const Steps = ({ items }) => <StepList items={items} />;

const Tip = ({ title, text }) => (
  <div className="bg-[#D4E4D4]/30 rounded-lg p-3">
    <div className="flex items-start gap-2">
      <Lightbulb className="w-4 h-4 text-[#00A651] flex-shrink-0 mt-0.5" />
      <p className="text-xs text-gray-800">
        <strong className="text-[#00A651]">{title}:</strong> {text}
      </p>
    </div>
  </div>
);

const InfoCard = ({ items }) => (
  <div className="space-y-2">
    {items.map((item, i) => (
      <div key={i} className="bg-[#F5F9F5] rounded-lg p-3 border border-[#D4E4D4]/50">
        <h4 className="text-[#00A651] font-semibold text-xs mb-1">{item.label}</h4>
        <p className="text-xs">{item.text}</p>
      </div>
    ))}
  </div>
);

const Checklist = ({ items }) => (
  <div className="space-y-2.5">
    {items.map((text, i) => (
      <div key={i} className="flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-[#00A651] flex-shrink-0 mt-0.5" />
        <p className="text-xs">{text}</p>
      </div>
    ))}
  </div>
);

/** Renders an AnnotatedScreenshot from block data */
const AnnotatedScreenshotBlock = ({ placeholderLabel, annotations, arrows }) => (
  <AnnotatedScreenshot
    placeholderLabel={placeholderLabel}
    annotations={annotations}
    arrows={arrows}
  />
);

/** Renders an AnimatedWalkthrough from block data */
const AnimatedWalkthroughBlock = ({ steps, autoPlay, loop, stepDelay, title }) => (
  <AnimatedWalkthrough
    steps={steps}
    autoPlay={autoPlay}
    loop={loop}
    stepDelay={stepDelay}
    title={title}
  />
);

/** Renders the right infographic component based on infographicId */
const InfographicBlock = ({ infographicId }) => {
  const data = getInfographic(infographicId);
  if (!data) return null;

  if (data.type === 'flowchart') {
    return (
      <FlowChart
        title={data.title}
        description={data.description}
        nodes={data.nodes}
        edges={data.edges}
      />
    );
  }

  if (data.type === 'process-flow') {
    return (
      <ProcessFlow
        title={data.title}
        description={data.description}
        steps={data.steps}
      />
    );
  }

  return null;
};

/** Renders a VideoPlayer from block data */
const VideoBlock = ({ url, title }) => (
  <VideoPlayer url={url} title={title} />
);

/** Renders a PracticeArea from block data */
const PracticeAreaBlock = ({ practiceId }) => (
  <PracticeArea practiceId={practiceId} />
);

/** Renders a Callout from block data */
const CalloutBlock = ({ variant, title, text }) => (
  <Callout variant={variant} title={title} text={text} />
);

const RENDERERS = {
  paragraph: Paragraph,
  steps: Steps,
  tip: Tip,
  'info-card': InfoCard,
  checklist: Checklist,
  'annotated-screenshot': AnnotatedScreenshotBlock,
  'animated-walkthrough': AnimatedWalkthroughBlock,
  infographic: InfographicBlock,
  video: VideoBlock,
  'practice-area': PracticeAreaBlock,
  callout: CalloutBlock,
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
