import { AnimatePresence, motion } from "framer-motion";

interface AnimatedErrorMessageProps {
    message?: string;
  }
  
export const AnimatedErrorMessage: React.FC<AnimatedErrorMessageProps> = ({ message }) => {
    return (
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-red-500"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };