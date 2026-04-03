import {
  GitBranch,
  UserCircle,
  MapPin,
  CalendarHeart,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "Gia Phả Số",
    desc: "Trực quan hóa cây phả hệ toàn gia tộc với biểu đồ mạng lưới thần kinh tương tác. Dễ dàng duyệt qua nhiều thế hệ.",
  },
  {
    icon: UserCircle,
    title: "Hồ Sơ Kỹ Thuật Số",
    desc: "Hồ sơ chi tiết cho từng thành viên — người đang sống và người đã mất — với ảnh, tiểu sử và ngày tháng quan trọng.",
  },
  {
    icon: MapPin,
    title: "Bản Đồ Tổ Tiên",
    desc: "Theo dõi và thăm viếng mộ phần tổ tiên trên bản đồ tương tác. Ghi lại vị trí GPS và trạng thái mộ phần.",
  },
  {
    icon: CalendarHeart,
    title: "Lịch Giỗ Chạp",
    desc: "Không bỏ lỡ ngày giỗ quan trọng với tích hợp lịch âm. Nhắc nhở tự động cho toàn bộ thành viên dòng tộc.",
  },
  {
    icon: ClipboardList,
    title: "Quản Lý Bổn Phận",
    desc: "Phân công và theo dõi trách nhiệm gia tộc với bảng Kanban. Ghi nhận công đóng góp của từng thành viên.",
  },
  {
    icon: ShieldCheck,
    title: "An Toàn & Bảo Mật",
    desc: "Dữ liệu gia đình được mã hóa và cách ly hoàn toàn theo từng dòng tộc. Chỉ thành viên được phép mới có quyền truy cập.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-28 px-6 lg:px-24 bg-bg-dark">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="font-header text-3xl md:text-4xl text-white mb-6 tracking-widest">
            TÍNH NĂNG NỔI BẬT
          </h2>
          <div className="flex justify-center items-center gap-6">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-accent-gold" />
            <span className="text-accent-gold text-xl">✦</span>
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-accent-gold" />
          </div>
          <p className="font-sans text-parchment/60 max-w-2xl mx-auto mt-6 text-sm leading-relaxed">
            Đầy đủ công cụ để bảo tồn di sản và kết nối các thế hệ trong gia tộc Việt Nam.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="group relative p-8 border border-accent-gold/15 bg-panel-dark hover:border-accent-gold/40 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Corner accents */}
              <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-accent-gold/40 group-hover:border-accent-gold transition-colors" aria-hidden="true" />
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-accent-gold/40 group-hover:border-accent-gold transition-colors" aria-hidden="true" />

              <div className="flex items-center justify-center w-12 h-12 rounded-sm bg-primary/20 border border-primary/30 mb-6">
                <Icon className="w-6 h-6 text-accent-gold" aria-hidden="true" />
              </div>

              <h3 className="font-header text-lg text-white tracking-widest mb-3">{title}</h3>
              <p className="font-sans text-parchment/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
