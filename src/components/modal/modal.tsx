import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IoClose } from 'react-icons/io5';
import { FocusTrap } from 'focus-trap-react';

import { Portal } from '@/components/portal';

import styles from './modal.module.css';

interface ModalProps {
  children: React.ReactNode;
  lockBody?: boolean;
  onClose: () => void;
  show: boolean;
}

export function Modal({
  children,
  lockBody = true,
  onClose,
  show,
}: ModalProps) {
  const variants = {
    modal: {
      hidden: {
        opacity: 0,
        y: 20,
      },
      show: {
        opacity: 1,
        y: 0,
      },
    },
    overlay: {
      hidden: { opacity: 1 },
      show: { opacity: 1 },
    },
  };

  useEffect(() => {
    if (show && lockBody) {
      document.body.style.overflow = 'hidden';
    } else if (lockBody) {
      document.body.style.overflow = 'auto';
    }
  }, [show, lockBody]);

  useEffect(() => {
    function keyListener(e: KeyboardEvent) {
      if (show && e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', keyListener);

    return () => document.removeEventListener('keydown', keyListener);
  }, [onClose, show]);

  return (
    <Portal>
      <AnimatePresence>
        {show && (
          <FocusTrap>
            <div>
              <motion.div
                animate="show"
                className={styles.overlay}
                exit="hidden"
                initial="hidden"
                variants={variants.overlay}
                onClick={onClose}
                onKeyDown={onClose}
              />
              <div className={styles.modal}>
                <motion.div
                  animate="show"
                  className={styles.content}
                  exit="hidden"
                  initial="hidden"
                  variants={variants.modal}
                >
                  <button className={styles.close} onClick={onClose}>
                    <IoClose />
                  </button>
                  {children}
                </motion.div>
              </div>
            </div>
          </FocusTrap>
        )}
      </AnimatePresence>
    </Portal>
  );
}
