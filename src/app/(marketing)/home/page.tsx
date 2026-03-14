import React from 'react';
import Image from 'next/image';
import styles from './home.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        {/* Background Image */}
        <div className={styles.imageWrapper}>
          <Image
            src="/homepage/4.png"
            alt="Background landscape"
            fill
            sizes="100vw"
            className={styles.backgroundImage}
            priority
          />
        </div>
        
        {/* Layer 1 - Temple */}
        <div className={`${styles.layer} ${styles.layer1}`}>
          <Image
            src="/homepage/3.png"
            alt="Temple structure"
            width={600}
            height={400}
            className={styles.interactiveImage}
            priority
          />
        </div>

        {/* Layer 2 - House with tree */}
        <div className={`${styles.layer} ${styles.layer2}`}>
          <Image
            src="/homepage/2.png"
            alt="Traditional house with tree"
            width={800}
            height={600}
            className={styles.interactiveImage}
            priority
          />
        </div>
      </div>
    </div>
  );
}
