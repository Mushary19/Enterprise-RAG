import type { Transition, Variants } from "framer-motion"

export const easeOut: Transition["ease"] = [0.16, 1, 0.3, 1]

export const transitionFast: Transition = { duration: 0.15, ease: easeOut }
export const transitionBase: Transition = { duration: 0.2, ease: easeOut }
export const transitionSlow: Transition = { duration: 0.3, ease: easeOut }

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
}

export const fadeSlideDown: Variants = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
}

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.04 },
  },
}
