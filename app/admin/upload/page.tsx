'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as mammoth from 'mammoth'
import { Upload, CheckCircle2, AlertCircle, Save, Loader2, Sparkles, FileText, Clock, Home, LayoutDashboard, Lock } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function UploadExam() {
  const [parsedData, setParsedData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [examTitle, setExamTitle] = useState('🌟 ĐỀ KIỂM TRA ĐÁNH GIÁ THƯỜNG XUYÊN - MÔN KHTN')
  const [saveSuccess, setSaveSuccess] = useState('')

  const [openTime, setOpenTime] = useState('')
  const [closeTime, setCloseTime] = useState('')
  const [timeLimit, setTimeLimit] = useState(40)
  const [examPassword, setExamPassword] = useState('')
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('user_role')
    if (!role) {
      router.push('/admin/login')
    }
  }, [router])

  const compressImageBase64 = (base64Str: string, contentType: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = `data:${contentType};base64,${base64Str}`
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_HEIGHT = 150
        let width = img.width
        let height = img.height
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height)
          height = MAX_HEIGHT
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = "#FFFFFF" 
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)
        }
        resolve(canvas.toDataURL('image/jpeg', 0.6))
      }
      img.onerror = () => resolve(`data:${contentType};base64,${base64Str}`)
    })
  }
