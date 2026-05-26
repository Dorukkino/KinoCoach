// Simple SVG line chart
let __lcCounter = 0;
function LineChart({ data, labels, height = 200, color, fillColor, max }) {
  color = color || 'oklch(0.55 0.08 180)';
  fillColor = fillColor || 'oklch(0.7 0.08 180)';
  const gradId = React.useMemo(() => 'lcgrad-' + (++__lcCounter), []);
  const w = 720;
  const padL = 36, padR = 16, padT = 18, padB = 28;
  const dmin = Math.min(...data, 0);
  const dmax = max != null ? max : Math.max(...data) * 1.12;
  const range = dmax - dmin || 1;
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;
  const pts = data.map((v, i) => [padL + i * step, padT + innerH - ((v - dmin) / range) * innerH]);
  const linePath = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const fillPath = linePath + ` L ${padL + innerW} ${padT + innerH} L ${padL} ${padT + innerH} Z`;
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map(t => padT + t * innerH);
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(dmin + (1 - t) * range));
  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" style={{ stopColor: fillColor, stopOpacity: 0.35 }} />
          <stop offset="100%" style={{ stopColor: fillColor, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      {gridYs.map((y, i) => (
        <line key={i} x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--border)" strokeDasharray={i === gridYs.length - 1 ? '0' : '3 4'} />
      ))}
      {yLabels.map((v, i) => (
        <text key={i} x={padL - 8} y={gridYs[i] + 3.5} textAnchor="end" fontSize="10" fill="var(--muted-2)" fontFamily="var(--font-mono)">{v}</text>
      ))}
      <path d={fillPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" style={{ stroke: color }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="3.5" fill="var(--card)" style={{ stroke: color }} strokeWidth="1.6" />
        </g>
      ))}
      {labels && pts.map((p, i) => (
        <text key={i} x={p[0]} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--muted)">{labels[i]}</text>
      ))}
    </svg>
  );
}

window.LineChart = LineChart;
