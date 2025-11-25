import { motion } from 'motion/react';

import styles from './snackbar.module.css';

interface SnackbarProps {
  message: string;
}

export function Snackbar({ message }: SnackbarProps) {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className={styles.wrapper}>
      <motion.div
        animate="show"
        className={styles.snackbar}
        exit="hidden"
        initial="hidden"
        variants={variants}
      >
        {message}
      </motion.div>
    </div>
  );
}
