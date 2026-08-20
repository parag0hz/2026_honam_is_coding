import { getHeroBgClass, getHeroHeadline } from '../riskDisplay'

function speakKorean(text) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ko-KR'
  window.speechSynthesis.speak(utterance)
}

function RiskGauge({ result, isLoading, error, photoOverride, isWaiting }) {
  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl bg-red-50 p-8 text-center shadow-lg">
        <p className="text-3xl font-bold text-red-700 sm:text-4xl">데이터를 불러오지 못했어요</p>
        <p className="mt-4 text-red-600">{error}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl bg-gray-200 p-8 text-center shadow-lg">
        <p className="text-3xl font-bold text-gray-500 sm:text-4xl">판단하는 중이에요...</p>
      </div>
    )
  }

  // 초기 대기 상태 UI
  if (isWaiting) {
     return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl bg-slate-100 p-8 text-center shadow-md border border-slate-200">
        <p className="text-4xl font-extrabold leading-tight text-slate-700 sm:text-5xl">
          과수 생육 및 기후 모니터링 중
        </p>
        <p className="mt-4 text-sm text-slate-500">
          위험도 점수: - / 100
        </p>
        <p className="mt-6 text-lg text-slate-600">
          착색 상태를 확인하거나 아래 [위험도 판단하기] 버튼을 눌러 박피 안전성을 진단하세요.
        </p>
      </div>
    )
  }

  const headline = photoOverride?.finalMessage ?? getHeroHeadline(result.risk_level)
  const reason = photoOverride?.comment ?? result.reasons?.[0] ?? ''
  const bgClass = getHeroBgClass(result.risk_level)
  const isDarkText = result.risk_level !== 'caution'

  return (
    <div className={`flex min-h-[50vh] flex-col items-center justify-center rounded-2xl ${bgClass} px-6 py-10 text-center shadow-lg transition-colors duration-500`}>
      <p className={`text-5xl font-extrabold leading-tight sm:text-6xl ${isDarkText ? 'text-white' : 'text-gray-900'}`}>
        {headline}
      </p>
      <p className={`mt-4 text-sm ${isDarkText ? 'text-white/70' : 'text-gray-700'}`}>
        위험도 점수 (참고용): {result.risk_score} / 100
      </p>
      <p className={`mt-6 text-lg ${isDarkText ? 'text-white/90' : 'text-gray-800'}`}>{reason}</p>

      <button
        type="button"
        onClick={() => speakKorean(`${headline}. ${reason}`)}
        className={`mt-8 rounded-full px-6 py-3 text-lg font-semibold shadow transition-colors ${
          isDarkText ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-black/10 text-gray-900 hover:bg-black/20'
        }`}
      >
        🔊 음성으로 듣기
      </button>
    </div>
  )
}

export default RiskGauge