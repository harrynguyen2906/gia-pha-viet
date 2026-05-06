import React from "react";
import styles from "./home/home.module.css";
import InteractiveScene from "./home/InteractiveScene";
import { getPublishedHomepageConfig } from "@/lib/homepage/get-published-homepage";
import { HomepageScene } from "@/components/homepage-scene/HomepageScene";

function StaticHomepageFallback() {
  return (
    <div className={styles.container}>
      <div className={styles.backgroundContainer}>
        <img
          src="/homepage/2.png"
          alt="Background landscape"
          className={styles.backgroundImage}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <InteractiveScene />
      </div>
    </div>
  );
}

export default async function HomePage() {
  const config = await getPublishedHomepageConfig();

  if (!config) {
    return <StaticHomepageFallback />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.backgroundContainer}>
        <HomepageScene
          backgroundUrl={config.backgroundUrl}
          backgroundWidth={config.backgroundWidth}
          backgroundHeight={config.backgroundHeight}
          layers={config.layers}
        />
      </div>
    </div>
  );
}
