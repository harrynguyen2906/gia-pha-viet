import { UserPlus, Users, CalendarCheck } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Đăng Ký Dòng Tộc",
    desc: "Tạo tài khoản và đặt tên cho dòng tộc của bạn. Bạn trở thành Trưởng Tộc với toàn quyền quản lý.",
  },
  {
    number: "02",
    icon: Users,
    title: "Thêm Thành Viên",
    desc: "Xây dựng cây phả hệ bằng cách thêm các thành viên và mối quan hệ. Nhập thông tin tiểu sử và ảnh chân dung.",
  },
  {
    number: "03",
    icon: CalendarCheck,
    title: "Kết Nối & Quản Lý",
    desc: "Theo dõi nghi lễ, phân công bổn phận và quản lý mộ phần tổ tiên cùng toàn bộ dòng tộc.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28 px-6 lg:px-24 bg-lacquer-dark border-y border-accent-gold/20">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="font-header text-3xl md:text-4xl text-white mb-6 tracking-widest">
            BẮT ĐẦU NHƯ THẾ NÀO
          </h2>
          <div className="flex justify-center items-center gap-6">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-accent-gold" />
            <span className="text-accent-gold text-xl">✦</span>
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-accent-gold" />
          </div>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div
            className="hidden lg:block absolute top-12 left-0 right-0 h-px z-0"
            style={{
              background: "linear-gradient(to right, transparent, #c5a059 20%, #c5a059 80%, transparent)",
            }}
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 relative z-10">
            {steps.map(({ number, icon: Icon, title, desc }) => (
              <div key={number} className="flex flex-col items-center text-center">
                {/* Step badge */}
                <div className="flex items-center justify-center w-24 h-24 rounded-full border-2 border-accent-gold bg-bg-dark relative mb-8">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 border border-primary/30">
                    <Icon className="w-7 h-7 text-accent-gold" aria-hidden="true" />
                  </div>
                  <span className="absolute -top-3 -right-1 bg-primary border border-accent-gold/60 text-white font-header text-[10px] tracking-widest px-2 py-0.5">
                    {number}
                  </span>
                </div>
                <h3 className="font-header text-base text-white tracking-widest mb-4">{title}</h3>
                <p className="font-sans text-parchment/60 text-sm leading-relaxed max-w-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
