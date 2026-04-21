import React from 'react';
import styles from './home/home.module.css';
import InteractiveScene from './home/InteractiveScene';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.backgroundContainer}>
        {/* Background Image */}
        <img
          src="/homepage/2.png"
          alt="Background landscape"
          className={styles.backgroundImage}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />

        {/* Interactive layers with alpha hit-testing */}
        <InteractiveScene />
      </div>
    </div>
  );
}