const parseWordHtml = (html: string) => {
    const lines = html
      .split(/<\/p>|<br\s*\/?>/i)
      .map(line => {
        return line
          .replace(/<\/?(?!(img)\b)[^>]+>/gi, '')
          .replace(/&nbsp;/gi, ' ')
          .replace(/\u00A0/g, ' ')
          .trim()
      })
      .filter(line => line.length > 0)

    let currentPart = 1
    let questions: any[] = []
    let currentQ: any = null

    lines.forEach((line) => {
      const textOnly = line.replace(/<[^>]*>/g, '').trim()
      const textUpper = textOnly.toUpperCase()

      if (textUpper.includes('PHẦN I. CÂU TRẮC NGHIỆM MỘT ĐÁP ÁN ĐÚNG')) { currentPart = 1; return; }
      if (textUpper.includes('PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI')) { currentPart = 2; return; }
      if (textUpper.includes('PHẦN III. CÂU HỎI KÉO THẢ TỪ')) { currentPart = 3; return; }

      if (textUpper.match(/^CÂU\s+\d+[:.]/i)) {
        if (currentQ) questions.push(currentQ)
        
        currentQ = {
          part: currentPart,
          type: currentPart === 1 ? 'single' : currentPart === 2 ? 'true_false' : 'drag_drop',
          content: line,
          options: [],
          dropzones: [],
          correct_answer: null
        }
        
        if (currentPart === 3) {
          const dropzoneMatches = [...textOnly.matchAll(/\[(.*?)\]/g)]
          if (dropzoneMatches.length > 0) {
            currentQ.dropzones.push(...dropzoneMatches.map(m => m[1].trim()))
          }
          currentQ.content = textOnly.replace(/^Câu\s+\d+[:.]\s*/i, '').trim()
        }
        return;
      }

      if (currentQ) {
        if (currentPart === 3) {
          if (textUpper.startsWith('ĐÁP ÁN:') || textUpper.startsWith('*ĐÁP ÁN:') || textUpper.startsWith('ĐÁP ÁN :')) {
            const ansPart = textOnly.replace(/^\*?đáp\s*án\s*[:]\s*/i, '').trim()
            const words = ansPart.split(',').map(s => s.trim()).filter(Boolean)
            const ansObj: Record<string, string> = {}
            currentQ.dropzones.forEach((dz: string, idx: number) => {
              if (words[idx] !== undefined) {
                ansObj[dz] = words[idx]
              }
            })
            currentQ.correct_answer = ansObj
            return
          }

          if (/\[(.*?)\]/.test(textOnly)) {
            const dropzoneMatches = [...textOnly.matchAll(/\[(.*?)\]/g)]
            dropzoneMatches.forEach(m => {
              const dzName = m[1].trim()
              if (dzName && !currentQ.dropzones.includes(dzName)) {
                currentQ.dropzones.push(dzName)
              }
            })
            currentQ.content = currentQ.content ? `${currentQ.content}\n${textOnly}` : textOnly
            return
          }

          if (currentQ.options.length === 0 && textOnly.includes('-')) {
            currentQ.options = textOnly.split('-').map((w: string) => w.trim()).filter((w: string) => w.length > 0)
            return
          }

          currentQ.content = currentQ.content ? `${currentQ.content}\n${textOnly}` : textOnly
          return
        }

        const isAnswer = textUpper.match(/^(\*?[A-D]|\*?[a-d])[.)]/)
        if (isAnswer) {
          const isCorrect = textUpper.startsWith('*')
          let cleanLine = line.replace(/^\*?[A-Da-d][.)]\s*/i, '').trim()
          
          if (currentPart === 1) {
            currentQ.options.push(cleanLine)
            if (isCorrect) currentQ.correct_answer = currentQ.options.length - 1
          } else if (currentPart === 2) {
            currentQ.options.push({ text: cleanLine, correct: isCorrect })
          }
        } else {
          currentQ.content += '<br/>' + line
        }
      }
    })

    if (currentQ) questions.push(currentQ)
    return questions
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true); setError(''); setSaveSuccess('')
    
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer
        const options = {
          convertImage: mammoth.images.imgElement(function(image) {
            return image.read("base64").then(function(imageBuffer) {
              return compressImageBase64(imageBuffer, image.contentType).then(function(compressedSrc) {
                return {
                  src: compressedSrc,
                  style: "display: inline-block; vertical-align: middle; max-height: 80px; max-width: 100%; border-radius: 8px; margin: 0 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                };
              });
            });
          })
        };

        const result = await mammoth.convertToHtml({ arrayBuffer }, options)
        setParsedData(parseWordHtml(result.value))
        setLoading(false)
      }
      reader.readAsArrayBuffer(file)
    } catch (err) {
      setError('Lỗi khi đọc file. Yêu cầu định dạng .docx'); setLoading(false)
    }
  }

  const handleSaveToDatabase = async () => {
    if (parsedData.length === 0) return
    setIsSaving(true); setError(''); setSaveSuccess('')
    
    try {
      const supabase = createClient()
      const currentTeacher = typeof window !== 'undefined' ? localStorage.getItem('teacher_username') || 'ADMIN' : 'ADMIN'

      const { data: examData, error: examError } = await supabase
        .from('exams')
        .insert([{ 
          title: examTitle, 
          config: { 
            timeLimit: Number(timeLimit) || 40, 
            openTime: openTime ? new Date(openTime).toISOString() : null,
            closeTime: closeTime ? new Date(closeTime).toISOString() : null,
            shuffle: false, 
            showScoreAfter: true 
          },
          exam_password: examPassword ? examPassword.trim() : null,
          created_by: currentTeacher 
        }])
        .select()
        .single()

      if (examError) throw new Error("Lỗi khi tạo đề thi: " + examError.message)

      const questionsToInsert = parsedData.map(q => ({
        exam_id: examData.id,
        part: q.part,
        type: q.type,
        content: q.content,
        options: q.options,
        correct_answer: q.correct_answer,
        dropzones: q.dropzones
      }))

      const { error: qError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (qError) throw new Error("Lỗi khi lưu câu hỏi: " + qError.message)

      setSaveSuccess(`🎉 Lưu đề thi thành công! Mã đề của bạn là: ${examData.id}`)
      setParsedData([]) 
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }
return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-orange-50 p-6 md:p-10 font-sans flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-xl border border-white">
        
        {/* THANH ĐIỀU HƯỚNG LIÊN KẾT CHO ADMIN / GIAOVIEN */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <span className="p-3 bg-orange-100 text-orange-600 rounded-2xl shadow-inner">
              <Sparkles className="w-7 h-7" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-800">LỚP HỌC THĂNG TIẾN</h1>
              <p className="text-xs font-bold text-blue-600">Góc Sáng Tạo Đề Thi • Thầy Trần Văn Liệu</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link 
              href="/admin/dashboard" 
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4 mr-1.5 text-blue-600" /> Quản Trị Dashboard
            </Link>
            <Link 
              href="/" 
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center shadow-sm"
            >
              <Home className="w-4 h-4 mr-1.5 text-blue-600" /> Trang Chủ
            </Link>
          </div>
        </div>

        <p className="text-slate-500 mb-8 text-sm">Tải lên file Word (.docx) để hệ thống tự động bóc tách câu hỏi, hình ảnh và tạo đề trắc nghiệm siêu tốc cho học sinh! 🚀</p>
        
        {/* TÊN ĐỀ THI */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-blue-500" /> Tên Đề Thi
          </label>
          <input 
            type="text" 
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition font-medium text-slate-800 bg-slate-50/50"
          />
        </div>

        {/* CÀI ĐẶT THỜI GIAN, KHUNG GIỜ MỞ/ĐÓNG & MẬT KHẨU */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Thời gian làm bài (phút)
            </label>
            <input 
              type="number" 
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-full p-3 border border-slate-200 rounded-xl bg-white font-bold text-slate-800 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">⏳ Thời điểm Mở Đề</label>
            <input 
              type="datetime-local" 
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 text-xs outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">🔒 Thời điểm Đóng Đề</label>
            <input 
              type="datetime-local" 
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 text-xs outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
              <Lock className="w-3.5 h-3.5 mr-1.5 text-orange-600" /> Mật khẩu bảo vệ
            </label>
            <input 
              type="text" 
              placeholder="Để trống nếu không cần"
              value={examPassword}
              onChange={(e) => setExamPassword(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 text-xs outline-none focus:border-orange-500"
            />
          </div>
        </div>
        
        {/* KHU VỰC UPLOAD FILE */}
        <label className="flex flex-col items-center justify-center w-full h-48 border-3 border-dashed border-blue-300 rounded-3xl cursor-pointer bg-blue-50/60 hover:bg-blue-100/60 transition group mb-8 shadow-sm">
          <div className="p-4 bg-white rounded-full shadow-md group-hover:scale-110 transition-transform mb-3">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <span className="text-sm font-bold text-blue-700">{loading ? 'Đang đọc file & Nén ảnh sinh động...' : 'Bấm vào đây hoặc Kéo thả file .docx vào nhé!'}</span>
          <span className="text-xs text-slate-400 mt-1">Hỗ trợ định dạng Microsoft Word (.docx)</span>
          <input type="file" accept=".docx" className="hidden" onChange={handleFileUpload} disabled={loading || isSaving} />
        </label>

        {error && <div className="text-red-500 mb-6 flex items-center bg-red-50 p-4 rounded-2xl border border-red-200 font-medium"><AlertCircle className="w-5 h-5 mr-3 flex-shrink-0"/>{error}</div>}
        
        {saveSuccess && <div className="text-green-700 font-bold mb-6 flex items-center bg-green-50 p-4 rounded-2xl border border-green-200"><CheckCircle2 className="w-6 h-6 mr-3 flex-shrink-0 text-green-500"/> {saveSuccess}</div>}

        {parsedData.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
               <div className="text-emerald-800 font-bold flex items-center mb-3 sm:mb-0">
                 <span className="p-2 bg-emerald-200 text-emerald-800 rounded-xl mr-3">✨</span> 
                 Đã bóc tách thành công {parsedData.length} câu hỏi chuẩn xác!
               </div>
               
               <button 
                 onClick={handleSaveToDatabase}
                 disabled={isSaving}
                 className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-7 rounded-xl transition shadow-lg shadow-orange-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
               >
                 {isSaving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang lưu...</> : <><Save className="w-5 h-5 mr-2" /> Lưu ngay vào hệ thống</>}
               </button>
            </div>
            <pre className="bg-slate-900 text-emerald-400 p-5 rounded-2xl text-[11px] overflow-auto max-h-96 whitespace-pre-wrap leading-relaxed shadow-inner">{JSON.stringify(parsedData, null, 2)}</pre>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-xs text-slate-500 mt-12 font-medium">
        Hệ thống học tập thông minh • Phát triển bởi <strong className="text-slate-700">Thầy Trần Văn Liệu</strong> • <span className="text-blue-600 font-bold">Lớp Học Thêm Thăng Tiến</span> 🌟
      </footer>
    </div>
  )
}