"use client";

import { useState } from "react";
import useSWR from "swr";
import { Loader2, Plus, Shield, UserX, UserCheck, AlertCircle, X } from "lucide-react";
import { useModal } from "@/hooks/useModal";

export default function AdminUsersList() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/admin-users");
  const { isOpen: addingUser, open: openAddUser, close: closeAddUser } = useModal();
  
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("SUPPORT");
  const [newPassword, setNewPassword] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [creating, setCreating] = useState(false);

  // This check avoids rendering actions if the user is not a super admin
  // (In reality, the backend protects it, and the component should dynamically check the session)
  // For demonstration, since we lack an active useSession hook, we'll enable the UI, but failing will show actionMessage.

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setActionMessage("");

    try {
      const res = await fetch("/api/admin/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          displayName: newName,
          role: newRole,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setActionMessage(`Lỗi: ${json.error || "Không thể cấp quyền quản trị"}`);
      } else {
        setActionMessage("Đã cấp quyền quản trị thành công!");
        closeAddUser();
        setNewEmail("");
        setNewPassword("");
        setNewName("");
        setNewRole("SUPPORT");
        mutate();
      }
    } catch (err) {
      setActionMessage("Lỗi kết nối mạng.");
    } finally {
      setCreating(false);
      setTimeout(() => setActionMessage(""), 4000);
    }
  };

  const handleDeactivate = async (id: string, currentlyActive: boolean) => {
    if (!confirm(`Bạn có chắc chắn muốn ${currentlyActive ? 'thu hồi' : 'cấp lại'} quyền quản trị của thành viên này?`)) return;
    
    setActionMessage("");
    try {
      const res = await fetch(`/api/admin/admin-users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentlyActive }),
      });
      if (res.ok) {
        mutate();
      } else {
        const json = await res.json();
        setActionMessage(`Lỗi: ${json.error}`);
      }
    } catch (err) {
      setActionMessage("Lỗi kết nối mạng.");
    }
  };

  if (isLoading) return <div className="text-secondary flex gap-2 items-center"><Loader2 className="animate-spin w-5 h-5"/> Đang tải danh sách Admin...</div>;
  if (error || data?.error) return <div className="text-error">Không thể tải cấu hình Admin.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/30 pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold font-['Noto_Serif'] text-primary flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-secondary" />
            Hệ Thống Phân Quyền
          </h2>
          <p className="text-on-surface-variant text-sm">Quản lý tài khoản Ban Quản Trị Hệ Thống.</p>
        </div>
        <button
          onClick={openAddUser}
          className="bg-primary hover:bg-primary/90 text-primary-content hover:shadow-[0_0_15px_rgba(233,193,118,0.4)] transition-all px-5 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4"/> Thêm Quản Trị Viên
        </button>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-sm flex items-center gap-3 imperial-border ${actionMessage.includes("Lỗi:") ? "bg-error-container/20 text-error" : "bg-secondary-container/20 text-secondary"}`}>
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{actionMessage}</p>
        </div>
      )}

      {addingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant/30 p-8 rounded-sm shadow-[0_20px_50px_rgba(27,9,9,0.8)] w-full max-w-2xl animate-in zoom-in-95 duration-300 relative">
            <button 
              onClick={closeAddUser}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-secondary p-2 bg-surface-container-low rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold font-['Noto_Serif'] text-secondary mb-6 border-b border-outline-variant/30 pb-4">Tạo Phân Quyền Mới</h3>
            
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant block">Hộp Thư (Email)</label>
                <input type="email" required value={newEmail} onChange={e=>setNewEmail(e.target.value)} className="w-full p-3 bg-surface-container-lowest border-b-2 border-outline-variant focus:border-secondary text-secondary transition-colors outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface-variant block">Ngự Danh (Full Name)</label>
                  <input type="text" value={newName} onChange={e=>setNewName(e.target.value)} className="w-full p-3 bg-surface-container-lowest border-b-2 border-outline-variant focus:border-secondary text-secondary transition-colors outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface-variant block">Mật Khẩu Ban Đầu</label>
                  <input type="password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full p-3 bg-surface-container-lowest border-b-2 border-outline-variant focus:border-secondary text-secondary transition-colors outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant block">Ban Phân Quyền</label>
                <select value={newRole} onChange={e=>setNewRole(e.target.value)} className="w-full p-3 bg-surface-container-lowest border-b-2 border-outline-variant focus:border-secondary text-secondary transition-colors outline-none">
                  <option value="SUPPORT">Tùy Tùng Hỗ Trợ (Tier 1 Support)</option>
                  <option value="MODERATOR">Quan Kiểm Duyệt (Content Moderator)</option>
                  <option value="SUPER_ADMIN">Tổng Quản Hệ Thống (Super Admin)</option>
                </select>
              </div>
              
              <div className="pt-6 flex justify-end gap-4 border-t border-outline-variant/30">
                <button 
                  type="button"
                  onClick={closeAddUser}
                  className="px-6 py-2.5 text-on-surface-variant font-semibold hover:text-secondary transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button disabled={creating} className="bg-primary hover:bg-primary/90 text-primary-content hover:shadow-[0_0_15px_rgba(233,193,118,0.4)] px-8 py-2.5 rounded-full font-semibold transition-all disabled:opacity-50 flex items-center gap-2">
                  {creating ? <Loader2 className="w-5 h-5 animate-spin"/> : <Shield className="w-5 h-5"/>}
                  Cấp Ấn Chỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-surface-container-low imperial-border rounded-sm mt-8 shadow-2xl">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-container-high border-b border-outline-variant/30 text-on-surface-variant uppercase text-xs tracking-widest font-['Noto_Serif']">
              <th className="px-6 py-5 font-bold">Thành Viên</th>
              <th className="px-6 py-5 font-bold">Chức Vụ</th>
              <th className="px-6 py-5 font-bold text-center">Trạng Thái</th>
              <th className="px-6 py-5 font-bold text-center">Ngày Lập</th>
              <th className="px-6 py-5 font-bold text-right">Mệnh Lệnh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {!data || data.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant font-['Noto_Serif'] italic">Chưa có quản trị viên nào trong hệ thống.</td></tr>
            ) : (
              data.map((user: any) => (
                <tr key={user.id} className="hover:bg-surface-container-high/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary uppercase font-['Spectral_SC'] text-lg border border-secondary/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
                        {user.displayName?.[0] || user.email[0]}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface font-['Noto_Serif'] leading-tight">{user.displayName || "Unknown Name"}</p>
                        <p className="text-xs text-on-surface-variant mt-1">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex px-3 py-1 border font-['Noto_Serif'] text-xs font-bold uppercase tracking-wider
                      ${user.role === 'SUPER_ADMIN' ? 'bg-primary-container/20 text-primary border-primary/30' : 
                        user.role === 'SUPPORT' ? 'bg-secondary-container/20 text-secondary border-secondary/30' : 
                        'bg-outline/20 text-on-surface-variant border-outline/30'}`}>
                      {user.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.isActive ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-error-container/20 text-error border border-error/20'}`}>
                      {user.isActive ? "Hoạt Động" : "Ẩn Khóa"}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm text-on-surface-variant font-medium">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => handleDeactivate(user.id, user.isActive)}
                      className={`p-2 rounded-full transition-all inline-flex items-center justify-center ${
                        user.isActive 
                        ? 'text-error hover:bg-error-container/50 hover:shadow-[0_0_10px_rgba(255,180,171,0.2)]' 
                        : 'text-secondary hover:bg-secondary-container/50 hover:shadow-[0_0_10px_rgba(233,193,118,0.2)]'
                      }`}
                      title={user.isActive ? "Thu Hồi Mệnh Lệnh" : "Cấp Lại Bấm Phù"}
                    >
                      {user.isActive ? <UserX className="w-5 h-5"/> : <UserCheck className="w-5 h-5"/>}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
