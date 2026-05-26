// Shared visual helpers — exposed on window so all screens share avatar colors
const AVATAR_PALETTE = [
  ['#D4B98C', '#B89968'],
  ['#A8B5A1', '#7E8E78'],
  ['#B8A4C9', '#8F7BA8'],
  ['#C9A4A0', '#A47873'],
  ['#9FB6C9', '#7392AB'],
  ['#D9C29F', '#B69E76'],
  ['#A4C9B8', '#74A892'],
  ['#C9B8A4', '#A89678'],
];
function colorFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}
function initialsOf(name) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function UserAvatar({ name, size = 36, square = false, className = '' }) {
  const [a, b] = colorFor(name);
  return (
    <div
      className={'user-av ' + className}
      style={{
        width: size, height: size,
        borderRadius: square ? Math.max(8, size * 0.22) : '50%',
        background: `linear-gradient(135deg, ${a}, ${b})`,
        color: '#fff',
        display: 'grid', placeItems: 'center',
        fontWeight: 600,
        fontSize: size * 0.36,
        flexShrink: 0,
      }}
    >{initialsOf(name)}</div>
  );
}

const STATUS_LABEL = { good: 'İyi gidiyor', warn: 'Ortalama ilerliyor', risk: 'Riskli öğrenci' };
const STATUS_SHORT = { good: 'İyi', warn: 'Orta', risk: 'Riskli' };

window.colorFor = colorFor;
window.initialsOf = initialsOf;
window.UserAvatar = UserAvatar;
window.STATUS_LABEL = STATUS_LABEL;
window.STATUS_SHORT = STATUS_SHORT;
