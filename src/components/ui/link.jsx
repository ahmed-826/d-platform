import * as React from "react";
import { cn } from "@/lib/utils";

const Link = React.forwardRef(
  ({ className, href, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          "transition-colors hover:text-blue-700 text-blue-600",
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  }
);

Link.displayName = "Link";

export { Link };
