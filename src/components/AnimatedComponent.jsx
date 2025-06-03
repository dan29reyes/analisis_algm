import { useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

const FadeInWhenVisible = ({
  children,
  delay = 0,
  direction = null,
  className = "",
}) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  // Configuración de animación según la dirección
  let initial = { opacity: 0, y: 30 };
  if (direction === "left") initial = { opacity: 0, x: -50 };
  if (direction === "right") initial = { opacity: 0, x: 50 };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: initial,
        visible: {
          opacity: 1,
          y: 0,
          x: 0,
          transition: {
            duration: 0.7,
            ease: "easeOut",
            delay: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default FadeInWhenVisible;