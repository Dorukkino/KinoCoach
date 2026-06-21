import type { ImgHTMLAttributes } from "react";

export function BrandMark({
  className = "",
  size = 32,
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  size?: number;
}) {
  return (
    // Transparent PNG must not go through next/image optimization.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      className={`brand-mark${className ? ` ${className}` : ""}`}
      aria-hidden
      {...props}
    />
  );
}
