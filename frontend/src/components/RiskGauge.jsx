const LEVEL_STYLES = {
  safe: { ring: "stroke-green-500", bg: "bg-green-50", text: "text-green-700", label: "안전" },
  caution: { ring: "stroke-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700", label: "주의" },
  danger: { ring: "stroke-red-500", bg: "bg-red-50", text: "text-red-700", label: "위험" },
};

function RiskGauge({ result }) {
  if (!result) {
    return (
      <div className="flex h-full min-h-[16rem] items-center justify-center rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-400">
        "위험도 판단하기" 버튼을 누르면 결과가 여기에 표시됩니다.
      </div>
    );
  }

  const style = LEVEL_STYLES[result.risk_level] ?? LEVEL_STYLES.caution;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - result.risk_score / 100);

  return (
    <div className={`rounded-xl border border-gray-200 ${style.bg} p-6`}>
      <div className="flex flex-col items-center">
        <div className="relative h-36 w-36">
          <svg width="144" height="144" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r={radius} strokeWidth="12" className="stroke-gray-200" fill="none" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`${style.ring} transition-all duration-500`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${style.text}`}>{result.risk_score}</span>
            <span className={`text-sm font-semibold ${style.text}`}>{style.label}</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center font-medium text-gray-800">{result.recommended_action}</p>

      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-600">
        {result.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  );
}

export default RiskGauge;
