import React from 'react';
import styles from './home.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.backgroundContainer}>
        {/* Background Image */}
        <img 
          src="/homepage/2.png" 
          alt="Background landscape" 
          className={styles.backgroundImage} 
        />
        
        {/* Layer 1 - Temple */}
        <div 
          className={`${styles.targetObject} ${styles.layer1}`}
          style={{ '--mask-img': `url('/homepage/3.png')` } as React.CSSProperties}
        >
          <img src="/homepage/3.png" alt="Interactive object 1" className={styles.objectImg} />
        </div>

        {/* Layer 2 - Additional object */}
        <div 
          className={`${styles.targetObject} ${styles.layer2}`}
          style={{ '--mask-img': `url('/homepage/4.png')` } as React.CSSProperties}
        >
          <img src="/homepage/4.png" alt="Interactive object 2" className={styles.objectImg} />
        </div>
      </div>
    </div>
  );
}
