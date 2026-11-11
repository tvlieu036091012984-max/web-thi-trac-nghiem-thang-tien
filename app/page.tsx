'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { GraduationCap, ArrowRight, Trophy, Clock, Sparkles, UserCheck, Shield, BookOpen, Loader2, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [exams, setExams] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExamId, setSelectedExamId] = useState<string>('')

  useEffect(() => {
    fetchHomeData()
  }, [])

  const fetchHomeData = async () => {
    try {
      const supabase = createClient()
      
      const { data: examData } = await supabase.from('exams').select('*').order('created_at', { ascending: false })
      if (examData && examData.length > 0) {
        setExams(examData)
        setSelectedExamId(examData[0].id)
        fetchLeaderboard(examData[0].id)
      }
      setLoading(false)
    } catch (err) {
      console.error("Lỗi tải trang chủ:", err)
      setLoading(false)
    }
  }

  const fetchLeaderboard = async (examId: string) => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('exam_id', examId)
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(10)
      if (data) setLeaderboard(data)
    } catch (err) {
      console.error("Lỗi tải bảng xếp hạng:", err)
    }
  }

  const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedExamId(id)
    fetchLeaderboard(id)
  }
if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-orange-50 font-sans flex flex-col justify-between relative overflow-hidden">
      
      {/* Các đốm màu trang trí nền lung linh dễ thương */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 w-full relative z-10">
        
        {/* BANNER CHÀO MỪNG */}
        <div className="bg-white/85 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-xl shadow-indigo-100/50 border border-white/80 text-center mb-10 relative overflow-hidden">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
            <GraduationCap className="text-white w-10 h-10" />
          </div>

          <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black mb-4 border border-indigo-100">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> <span>Hệ Thống Kiểm Tra Đánh Giá Trực Tuyến</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight mb-3">
            LỚP HỌC THĂNG TIẾN
          </h1>
          <p className="text-indigo-600 font-bold text-base md:text-lg mb-4 flex items-center justify-center">
            <UserCheck className="w-5 h-5 mr-1.5 text-blue-500" /> Giáo viên phụ trách: Thầy TRẦN VĂN LIỆU
          </p>
          <p className="text-slate-500 text-sm max-w-xl mx-auto mb-8 font-medium">
            Chọn đề thi bên dưới để bắt đầu làm bài hoặc theo dõi bảng vàng vinh danh các em học sinh đạt thành tích xuất sắc!
          </p>

          <div className="flex justify-center gap-4">
            <Link 
              href="/admin/dashboard" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold px-6 py-3.5 rounded-2xl shadow-md shadow-blue-200 transition active:scale-95 flex items-center space-x-2"
            >
              <Shield className="w-4 h-4" /> <span>Quản Trị Dashboard ⚙️</span>
            </Link>
          </div>
        </div>

        {/* NỘI DUNG CHÍNH: 2 CỘT (DANH SÁCH ĐỀ & BẢNG XẾP HẠNG) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI: DANH SÁCH ĐỀ THI CHO HỌC SINH */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-black text-slate-800 flex items-center mb-4">
              <BookOpen className="w-5 h-5 mr-2 text-indigo-600" /> Danh Sách Đề Thi Mới Nhất ({exams.length})
            </h2>

            {exams.map((exam) => (
              <div key={exam.id} className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg shadow-indigo-100/40 border border-white hover:shadow-xl transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3.5 py-1.5 rounded-full border border-indigo-100 flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-indigo-500" /> Thời gian: {exam.config?.timeLimit || 40} phút
                    </span>
                    <span className="text-slate-400 text-xs flex items-center font-medium">
                      <Calendar className="w-3 h-3 mr-1 text-indigo-400" /> {new Date(exam.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-800">{exam.title}</h3>
                </div>

                <Link 
                  href={`/exam/${exam.id}`}
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-md shadow-orange-200 flex items-center justify-center transition active:scale-95 flex-shrink-0"
                >
                  Vào Làm Bài <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </div>
            ))}

            {exams.length === 0 && (
              <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-3xl border border-dashed border-slate-300 text-slate-400 font-medium">
                🌸 Chưa có đề thi nào được xuất bản. Thầy hãy tạo và đăng đề từ trang quản trị nhé!
              </div>
            )}
          </div>
{/* CỘT PHẢI: BẢNG XẾP HẠNG (LEADERBOARD) */}
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg shadow-indigo-100/40 border border-white h-fit space-y-4">
            <h2 className="text-base font-black text-slate-800 flex items-center mb-2">
              <Trophy className="w-5 h-5 mr-2 text-amber-500" /> Bảng Vàng Vinh Danh
            </h2>

            {exams.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Chọn đề xem bảng xếp hạng:</label>
                <select 
                  value={selectedExamId}
                  onChange={handleExamChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {exams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3">
              {leaderboard.map((item, index) => (
                <div key={item.id} className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${index === 0 ? 'bg-amber-50/80 border-amber-300 shadow-sm' : index === 1 ? 'bg-slate-100/80 border-slate-300' : index === 2 ? 'bg-orange-50/60 border-orange-200' : 'bg-slate-50/50 border-slate-100'}`}>
                  <div className="flex items-center space-x-3 truncate">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${index === 0 ? 'bg-amber-500 text-white shadow-sm shadow-amber-200' : index === 1 ? 'bg-slate-400 text-white' : index === 2 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{item.student_name}</span>
                  </div>
                  <span className="text-xs font-black text-indigo-600 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-indigo-50 shrink-0">
                    {item.score} đ
                  </span>
                </div>
              ))}

              {leaderboard.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  🌸 Chưa có học sinh nộp bài cho đề này.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      <footer className="text-center py-6 text-xs text-slate-500 border-t border-white/60 bg-white/70 backdrop-blur-md mt-12 font-medium">
        Hệ thống học tập thông minh • Phát triển bởi <strong className="text-indigo-600">Thầy Trần Văn Liệu</strong> • <span className="text-blue-600 font-bold">Lớp Học Thêm Thăng Tiến</span>
      </footer>
    </div>
  )
}