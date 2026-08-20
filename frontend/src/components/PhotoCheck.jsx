import { useRef, useState } from 'react'
import { analyzePhoto } from '../api'

function PhotoCheck({ environmentResult, onResult }) {
  const inputRef = useRef(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [coloringPercent, setColoringPercent] = useState(null)
  const [error, setError] = useState('')

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsAnalyzing(true)
    setError('')
    try {
      const data = await analyzePhoto(file, environmentResult)
      if (data.coloring_result?.is_fallback) {
        setColoringPercent(null)
        setError('사진 판독에 실패했어요. 사진을 다시 찍어주세요.')
        onResult(null)
      } else {
        setColoringPercent(data.coloring_result.coloring_percent)
        onResult({ finalMessage: data.final_message, comment: data.coloring_result.comment })
      }
    } catch (err) {
      setColoringPercent(null)
      setError(err.message || '사진 분석에 실패했습니다.')
      onResult(null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isAnalyzing}
        className="rounded-lg bg-orange-500 px-5 py-3 text-lg font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {isAnalyzing ? '사진 분석 중...' : '📸 착색 상태 확인하기'}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {coloringPercent !== null && (
        <div className="mt-4">
          <p className="mb-1 text-sm text-gray-600">착색 진행도: {coloringPercent}%</p>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-500"
              style={{ width: `${coloringPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoCheck
