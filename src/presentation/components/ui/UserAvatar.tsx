export function UserAvatar({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();

  return (
    <div
      className="rounded-full grid place-items-center font-semibold text-white shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        background:
          "linear-gradient(135deg, oklch(0.55 0.07 180), oklch(0.45 0.09 200))",
      }}
    >
      {initials}
    </div>
  );
}
