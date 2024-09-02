import { Button } from "./ui/button";
import { cn } from "@/lib/utils"
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const AnimatedEllipsis = () => {
    return (
      <span className="inline-flex">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, repeat: Infinity, repeatType: "reverse", delay: 0 }}
        >
          .
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, repeat: Infinity, repeatType: "reverse", delay: 0.1 }}
        >
          .
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, repeat: Infinity, repeatType: "reverse", delay: 0.2 }}
        >
          .
        </motion.span>
      </span>
    )
  }

export const PulsingButton = ({ children, isSubmitting, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isSubmitting: boolean }) => {
    return (
      <Button
        {...props}
        disabled={isSubmitting}
        className={cn(
          props.className,
          isSubmitting && "relative overflow-hidden"
        )}
      >
        <span className={cn("flex items-center justify-center", isSubmitting && "invisible")}>
          {children}
        </span>
        {isSubmitting && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="absolute inset-0"></span>
            <span className="z-10 flex items-center justify-center animate-pulse">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {children}
              <AnimatedEllipsis />
            </span>
          </span>
        )}
      </Button>
    )
  }