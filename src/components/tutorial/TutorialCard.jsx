import React from 'react';
import * as Icons from 'lucide-react';
import ContentBlockRenderer from '../help/ContentBlockRenderer';
import MetricScale from './MetricScale';
import ProTip from './ProTip';
import AnnotatedScreenshot from './AnnotatedScreenshot';
import AnimatedWalkthrough from './AnimatedWalkthrough';
import FlowChart from './FlowChart';
import ProcessFlow from './ProcessFlow';
import VideoPlayer from './VideoPlayer';

const IconHero = ({ icon, label }) => {
  const IconComponent = Icons[icon] || Icons.HelpCircle;
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="w-20 h-20 bg-[#1a8a68]/40 border-2 border-[#4ade80]/50 rounded-full flex items-center justify-center mb-3">
        <IconComponent className="w-10 h-10 text-[#4ade80]" />
      </div>
      {label && <p className="text-[#4ade80] text-sm font-medium">{label}</p>}
    </div>
  );
};

const TutorialCard = ({ step, stepIndex, totalSteps }) => {
  const StepIcon = Icons[step.icon] || Icons.Circle;

  // Separate metric-scale blocks from regular blocks for ContentBlockRenderer
  const regularBlocks = step.content.filter((b) => b.type !== 'metric-scale');
  const metricBlocks = step.content.filter((b) => b.type === 'metric-scale');

  return (
    <div className="text-white/90 text-sm space-y-4">
      {/* Step counter */}
      <div className="flex items-center justify-between">
        <span className="text-white/40 text-xs">
          Step {stepIndex + 1} of {totalSteps}
        </span>
      </div>

      {/* Title with icon */}
      <div className="flex items-center gap-2">
        <StepIcon className="w-5 h-5 text-[#4ade80] flex-shrink-0" />
        <h3 className="text-white font-bold text-lg">{step.title}</h3>
      </div>

      {/* Visual area */}
      {step.visual && step.visual.type === 'icon-hero' && (
        <IconHero icon={step.visual.icon} label={step.visual.label} />
      )}
      {step.visual && step.visual.type === 'annotated-screenshot' && (
        <AnnotatedScreenshot
          placeholderLabel={step.visual.placeholderLabel}
          annotations={step.visual.annotations}
        />
      )}
      {step.visual && step.visual.type === 'animated-walkthrough' && (
        <AnimatedWalkthrough
          steps={step.visual.steps}
          autoPlay={step.visual.autoPlay}
          loop={step.visual.loop}
          stepDelay={step.visual.stepDelay}
          title={step.visual.title}
        />
      )}
      {step.visual && step.visual.type === 'infographic' && step.visual.infographicType === 'flowchart' && (
        <FlowChart
          title={step.visual.title}
          description={step.visual.description}
          nodes={step.visual.nodes}
          edges={step.visual.edges}
        />
      )}
      {step.visual && step.visual.type === 'infographic' && step.visual.infographicType === 'process-flow' && (
        <ProcessFlow
          title={step.visual.title}
          description={step.visual.description}
          steps={step.visual.steps}
        />
      )}
      {step.visual && step.visual.type === 'video' && (
        <VideoPlayer
          url={step.visual.url}
          title={step.visual.title}
        />
      )}

      {/* Content blocks */}
      {regularBlocks.length > 0 && <ContentBlockRenderer blocks={regularBlocks} />}

      {/* Metric scale blocks */}
      {metricBlocks.map((block, i) => (
        <MetricScale key={i} metrics={block.metrics} />
      ))}

      {/* Pro Tip */}
      {step.proTip && <ProTip text={step.proTip.text} />}
    </div>
  );
};

export default TutorialCard;
