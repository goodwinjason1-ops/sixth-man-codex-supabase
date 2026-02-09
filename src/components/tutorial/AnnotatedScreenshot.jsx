import React from 'react';
import { Monitor } from 'lucide-react';

const POSITION_CLASSES = {
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'top-left': 'top-3 left-3',
  'top-right': 'top-3 right-3',
  'bottom': 'bottom-3 left-1/2 -translate-x-1/2',
  'left': 'top-1/2 left-3 -translate-y-1/2',
  'right': 'top-1/2 right-3 -translate-y-1/2',
};

const ANNOTATION_STYLES = {
  numbered: 'numbered',
  callout: 'callout',
  highlight: 'highlight',
  blur: 'blur',
};

/** Compute pixel position style from percentage-based x/y */
const getPercentStyle = (ann) => {
  if (ann.x != null && ann.y != null) {
    return { left: `${ann.x}%`, top: `${ann.y}%`, transform: 'translate(-50%, -50%)' };
  }
  return {};
};

/** Numbered circle annotation (green circle with number) */
const NumberedAnnotation = ({ index, label }) => (
  <div className="flex items-center gap-1.5">
    <span className="inline-flex items-center justify-center w-6 h-6 min-w-[24px] rounded-full bg-[#4ade80] text-[#0a3d2e] text-xs font-bold shadow-lg">
      {index}
    </span>
    {label && (
      <span className="bg-[#0d5943] text-white px-2 py-0.5 rounded text-xs font-medium shadow whitespace-nowrap">
        {label}
      </span>
    )}
  </div>
);

/** Callout speech bubble annotation */
const CalloutAnnotation = ({ label }) => (
  <div className="relative">
    <div className="bg-[#4ade80] text-[#0a3d2e] px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg whitespace-nowrap">
      {label}
    </div>
    <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#4ade80]" />
  </div>
);

/** Highlight glow rectangle annotation */
const HighlightAnnotation = ({ label, width, height }) => (
  <div
    className="animate-highlight-glow rounded-lg border-2 border-[#4ade80] flex items-center justify-center"
    style={{
      width: width || 80,
      height: height || 40,
      boxShadow: '0 0 12px rgba(74, 222, 128, 0.4), inset 0 0 8px rgba(74, 222, 128, 0.1)',
    }}
  >
    {label && (
      <span className="text-[#4ade80] text-[10px] font-bold whitespace-nowrap">{label}</span>
    )}
  </div>
);

/** Blur region annotation */
const BlurAnnotation = ({ width, height }) => (
  <div
    className="rounded-lg"
    style={{
      width: width || 80,
      height: height || 40,
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      background: 'rgba(10, 61, 46, 0.5)',
    }}
  />
);

/** Default label annotation (backward-compatible) */
const DefaultAnnotation = ({ label }) => (
  <div className="bg-[#4ade80] text-[#0a3d2e] px-2 py-1 rounded-md text-xs font-bold shadow-lg animate-bounce-arrow whitespace-nowrap">
    {label}
  </div>
);

/** Render the correct annotation style */
const renderAnnotation = (ann, index) => {
  switch (ann.style) {
    case ANNOTATION_STYLES.numbered:
      return <NumberedAnnotation index={ann.number ?? index + 1} label={ann.label} />;
    case ANNOTATION_STYLES.callout:
      return <CalloutAnnotation label={ann.label} />;
    case ANNOTATION_STYLES.highlight:
      return <HighlightAnnotation label={ann.label} width={ann.width} height={ann.height} />;
    case ANNOTATION_STYLES.blur:
      return <BlurAnnotation width={ann.width} height={ann.height} />;
    default:
      return <DefaultAnnotation label={ann.label} />;
  }
};

/**
 * Calculate angle and length for an arrow line between two points.
 * Points are given as percentage-based coordinates.
 */
const ArrowLine = ({ from, to, containerRef }) => {
  if (!containerRef) return null;

  const x1 = from.x;
  const y1 = from.y;
  const x2 = to.x;
  const y2 = to.y;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x1}%`,
        top: `${y1}%`,
        width: `${length}%`,
        height: '2px',
        background: 'rgba(74, 222, 128, 0.5)',
        transformOrigin: '0 50%',
        transform: `rotate(${angle}deg)`,
      }}
    >
      {/* Arrow head */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2"
        style={{
          width: 0,
          height: 0,
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent',
          borderLeft: '6px solid rgba(74, 222, 128, 0.7)',
        }}
      />
    </div>
  );
};

const AnnotatedScreenshot = ({
  placeholderLabel,
  annotations = [],
  arrows = [],
  children,
}) => {
  const containerRef = React.useRef(null);

  return (
    <div
      ref={containerRef}
      className="relative bg-[#0a3d2e] border-2 border-dashed border-[#1a8a68] rounded-xl p-6 min-h-[140px] overflow-hidden"
    >
      {/* Placeholder content (shown when no children) */}
      {!children && (
        <div className="flex flex-col items-center justify-center text-center opacity-40">
          <Monitor className="w-10 h-10 text-[#4ade80] mb-2" />
          <p className="text-white/60 text-xs">{placeholderLabel || 'Screenshot coming soon'}</p>
        </div>
      )}

      {/* Optional rendered children (actual screenshot or mock UI) */}
      {children}

      {/* Arrow lines between annotations */}
      {arrows.map((arrow, i) => {
        const fromAnn = annotations[arrow.from];
        const toAnn = annotations[arrow.to];
        if (!fromAnn || !toAnn || fromAnn.x == null || toAnn.x == null) return null;
        return (
          <ArrowLine
            key={`arrow-${i}`}
            from={{ x: fromAnn.x, y: fromAnn.y }}
            to={{ x: toAnn.x, y: toAnn.y }}
            containerRef={containerRef.current}
          />
        );
      })}

      {/* Annotation labels */}
      {annotations.map((ann, i) => {
        const usePercent = ann.x != null && ann.y != null;
        const posClass = !usePercent
          ? POSITION_CLASSES[ann.position] || POSITION_CLASSES.center
          : '';

        return (
          <div
            key={i}
            className={`absolute ${posClass} z-10`}
            style={usePercent ? getPercentStyle(ann) : {}}
          >
            {renderAnnotation(ann, i)}
          </div>
        );
      })}
    </div>
  );
};

export default AnnotatedScreenshot;
