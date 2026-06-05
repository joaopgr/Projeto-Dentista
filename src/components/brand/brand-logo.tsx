import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/branding";

type BrandLogoProps = {
  variant?: "hero" | "sidebar" | "header" | "portal";
  showTagline?: boolean;
  className?: string;
};

function BrandMark({
  size = "md",
  light = false,
}: {
  size?: "sm" | "md" | "lg";
  light?: boolean;
}) {
  const sizes = {
    sm: "h-8 w-8 rounded-lg text-sm",
    md: "h-10 w-10 rounded-xl text-base",
    lg: "h-16 w-16 rounded-2xl text-2xl",
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-bold tracking-tight shadow-sm",
        sizes[size],
        light
          ? "bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm"
          : "bg-gradient-to-br from-teal-600 to-teal-800 text-white ring-1 ring-teal-700/20"
      )}
      aria-hidden
    >
      {BRAND.initials}
    </div>
  );
}

export function BrandLogo({
  variant = "header",
  showTagline = true,
  className,
}: BrandLogoProps) {
  if (variant === "hero") {
    return (
      <div className={cn("text-center", className)}>
        <div className="mx-auto mb-5 flex justify-center">
          <BrandMark size="lg" light />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {BRAND.name}
        </h1>
        {showTagline && (
          <p className="mt-2 text-sm font-medium text-teal-100/90 sm:text-base">
            {BRAND.tagline}
          </p>
        )}
      </div>
    );
  }

  const isSidebar = variant === "sidebar";

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <BrandMark
        size={variant === "header" ? "sm" : "md"}
        light={isSidebar}
      />
      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-bold leading-tight",
            isSidebar ? "text-white" : "text-slate-900",
            variant === "header" ? "text-sm" : "text-base"
          )}
        >
          {variant === "header" ? BRAND.shortName : BRAND.name}
        </p>
        {showTagline && (
          <p
            className={cn(
              "truncate text-xs",
              isSidebar ? "text-teal-200/80" : "text-slate-500",
              variant === "portal" && "text-teal-700/80"
            )}
          >
            {variant === "portal" ? "Área do paciente" : BRAND.tagline}
          </p>
        )}
      </div>
    </div>
  );
}
