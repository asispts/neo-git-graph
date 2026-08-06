import type { ComponentProps } from "preact";

type ButtonProps = ComponentProps<"button">;

export function Button({ class: className, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      class={[
        "inline-flex cursor-pointer items-center justify-center gap-1 select-none",
        "rounded-full border border-line bg-btn px-4 py-1 font-semibold",
        "hover:bg-btn-hover focus:outline-1",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
