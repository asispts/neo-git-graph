import type { ComponentChildren, SVGAttributes } from "preact";

type IconProps = Omit<SVGAttributes<SVGSVGElement>, "children">;

export function Icon({ children, ...props }: IconProps & { children: ComponentChildren }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}
