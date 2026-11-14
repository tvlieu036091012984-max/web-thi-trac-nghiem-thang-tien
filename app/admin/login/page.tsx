'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Lock, User, ShieldCheck, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const cleanUser = username.trim().replace(/^@/, '')

    try {
      // 1. Kiểm tra tài khoản ADMIN tối cao của thầy
      if (cleanUser.toUpperCase() === 'ADMIN' && password === 'luuvanglien0410') {
        localStorage.setItem('user_role', 'ADMIN')
        localStorage.setItem('user_name', 'Thầy Trần Văn Liệu (Admin)')
        localStorage.setItem('teacher_username', 'ADMIN')
        router.push('/admin/dashboard')
        return
      }

      // 2. Tra cứu tài khoản giáo viên / trợ giảng trực tiếp từ bảng teachers trên Supabase
      const supabase = createClient()
      const { data: teacherFound, error: dbError } = await supabase
        .from('teachers')
        .select('*')
        .ilike('username', cleanUser)
        .maybeSingle()

      if (dbError) {
        console.error('Lỗi kết nối Supabase:', dbError.message)
      }

      // 3. Kiểm tra khớp đúng mật khẩu và trạng thái hoạt động
      if (teacherFound && teacherFound.password === password && teacherFound.status === 'Hoạt động') {
        const isTopAdmin =
          teacherFound.username.toLowerCase() === 'thaylieu' ||
          teacherFound.role === 'ADMIN Tối Cao'

        localStorage.setItem('user_role', isTopAdmin ? 'ADMIN' : 'GIAOVIEN')
        localStorage.setItem('user_name', teacherFound.name)
        localStorage.setItem('teacher_username', teacherFound.username)
        router.push('/admin/dashboard')
        return
      }

      setError('Tên đăng nhập hoặc mật khẩu không chính xác!')
    } catch (err) {
      console.error('Lỗi đăng nhập:', err)
      setError('Có lỗi xảy ra khi kết nối máy chủ, vui lòng thử lại!')
    } finally {
      setLoading(false)
    }
  }
return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-orange-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white/95 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white">
        
        {/* LOGO & TIÊU ĐỀ */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <GraduationCap className="text-white w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">CỔNG QUẢN TRỊ HỆ THỐNG</h1>
          <p className="text-blue-600 font-bold text-xs mt-1 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 mr-1" /> Lớp Học Thêm Thăng Tiến • Thầy Trần Văn Liệu
          </p>
        </div>

        {/* FORM ĐĂNG NHẬP */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Tên đăng nhập / Tài khoản</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Nhập tên đăng nhập được cấp..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-11 p-3.5 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none font-medium text-slate-800 bg-slate-50/50 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-400 w-5 h-5" />
              <input 
                type="password" 
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 p-3.5 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none font-medium text-slate-800 bg-slate-50/50 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3.5 rounded-xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-blue-200 active:scale-95 text-sm flex items-center justify-center disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "🔓 Đăng Nhập Hệ Thống"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-4">
          <a href="/" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition">
            ← Quay lại trang chủ học sinh
          </a>
        </div>

      </div>
    </div>
  )
}