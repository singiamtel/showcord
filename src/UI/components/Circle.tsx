import { motion, AnimatePresence } from 'framer-motion';

// Circle around text, used for notification bubbles
export default function Circle({ children, className }: Readonly<{ children: any, className?: string }>) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={String(children)}
                className={'relative w-4 h-4 bg-red-400 rounded-full flex justify-center items-center text-center p-2 shadow-xl ' + className}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                    scale: [0, 1.3, 1],
                    opacity: 1,
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 15,
                    duration: 0.3,
                }}
            >
                <motion.span
                    className="absolute text-xs text-purple-800"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    {children}
                </motion.span>
            </motion.div>
        </AnimatePresence>
    );
}
