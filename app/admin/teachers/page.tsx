'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Shield, Trash2, ArrowLeft, CheckCircle2, User, Lock, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('Giáo viên bộ môn')
  const [newPhone, setNewPhone] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const supabase = createClient()

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('id', { ascending: true })

    if (!error && data) {
      setTeachers(data)
    } else {
      console.error('Lỗi tải danh sách giáo viên:', error?.message)
    }
    setIsLoaded(true)
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!')
      return
    }

    const cleanUsername = newUsername.trim().replace(/^@/, '').toLowerCase()

    if (cleanUsername === 'admin' || teachers.some((t: any) => t.username.toLowerCase() === cleanUsername)) {
      alert(`⚠️ Tên đăng nhập "@${cleanUsername}" đã tồn tại trong hệ thống. Vui lòng chọn tên khác!`)
      return
    }

    setIsSaving(true)
    const { error } = await supabase.from('teachers').insert([
      {
        name: newName.trim(),
        username: cleanUsername,
        password: newPassword.trim(),
        role: newRole,
        phone: newPhone.trim() || 'Chưa cập nhật',
        status: 'Hoạt động'
      }
    ])
    setIsSaving(false)

    if (error) {
      alert('❌ Lỗi lưu tài khoản lên hệ thống: ' + error.message)
      return
    }

    await fetchTeachers()
    setSuccessMsg(`Đã cấp tài khoản thành công cho: ${newName.trim()} (@${cleanUsername})!`)
    setShowModal(false)
    setNewName('')
    setNewUsername('')
    setNewPassword('')
    setNewPhone('')
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const handleDeleteTeacher = async (id: number, name: string, username: string) => {
    if (username.toLowerCase() === 'thaylieu') {
      alert('⚠️ Không thể xóa tài khoản ADMIN tối cao!')
      return
    }

    if (confirm(`Thầy có chắc chắn muốn xóa vĩnh viễn tài khoản của "${name}" không?`)) {
      const { error } = await supabase.from('teachers').delete().eq('id', id)
      if (error) {
        alert('❌ Lỗi khi xóa tài khoản: ' + error.message)
        return
      }
      setTeachers((prev) => prev.filter((t) => t.id !== id))
    }
  }
return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 font-sans pb-20">
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/admin/dashboard" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-800 flex items-center">
                <Shield className="w-5 h-5 text-indigo-600 mr-2" /> Quản Lý Tài Khoản Giáo Viên & Trợ Giảng
              </h1>
              <p className="text-xs text-slate-500 font-medium">Hệ thống Lớp Học Thêm Thăng Tiến • Quản trị viên: Thầy Trần Văn Liệu</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center shadow-md shadow-blue-200 active:scale-95 transition"
          >
            <UserPlus size={16} className="mr-1.5" /> Cấp Tài Khoản Mới
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 mt-4">
        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center text-emerald-800 text-sm font-bold shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center">
              <Sparkles className="w-4 h-4 text-orange-500 mr-2" /> Danh Sách Tài Khoản Đang Hoạt Động ({teachers.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-500 uppercase">
                  <th className="p-4 pl-6">Họ và tên giáo viên</th>
                  <th className="p-4">Tên đăng nhập</th>
                  <th className="p-4">Chức vụ / Phân quyền</th>
                  <th className="p-4">Số điện thoại</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-center pr-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {!isLoaded ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs font-bold text-slate-400">
                      Đang tải danh sách tài khoản...
                    </td>
                  </tr>
                ) : teachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs font-bold text-slate-400">
                      Chưa có tài khoản giáo viên nào trong hệ thống.
                    </td>
                  </tr>
                ) : (
                  teachers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 pl-6 font-bold text-slate-800">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3 text-xs flex-shrink-0">
                            {t.name ? t.name.charAt(0) : 'G'}
                          </div>
                          <span>{t.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs font-semibold">
                        <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-100 inline-block">
                          @{t.username}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{t.role}</td>
                      <td className="p-4 font-medium text-slate-600">{t.phone}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 inline-block">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 text-center pr-6">
                        {t.username.toLowerCase() !== 'thaylieu' && (
                          <button
                            onClick={() => handleDeleteTeacher(t.id, t.name, t.username)}
                            className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition"
                            title="Xóa tài khoản"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-800 flex items-center">
                  <UserPlus className="w-5 h-5 text-blue-600 mr-2" /> Cấp Tài Khoản Mới Cho Giáo Viên
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
              </div>

              <form onSubmit={handleAddTeacher} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Họ và tên giáo viên / trợ giảng:</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Thầy Dương Đạt..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-semibold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tên đăng nhập (Username):</label>
                  <input
                    type="text"
                    required
                    placeholder="gv_dat"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-semibold text-slate-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mật khẩu khởi tạo:</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Nhập mật khẩu cấp cho giáo viên..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-semibold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Chức vụ / Phân quyền:</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-semibold text-slate-800 bg-white outline-none"
                  >
                    <option value="Giáo viên bộ môn">Giáo viên bộ môn</option>
                    <option value="Trợ giảng / Hỗ trợ">Trợ giảng / Hỗ trợ</option>
                    <option value="Quản trị viên phụ">Quản trị viên phụ (Co-Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại:</label>
                  <input
                    type="text"
                    placeholder="0901234567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-semibold text-slate-800 outline-none"
                  />
                </div>

                <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={isSaving}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition text-sm"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-sm shadow-md shadow-blue-200 flex items-center justify-center"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận cấp tài khoản'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}