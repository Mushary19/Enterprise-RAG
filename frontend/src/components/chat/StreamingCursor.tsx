import { motion } from "framer-motion"

// Isolated from the growing text node on purpose: it must animate on every
// streamed token without retriggering (or being retriggered by) the entrance
// animation on the message bubble itself.
export function StreamingCursor() {
  return (
    <motion.span
      aria-hidden="true"
      className="inline-block w-[3px] h-4 -mb-0.5 ml-0.5 bg-blue-400 align-middle rounded-sm"
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear", times: [0, 0.5, 0.5, 1] }}
    />
  )
}
