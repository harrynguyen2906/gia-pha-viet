import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer className="bg-lacquer-dark text-accent-gold/60 py-16 px-6 lg:px-24 border-t border-accent-gold/20">
      {/* Gold lotus divider */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent-gold/40" />
        <span className="text-accent-gold text-xl">✦</span>
        <span className="font-header text-sm tracking-[0.4em] text-white">HERITAGE CLOUD</span>
        <span className="text-accent-gold text-xl">✦</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent-gold/40" />
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        {/* Col 1 */}
        <div>
          <h6 className="text-white font-header text-xs tracking-widest mb-4">HỆ THỐNG</h6>
          <ul className="space-y-2 font-sans text-xs tracking-wider">
            <li><Link href="/auth/register" className="hover:text-accent-gold transition-colors">ĐĂNG KÝ</Link></li>
            <li><Link href="/auth/signin" className="hover:text-accent-gold transition-colors">ĐĂNG NHẬP</Link></li>
          </ul>
        </div>
        {/* Col 2 */}
        <div>
          <h6 className="text-white font-header text-xs tracking-widest mb-4">PHÁP LÝ</h6>
          <ul className="space-y-2 font-sans text-xs tracking-wider">
            <li><span className="cursor-default">CHÍNH SÁCH BẢO MẬT</span></li>
            <li><span className="cursor-default">ĐIỀU KHOẢN DỊCH VỤ</span></li>
          </ul>
        </div>
        {/* Col 3 */}
        <div>
          <h6 className="text-white font-header text-xs tracking-widest mb-4">VĂN HÓA</h6>
          <ul className="space-y-2 font-sans text-xs tracking-wider">
            <li><a href="#features" className="hover:text-accent-gold transition-colors">TÍNH NĂNG</a></li>
            <li><a href="#how-it-works" className="hover:text-accent-gold transition-colors">HƯỚNG DẪN</a></li>
          </ul>
        </div>
        {/* Col 4 */}
        <div>
          <h6 className="text-white font-header text-xs tracking-widest mb-4">LIÊN HỆ</h6>
          <ul className="space-y-2 font-sans text-xs tracking-wider">
            <li><span className="cursor-default">support@hercloud.vn</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-accent-gold/10 pt-8 text-center">
        <p className="font-sans text-xs tracking-widest text-accent-gold/40">
          © 2026 Heritage Cloud. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
