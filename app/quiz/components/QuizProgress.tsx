"use client"

interface QuizProgressProps {
  current: number
  total: number
}

export default function QuizProgress({ current, total }: QuizProgressProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className="sticky top-[53px] z-20 bg-white/80 backdrop-blur-sm px-4 py-2">
      <div className="max-w-lg mx-auto">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#F1542E] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 text-right mt-1">{percentage}%</p>
      </div>
    </div>
  )
}
