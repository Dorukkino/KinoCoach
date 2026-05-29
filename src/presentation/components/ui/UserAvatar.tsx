export function UserAvatar({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  const avatarTones = [
    "linear-gradient(135deg, #c8b28a, #a88f63)",
    "linear-gradient(135deg, #aab6a2, #7f9275)",
    "linear-gradient(135deg, #b9c6cf, #849ba9)",
    "linear-gradient(135deg, #d5b68d, #ba8c58)",
    "linear-gradient(135deg, #c9b0a0, #a97864)",
  ];
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  const toneIndex = Array.from(name).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  ) % avatarTones.length;

  return (
    <div
      className="rounded-full grid place-items-center font-semibold text-white shrink-0 user-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        background: avatarTones[toneIndex],
      }}
    >
      {initials}
    </div>
  );
}
