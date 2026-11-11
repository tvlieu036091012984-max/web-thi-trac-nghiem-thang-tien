'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { LayoutList, Copy, Check, Users, Calendar, Loader2, Trash2, GraduationCap, ShieldCheck, RefreshCw, Upload, Home, ShieldPlus, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [exams, setExams] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>('')
  const [activeTab, setActiveTab] = useState<'exams' | 'submissions'>('exams')
  
  // --- STATE PHÂN QUYỀN ---
  const [userRole, setUserRole] = useState<string>('')
  const [teacherUsername, setTeacherUsername] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('user_role')
    const tUser = localStorage.getItem('teacher_username') || 'ADMIN'
    
    if (!role) {
      router.push('/admin/login')
      return
    }
    setUserRole(role)
    setTeacherUsername(tUser)
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      
      const { data: examData } = await supabase.from('exams').select('*').order('created_at', { ascending: false })
      if (examData) setExams(examData)

      const { data: subData } = await supabase.from('submissions').select('*, exams(title)').order('created_at', { ascending: false })
      if (subData) setSubmissions(subData)

      setLoading(false)
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err)
      setLoading(false)
    }
  }

  const handleCopyLink = (examId: string) => {
    const link = `${window.location.origin}/exam/${examId}`
    navigator.clipboard.writeText(link)
    setCopiedId(examId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDeleteExam = async (examId: string) => {
    // CHẶN BẢO MẬT TUYỆT ĐỐI: CHỈ ADMIN MỚI ĐƯỢC XÓA ĐỀ THI
    if (userRole !== 'ADMIN') {
      alert("⚠️ Bạn là giáo viên, không có quyền xóa đề thi trên hệ thống!")
      return
    }

    if (!confirm("Thầy có chắc chắn muốn xóa đề thi này không?")) return
    try {
      const supabase = createClient()
      await supabase.from('questions').delete().eq('exam_id', examId)
      await supabase.from('exams').delete().eq('id', examId)
      setExams(exams.filter(e => e.id !== examId))
    } catch (err) {
      alert("Lỗi khi xóa đề thi!")
    }
  }

  const exportToCSV = () => {
    if (submissions.length === 0) {
      alert("Chưa có dữ liệu điểm số để xuất file!")
      return
    }

    let csvContent = "\uFEFFSTT,Học Sinh,Tên Đề Thi,Điểm Số,Thời Gian Nộp\n"
    
    submissions.forEach((sub, index) => {
      const studentName = `"${sub.student_name || ''}"`
      const examTitle = `"${sub.exams?.title || 'Đề kiểm tra KHTN'}"`
      const score = sub.score !== undefined ? sub.score : 0
      const time = `"${new Date(sub.created_at).toLocaleString('vi-VN')}"`
      
      csvContent += `${index + 1},${studentName},${examTitle},${score},${time}\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Bang_Diem_Lop_Hoc_Thang_Tien_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleResetNewSchoolYear = async () => {
    if (userRole !== 'ADMIN') {
      alert("⚠️ Tính năng này chỉ dành cho tài khoản ADMIN tối cao!")
      return
    }

    const confirmText = prompt("⚠️ CẢNH BÁO: Thao tác này sẽ XÓA SẠCH toàn bộ đề thi, câu hỏi và điểm số học sinh trên hệ thống!\n\nĐể xác nhận, thầy vui lòng gõ chính xác chữ: RESET NAM HOC")
    
    if (confirmText !== "RESET NAM HOC") {
      alert("Đã hủy thao tác reset.")
      return
    }

    try {
      const supabase = createClient()
      
      const { error: errSub } = await supabase.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (errSub) throw new Error("Lỗi khi xóa submissions: " + errSub.message)

      const { error: errQ } = await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (errQ) throw new Error("Lỗi khi xóa questions: " + errQ.message)

      const { error: errExam } = await supabase.from('exams').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (errExam) throw new Error("Lỗi khi xóa exams: " + errExam.message)

      alert("🎉 Đã reset hệ thống thành công! Toàn bộ dữ liệu cũ đã được làm sạch cho năm học mới.")
      window.location.reload()
    } catch (err: any) {
      alert("Lỗi khi reset hệ thống: " + err.message)
    }
  }
if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-orange-50 flex flex-col justify-between font-sans relative overflow-hidden">
      
      {/* Các đốm màu trang trí nền lung linh */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl pointer-events-none"></div>

      <div className="p-6 md:p-10 max-w-6xl mx-auto w-full relative z-10">
        
        {/* THANH HEADER TIÊU ĐỀ & PHÂN QUYỀN */}
        <div className="bg-white/85 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-xl shadow-indigo-100/50 border border-white/80 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-200">
              <GraduationCap className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">
                LỚP HỌC THĂNG TIẾN <Sparkles className="w-5 h-5 ml-2 text-amber-500 animate-pulse" />
              </h1>
              <p className="text-indigo-600 font-bold text-sm mt-0.5 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-500" /> {userRole === 'ADMIN' ? 'Quản trị viên: ADMIN Tối Cao' : `Giáo viên: ${teacherUsername}`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/upload"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-md shadow-blue-200 transition flex items-center space-x-1.5 active:scale-95"
            >
              <Upload className="w-4 h-4" /> <span>Tải Đề Lên</span>
            </Link>

            {/* CHỈ ADMIN MỚI THẤY NÚT QUẢN LÝ GIÁO VIÊN */}
            {userRole === 'ADMIN' && (
              <Link
                href="/admin/teachers"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-md shadow-indigo-200 transition flex items-center space-x-1.5 active:scale-95"
                title="Cấp tài khoản và quản lý giáo viên"
              >
                <ShieldPlus className="w-4 h-4" /> <span>Quản Lý Giáo Viên</span>
              </Link>
            )}

            <Link
              href="/"
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-4 py-3 rounded-2xl shadow-sm transition flex items-center space-x-1.5 active:scale-95"
            >
              <Home className="w-4 h-4 text-slate-500" /> <span>Trang Chủ</span>
            </Link>

            {userRole === 'ADMIN' && (
              <button
                onClick={handleResetNewSchoolYear}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-md shadow-rose-200 transition flex items-center space-x-1.5 active:scale-95"
                title="Xóa sạch dữ liệu cũ để chuẩn bị cho năm học mới"
              >
                <RefreshCw className="w-4 h-4 mr-1 animate-spin-slow" /> <span>Reset Năm Học</span>
              </button>
            )}

            {/* ĐĂNG XUẤT AN TOÀN: CHỈ XÓA PHIÊN ĐĂNG NHẬP, GIỮ NGUYÊN DANH SÁCH GIÁO VIÊN */}
            <button
              onClick={() => { 
                localStorage.removeItem('user_role'); 
                localStorage.removeItem('user_name'); 
                localStorage.removeItem('teacher_username'); 
                router.push('/admin/login'); 
              }}
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-md transition active:scale-95"
            >
              🚪 Đăng Xuất
            </button>

            <div className="flex bg-slate-200/70 p-1.5 rounded-2xl ml-2">
              <button 
                onClick={() => setActiveTab('exams')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'exams' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Danh Sách Đề ({exams.length})
              </button>
              <button 
                onClick={() => setActiveTab('submissions')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'submissions' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Kết Quả ({submissions.length})
              </button>
            </div>
          </div>
        </div>
{/* TAB 1: DANH SÁCH ĐỀ THI */}
        {activeTab === 'exams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exams.map((exam) => {
              // BẢO MẬT TUYỆT ĐỐI: CHỈ TÀI KHOẢN ADMIN MỚI ĐƯỢC PHÉP XÓA
              const canDelete = userRole === 'ADMIN'

              return (
                <div key={exam.id} className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg shadow-indigo-100/40 border border-white hover:shadow-xl transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3.5 py-1.5 rounded-full border border-indigo-100">
                        ⏱️ Thời gian: {exam.config?.timeLimit || 40} phút
                      </span>
                      {canDelete ? (
                        <button 
                          onClick={() => handleDeleteExam(exam.id)}
                          className="text-slate-300 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-2 rounded-xl transition"
                          title="Xóa đề"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">Chỉ Admin mới được xóa</span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-2">{exam.title}</h3>
                    <p className="text-xs text-slate-400 flex items-center mb-6 font-medium">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Ngày tạo: {new Date(exam.created_at).toLocaleDateString('vi-VN')} {exam.created_by && `• Tạo bởi: ${exam.created_by}`}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-xs font-mono text-slate-400 truncate max-w-[180px] bg-slate-50 px-2 py-1 rounded-lg">ID: {exam.id}</span>
                    <button 
                      onClick={() => handleCopyLink(exam.id)}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center shadow-md shadow-orange-200 active:scale-95"
                    >
                      {copiedId === exam.id ? <><Check className="w-4 h-4 mr-1.5" /> Đã chép link</> : <><Copy className="w-4 h-4 mr-1.5" /> Copy Link Gửi HS</>}
                    </button>
                  </div>
                </div>
              )
            })}
            {exams.length === 0 && (
              <div className="col-span-2 text-center py-20 bg-white/80 backdrop-blur-md rounded-3xl border border-dashed border-slate-300 text-slate-400 font-medium shadow-sm">
                🌸 Chưa có đề thi nào được tạo. Thầy hãy vào trang Upload để tải đề lên nhé!
              </div>
            )}
          </div>
        )}

        {/* TAB 2: KẾT QUẢ HỌC SINH NỘP BÀI & NÚT XUẤT EXCEL */}
        {activeTab === 'submissions' && (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-indigo-100/40 border border-white overflow-hidden">
            
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                📊 Tổng số lượt nộp: {submissions.length} học sinh
              </span>
              <button
                onClick={exportToCSV}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-emerald-200 flex items-center active:scale-95"
              >
                📊 Xuất File Excel / CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wider">
                    <th className="p-4 pl-6">Học Sinh</th>
                    <th className="p-4">Tên Đề Thi</th>
                    <th className="p-4 text-center">Điểm Số</th>
                    <th className="p-4 pr-6">Thời Gian Nộp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-indigo-50/30 transition">
                      <td className="p-4 pl-6 font-bold text-slate-800 flex items-center">
                        <Users className="w-4 h-4 mr-2 text-indigo-500" /> {sub.student_name}
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{sub.exams?.title || 'Đề kiểm tra KHTN'}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full font-black text-xs ${sub.score >= 8 ? 'bg-emerald-100 text-emerald-700' : sub.score >= 5 ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                          {sub.score} / 10
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-slate-400 text-xs font-medium">
                        {new Date(sub.created_at).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {submissions.length === 0 && (
              <div className="text-center py-20 text-slate-400 font-medium">
                🌸 Chưa có học sinh nào nộp bài.
              </div>
            )}
          </div>
        )}

      </div>

      <footer className="text-center py-6 text-xs text-slate-500 border-t border-white/60 bg-white/70 backdrop-blur-md mt-12 font-medium">
        Hệ thống học tập thông minh • Phát triển bởi <strong className="text-indigo-600">Thầy Trần Văn Liệu</strong> • <span className="text-blue-600 font-bold">Lớp Học Thêm Thăng Tiến</span>
      </footer>
    </div>
  )
}