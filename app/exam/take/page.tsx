'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle2, AlertTriangle, LayoutList, Send } from 'lucide-react'
import { DndContext, useDraggable, useDroppable, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'

// Dữ liệu mẫu (Giả lập file Word có ảnh)
const mockExamData = {
  title: "ĐỀ KIỂM TRA ĐÁNH GIÁ THƯỜNG XUYÊN - MÔN KHTN 8",
  timeLimit: 40,
  questions: [
    {
      id: 'q1', part: 1, type: 'single',
      content: 'Câu 1. Bức tranh này mô tả hiện tượng nào?',
      options: ['Đường tan trong nước.', 'Băng tan.', 'Nến cháy.', 'Dây đồng bị uốn cong.'],
      correct_answer: 2
    },
    {
      id: 'q2', part: 2, type: 'true_false',
      content: 'Câu 2. Quan sát hiện tượng băng tan thành nước.',
      options: [
        { id: 'a', text: 'a) Đây là biến đổi hóa học vì sinh ra chất mới.', correct: false },
        { id: 'b', text: 'b) Đây là biến đổi vật lý vì chất giữ nguyên là nước.', correct: true }
      ]
    },
    {
      id: 'q3', part: 3, type: 'drag_drop',
      content: 'Câu 3. Trong phản ứng, chất ban đầu bị biến đổi gọi là [drop_1], chất mới sinh ra gọi là [drop_2].',
      dropzones: ['drop_1', 'drop_2'],
      options: ['chất phản ứng', 'sản phẩm', 'chất xúc tác'],
      correct_answer: { 'drop_1': 'chất phản ứng', 'drop_2': 'sản phẩm' }
    }
  ]
}

const DraggableWord = ({ id, text }: { id: string, text: string }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return (
    <button ref={setNodeRef} {...listeners} {...attributes} style={style}
      className={`px-4 py-2 text-sm font-bold rounded-xl shadow-sm border active:scale-105 transition-transform touch-none ${
        isDragging ? 'bg-orange-500 text-white border-orange-500 z-50 shadow-xl' : 'bg-white border-slate-200 text-slate-700'
      }`}>
      {text}
    </button>
  )
}

const DroppableZone = ({ id, filledWord }: { id: string, filledWord?: string }) => {
  const { isOver, setNodeRef } = useDroppable({ id })
  return (
    <span ref={setNodeRef} className={`inline-flex items-center justify-center min-w-[120px] h-9 mx-2 px-3 border-2 border-dashed rounded-lg text-sm font-bold transition-colors ${
        isOver ? 'bg-blue-50 border-blue-400' : filledWord ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-slate-50 border-slate-300'
      }`}>
      {filledWord || 'Trống'}
    </span>
  )
}

export default function StudentExamInterface() {
  const [step, setStep] = useState<'start' | 'testing' | 'confirm' | 'result'>('start')
  const [timeLeft, setTimeLeft] = useState(mockExamData.timeLimit * 60)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [score, setScore] = useState(0)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  useEffect(() => {
    if (step !== 'testing' || timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    if (timeLeft === 0) handleCalculateScore() 
    return () => clearInterval(timer)
  }, [step, timeLeft])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleCalculateScore = () => {
    let totalCorrect = 0
    let maxPossible = mockExamData.questions.length

    mockExamData.questions.forEach((q) => {
      if (q.type === 'single') {
        if (answers[q.id] === q.correct_answer) totalCorrect += 1
      } else if (q.type === 'true_false') {
        let tfCorrectCount = 0
        q.options.forEach((opt: any, idx: number) => {
          if (answers[`${q.id}_${idx}`] === opt.correct) tfCorrectCount += 1
        })
        if (tfCorrectCount === q.options.length) totalCorrect += 1 
      } else if (q.type === 'drag_drop') {
        let isAllCorrect = true
        q.dropzones.forEach((dz: string) => {
          if (answers[dz] !== q.correct_answer[dz]) isAllCorrect = false
        })
        if (isAllCorrect) totalCorrect += 1
      }
    })

    const finalScore = (totalCorrect / maxPossible) * 10
    setScore(Number(finalScore.toFixed(2)))
    setStep('result')
  }

  if (step === 'start') return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg text-center border border-slate-200">
        <LayoutList size={48} className="text-blue-600 mb-4 mx-auto" />
        <h1 className="text-xl font-bold text-slate-800 mb-6">{mockExamData.title}</h1>
        <div className="space-y-4 text-sm text-slate-600 mb-8 bg-slate-50 p-6 rounded-xl text-left">
          <div className="flex justify-between border-b pb-2"><span>Thời gian làm bài</span><span className="font-bold">{mockExamData.timeLimit} phút</span></div>
          <div className="flex justify-between border-b pb-2"><span>Số lượng câu hỏi</span><span className="font-bold">{mockExamData.questions.length}</span></div>
        </div>
        <button onClick={() => setStep('testing')} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition shadow-md">
          Bắt đầu thi
        </button>
      </div>
    </div>
  )
if (step === 'testing') return (
    <div className="min-h-screen bg-slate-100 font-sans pb-24">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><Clock className="text-blue-600 w-5 h-5" /></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Thời gian còn lại</span>
            <span className={`text-lg font-black leading-none ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>{formatTime(timeLeft)}</span>
          </div>
        </div>
        <button onClick={() => setStep('confirm')} className="bg-orange-500 text-white text-sm font-bold px-5 py-2.5 rounded-full flex items-center shadow-lg active:scale-95 transition-transform">
          <Send className="w-4 h-4 mr-1.5" /> Nộp bài
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6 mt-2">
        <DndContext sensors={sensors} onDragEnd={(e) => { if (e.over) setAnswers(prev => ({ ...prev, [e.over!.id]: e.active.id })) }}>
          
          {/* PHẦN 1 */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <h2 className="text-xs font-black text-blue-600 uppercase mb-4 tracking-wider">Phần I. Trắc nghiệm (1 đáp án)</h2>
            {mockExamData.questions.filter(q => q.type === 'single').map(q => (
              <div key={q.id} className="mb-6">
                <div className="text-[15px] font-semibold text-slate-800 mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.content }} />
                <div className="space-y-3">
                  {q.options.map((opt: string, idx: number) => {
                    const isSelected = answers[q.id] === idx
                    return (
                      <button key={idx} onClick={() => setAnswers({ ...answers, [q.id]: idx })}
                        className={`w-full text-left p-4 rounded-xl border-2 flex items-center active:scale-[0.98] ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-100'}`}>
                        <span className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 text-sm font-bold mr-3 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {['A','B','C','D'][idx]}
                        </span>
                        <div className={`text-[15px] ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'}`} dangerouslySetInnerHTML={{ __html: opt }} />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>

          {/* PHẦN 2 */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <h2 className="text-xs font-black text-orange-500 uppercase mb-4 tracking-wider">Phần II. Đúng / Sai</h2>
            {mockExamData.questions.filter(q => q.type === 'true_false').map(q => (
              <div key={q.id} className="mb-6">
                <div className="text-[15px] font-semibold text-slate-800 mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.content }} />
                <div className="space-y-4">
                  {q.options.map((opt: any, idx: number) => {
                    const ansKey = `${q.id}_${idx}`
                    return (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-[14px] text-slate-700 mb-3" dangerouslySetInnerHTML={{ __html: opt.text }} />
                        <div className="flex space-x-3">
                          <button onClick={() => setAnswers({ ...answers, [ansKey]: true })} className={`flex-1 py-3 rounded-xl font-bold border-2 ${answers[ansKey] === true ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>Đúng</button>
                          <button onClick={() => setAnswers({ ...answers, [ansKey]: false })} className={`flex-1 py-3 rounded-xl font-bold border-2 ${answers[ansKey] === false ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>Sai</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>

          {/* PHẦN 3 */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <h2 className="text-xs font-black text-purple-600 uppercase mb-4 flex items-center">
              Phần III. Kéo thả từ khóa <span className="ml-2 px-2 py-0.5 bg-purple-100 rounded-full text-[10px]">Chạm & Giữ</span>
            </h2>
            {mockExamData.questions.filter(q => q.type === 'drag_drop').map(q => {
              const parts = q.content.split(/(\[.*?\])/)
              return (
                <div key={q.id} className="mb-6">
                  <div className="text-[15px] font-medium text-slate-800 leading-loose bg-slate-50 p-5 rounded-xl border border-slate-100 mb-6">
                    {parts.map((part, i) => {
                      if (part.startsWith('[') && part.endsWith(']')) {
                        const dropId = part.slice(1, -1)
                        return <DroppableZone key={dropId} id={dropId} filledWord={answers[dropId]} />
                      }
                      return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />
                    })}
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <p className="text-xs font-bold text-purple-400 uppercase mb-3">Kéo các từ dưới đây lên chỗ trống:</p>
                    <div className="flex flex-wrap gap-2.5">
                      {q.options.map((word: string) => {
                        if (Object.values(answers).includes(word)) return null
                        return <DraggableWord key={word} id={word} text={word} />
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </section>
        </DndContext>
      </main>
    </div>
  )

  if (step === 'confirm') return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 rounded-3xl text-center w-full max-w-sm">
        <AlertTriangle size={56} className="text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Chắc chắn nộp bài?</h2>
        <p className="text-slate-500 text-sm mb-6">Bạn sẽ không thể sửa lại sau khi nộp.</p>
        <div className="flex space-x-3">
          <button onClick={() => setStep('testing')} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold text-slate-700">Hủy</button>
          <button onClick={handleCalculateScore} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">Nộp bài</button>
        </div>
      </div>
    </div>
  )

  if (step === 'result') return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl text-center w-full max-w-sm shadow-sm border border-slate-200">
        <CheckCircle2 size={56} className="text-green-500 mx-auto mb-4" />
        <h2 className="font-bold text-slate-800 mb-2">Đã nộp bài thành công</h2>
        <div className="text-5xl font-black text-blue-600 my-6">{score}<span className="text-2xl text-slate-400 font-bold">/10</span></div>
        <button onClick={() => location.reload()} className="w-full bg-slate-100 py-3 rounded-xl font-bold text-slate-700">Quay về trang chủ</button>
      </div>
    </div>
  )

  return null
}