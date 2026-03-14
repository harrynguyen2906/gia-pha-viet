import React from 'react';
import Link from 'next/link';
import styles from './home/home.module.css';

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

        {/* Layer 1 - Nha */}
        <Link
          href="/giapha"
          className={`${styles.targetObject} ${styles.layer1}`}
          data-tooltip="Gia pha ho toc - Landing page"
          aria-label="Go to gia pha ho toc landing page"
          style={{ '--mask-img': `url('/homepage/3.png')` } as React.CSSProperties}
        >
          <img src="/homepage/3.png" alt="Nha - Gia pha ho toc" className={styles.objectImg} />
        </Link>

        {/* Layer 2 - Chua */}
        <a
          href="https://viengchua.io.vn"
          className={`${styles.targetObject} ${styles.layer2}`}
          data-tooltip="Pagoda Online - viengchua.io.vn"
          aria-label="Open Pagoda Online at viengchua.io.vn"
          style={{ '--mask-img': `url('/homepage/4.png')` } as React.CSSProperties}
        >
          <img src="/homepage/4.png" alt="Chua - Pagoda Online" className={styles.objectImg} />
        </a>
      </div>
    </div>
  );
}
