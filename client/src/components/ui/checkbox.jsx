// client/src/components/ui/checkbox.jsx
import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const Checkbox = React.forwardRef(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleClick = () => {
      if (onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "h-4 w-4 rounded-sm border border-gray-500 flex items-center justify-center cursor-pointer",
          checked ? "bg-blue-500 border-blue-500" : "bg-transparent",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
