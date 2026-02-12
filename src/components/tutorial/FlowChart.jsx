import React, { useMemo } from 'react';
import iconMap from '../../utils/iconMap';

/**
 * FlowChart
 *
 * Data-driven flowchart with nodes and connecting edges.
 * Inline SVG <line> for edges with arrow-head markers.
 * Forces vertical on mobile.
 *
 * Props:
 *   nodes       - Array of { id, icon, label, description, x, y, color }
 *                 x/y are percentage-based positions (0-100)
 *                 color defaults to '#4ade80'
 *   edges       - Array of { from, to, label } connecting node IDs
 *   title       - Optional title above the chart
 *   description - Optional description text
 *   height      - Container height in px (default 300)
 */

const DEFAULT_NODE_COLOR = '#00A651';
const NODE_SIZE = 56;

const FlowChart = ({ nodes = [], edges = [], title, description, height = 300 }) => {
  /** Resolve a lucide-react icon by name, fallback to Circle */
  const getIcon = (iconName) => {
    if (!iconName) return iconMap.Circle;
    return iconMap[iconName] || iconMap.Circle;
  };

  /** Build lookup for quick node access */
  const nodeMap = useMemo(() => {
    const map = {};
    nodes.forEach((n) => { map[n.id] = n; });
    return map;
  }, [nodes]);

  /** On mobile, force vertical layout by redistributing positions */
  const mobileNodes = useMemo(() => {
    if (!nodes.length) return [];
    return nodes.map((node, i) => ({
      ...node,
      mobileX: 50,
      mobileY: ((i + 0.5) / nodes.length) * 100,
    }));
  }, [nodes]);

  if (!nodes.length) return null;

  return (
    <div className="space-y-2">
      {title && <p className="text-xs text-[#00A651] font-semibold">{title}</p>}
      {description && <p className="text-gray-600 text-xs">{description}</p>}

      {/* Desktop / tablet layout */}
      <div
        className="relative bg-[#F5F9F5] border-2 border-dashed border-[#D4E4D4] rounded-xl overflow-hidden hidden sm:block"
        style={{ height }}
      >
        {/* SVG edge lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id="flowchart-arrow"
              viewBox="0 0 10 7"
              refX="9"
              refY="3.5"
              markerWidth="8"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="rgba(74, 222, 128, 0.6)" />
            </marker>
          </defs>

          {edges.map((edge, i) => {
            const fromNode = nodeMap[edge.from];
            const toNode = nodeMap[edge.to];
            if (!fromNode || !toNode) return null;

            const x1 = fromNode.x;
            const y1 = fromNode.y;
            const x2 = toNode.x;
            const y2 = toNode.y;

            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;

            return (
              <g key={`edge-${i}`}>
                <line
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="rgba(74, 222, 128, 0.35)"
                  strokeWidth="2"
                  markerEnd="url(#flowchart-arrow)"
                />
                {edge.label && (
                  <text
                    x={`${mx}%`}
                    y={`${my}%`}
                    dy="-6"
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 0.5)"
                    fontSize="10"
                    className="select-none"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const NodeIcon = getIcon(node.icon);
          const color = node.color || DEFAULT_NODE_COLOR;

          return (
            <div
              key={node.id}
              className="absolute z-10 flex flex-col items-center gap-1"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="flex items-center justify-center rounded-full border-2 shadow-lg"
                style={{
                  width: NODE_SIZE,
                  height: NODE_SIZE,
                  minWidth: 44,
                  minHeight: 44,
                  borderColor: color,
                  backgroundColor: `${color}15`,
                }}
              >
                <NodeIcon className="w-5 h-5" style={{ color }} />
              </div>
              <span className="text-[10px] text-gray-800 font-medium text-center whitespace-nowrap max-w-[80px] truncate">
                {node.label}
              </span>
              {node.description && (
                <span className="text-[9px] text-gray-400 text-center max-w-[90px] leading-tight">
                  {node.description}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile vertical layout */}
      <div className="sm:hidden bg-[#F5F9F5] border-2 border-dashed border-[#D4E4D4] rounded-xl p-4">
        <div className="flex flex-col items-center gap-0">
          {mobileNodes.map((node, i) => {
            const NodeIcon = getIcon(node.icon);
            const color = node.color || DEFAULT_NODE_COLOR;
            const isLast = i === mobileNodes.length - 1;

            const edgeLabel = !isLast
              ? edges.find((e) => e.from === node.id && e.to === mobileNodes[i + 1]?.id)?.label
              : null;

            return (
              <React.Fragment key={node.id}>
                {/* Node */}
                <div className="flex items-center gap-3 w-full max-w-[260px]">
                  <div
                    className="flex items-center justify-center rounded-full border-2 shadow-lg flex-shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      minWidth: 44,
                      minHeight: 44,
                      borderColor: color,
                      backgroundColor: `${color}15`,
                    }}
                  >
                    <NodeIcon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-800 font-medium truncate">{node.label}</p>
                    {node.description && (
                      <p className="text-[10px] text-gray-400 leading-tight">{node.description}</p>
                    )}
                  </div>
                </div>

                {/* Connector line + edge label */}
                {!isLast && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex flex-col items-center" style={{ width: 44 }}>
                      <svg width="2" height="24" className="block">
                        <line
                          x1="1" y1="0" x2="1" y2="24"
                          stroke="rgba(74, 222, 128, 0.35)"
                          strokeWidth="2"
                        />
                      </svg>
                      <svg width="10" height="8" className="block -mt-px">
                        <polygon points="0,0 10,0 5,8" fill="rgba(74, 222, 128, 0.6)" />
                      </svg>
                    </div>
                    {edgeLabel && (
                      <span className="text-[10px] text-gray-400 italic">{edgeLabel}</span>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FlowChart;
