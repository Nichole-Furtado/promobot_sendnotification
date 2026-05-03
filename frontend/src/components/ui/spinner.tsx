import { cn } from "@/lib/utils";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizes = { sm: "h-4 w-4 border-2", md: "h-5 w-5 border-2", lg: "h-8 w-8 border-[3px]" };
  return (
    <span
      className={cn(
        "inline-block rounded-full border-primary border-t-transparent animate-spin",
        sizes[size],
        className
      )}
      aria-label="Carregando"
    />
  );
}
