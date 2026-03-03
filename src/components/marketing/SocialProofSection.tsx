"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { label: "Dòng Tộc", value: 120, suffix: "+" },
  { label: "Thành Viên", value: 8500, suffix: "+" },
  { label: "Nghi Lễ Lưu Trữ", value: 3200, suffix: "+" },
];

const testimonials = [
  {
    quote:
      "Cuối cùng đã có một hệ thống đối xử với lịch sử gia tộc của chúng tôi với sự tôn kính xứng đáng. Tính năng lập bản đồ gia phả thật tuyệt vời.",
    author: "— CỤ NGUYỄN, HUẾ",
  },
  {
    quote:
      "Bảng quản lý bổn phận đã thay đổi cách dòng tộc chúng tôi duy trì các nghi lễ thờ cúng tại đình làng tổ tiên.",
    author: "— TS. PHẠM, SYDNEY",
  },
  {
    quote:
      "Việc tìm lại mộ tổ tiên ở quê nhà trở nên dễ dàng hơn bao giờ hết. Một cây cầu vượt thời gian.",
    author: "— CÔ TRẦN, CALIFORNIA",
  },
];

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500;
          const step = Math.ceil(target / (duration / 16));
          let current = 0;
          const timer = setInterval(() => {
            current = Math.min(current + step, target);
            setCount(current);
            if (current >= target) clearInterval(timer);
          }, 16);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString("vi-VN")}
      {suffix}
    </span>
  );
}

export default function SocialProofSection() {
  return (
    <section id="testimonials" className="py-28 px-6 lg:px-24 bg-bg-dark">
      <div className="max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {stats.map(({ label, value, suffix }) => (
            <div
              key={label}
              className="text-center border border-accent-gold/20 bg-panel-dark p-10"
            >
              <div className="font-header text-5xl text-accent-gold mb-3">
                <Counter target={value} suffix={suffix} />
              </div>
              <p className="font-sans text-xs tracking-widest text-parchment/50 uppercase">{label}</p>
            </div>
          ))}
        </div>

        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-header text-3xl text-white mb-4 tracking-widest">CẢM NHẬN NGƯỜI DÙNG</h2>
          <div className="flex justify-center items-center gap-6">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-accent-gold" />
            <span className="text-accent-gold">✦</span>
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-accent-gold" />
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map(({ quote, author }) => (
            <div
              key={author}
              className="relative p-8 border-t-4 border-accent-gold bg-panel-dark"
              style={{ background: "linear-gradient(145deg, #2c2c2c, #1a1a1a)" }}
            >
              <span className="text-accent-gold/20 text-6xl font-serif leading-none absolute top-4 left-4" aria-hidden="true">
                "
              </span>
              <p className="font-serif text-slate-300 italic text-sm leading-relaxed mb-6 relative z-10">
                "{quote}"
              </p>
              <p className="font-header text-accent-gold tracking-widest text-xs">{author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
