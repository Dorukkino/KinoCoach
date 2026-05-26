// Mini sparkline used in stat cards
let __spCounter = 0;
const Sparkline = ({ data, color, fill }) => {
  const gradId = React.useMemo(() => 'sp-' + (++__spCounter), []);
  const w = 110, h = 36, pad = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = (w - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => [pad + i * step, h - pad - ((v - min) / range) * (h - pad * 2)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const fillD = d + ` L ${w - pad} ${h} L ${pad} ${h} Z`;
  return (
    <svg className="stat-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.5 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${gradId})`} />
      <path d={d} fill="none" style={{ stroke: color }} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const StatCard = ({ label, value, unit, delta, deltaDir, sub, icon: Icon, tone, spark, sparkColor, sparkFill }) => (
  <div className="stat-card">
    <div className="stat-head">
      <span className="stat-label">{label}</span>
      <div className={'stat-ico ' + tone}><Icon width="16" height="16" /></div>
    </div>
    <div className="stat-value">
      {value}{unit && <span className="unit">{unit}</span>}
    </div>
    <div className="stat-foot">
      <span className={'delta ' + deltaDir}>
        {deltaDir === 'up' && <Ic.Trend width="11" height="11" />}
        {deltaDir === 'down' && <Ic.TrendDown width="11" height="11" />}
        {delta}
      </span>
      <span className="stat-sub">{sub}</span>
    </div>
    <Sparkline data={spark} color={sparkColor} fill={sparkFill} />
  </div>
);

const StatsRow = () => {
  const cards = [
    {
      label: 'Toplam Öğrenci', value: 24, unit: null,
      delta: '+3', deltaDir: 'up', sub: 'son 30 günde',
      icon: Ic.Students, tone: 'teal',
      spark: [10, 12, 11, 14, 16, 15, 18, 20, 22, 21, 23, 24],
      sparkColor: 'oklch(0.55 0.07 180)', sparkFill: 'oklch(0.7 0.08 180)',
    },
    {
      label: 'Görev Tamamlama', value: 78, unit: '%',
      delta: '+4.2%', deltaDir: 'up', sub: 'geçen haftaya göre',
      icon: Ic.Check, tone: 'green',
      spark: [62, 68, 65, 70, 72, 71, 74, 73, 76, 75, 77, 78],
      sparkColor: 'oklch(0.55 0.1 150)', sparkFill: 'oklch(0.7 0.1 150)',
    },
    {
      label: 'Bekleyen Mesaj', value: 12, unit: null,
      delta: '−3', deltaDir: 'down', sub: 'bugün gelen',
      icon: Ic.Chat, tone: 'amber',
      spark: [4, 6, 5, 9, 11, 8, 14, 12, 16, 13, 15, 12],
      sparkColor: 'oklch(0.62 0.12 65)', sparkFill: 'oklch(0.78 0.12 80)',
    },
    {
      label: 'Bu Hafta Net Giren', value: 18, unit: '/ 24',
      delta: '75%', deltaDir: 'flat', sub: 'katılım oranı',
      icon: Ic.Trial, tone: 'rose',
      spark: [8, 11, 10, 13, 12, 14, 15, 13, 16, 17, 16, 18],
      sparkColor: 'oklch(0.6 0.14 25)', sparkFill: 'oklch(0.75 0.14 25)',
    },
  ];
  return (
    <div className="stats">
      {cards.map((c, i) => <StatCard key={i} {...c} />)}
    </div>
  );
};

window.StatsRow = StatsRow;
