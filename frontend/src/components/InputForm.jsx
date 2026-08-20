const FIELDS = [
  { key: "air_temp_c", label: "현재 기온 (°C)", step: 0.1 },
  { key: "soil_temp_c", label: "토양 온도 (°C)", step: 0.1 },
  { key: "soil_moisture_pct", label: "토양 수분 (%)", step: 0.1 },
  { key: "sap_flow_index", label: "수액 흐름 지수 (0~100)", step: 0.1 },
  { key: "humidity_pct", label: "상대 습도 (%)", step: 0.1 },
  { key: "recent_3day_avg_temp_c", label: "최근 3일 평균기온 (°C)", step: 0.1 },
  { key: "accumulated_temperature", label: "적산온도", step: 1 },
];

function InputForm({ values, onChange, onSubmit, isSubmitting }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">2. 현재 상태 확인/수정</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col text-sm text-gray-600">
            {field.label}
            <input
              type="number"
              step={field.step}
              value={values[field.key] ?? ""}
              onChange={(e) => onChange(field.key, Number(e.target.value))}
              className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="mt-6 w-full rounded-lg bg-green-600 px-4 py-3 text-lg font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {isSubmitting ? "판단 중..." : "위험도 판단하기"}
      </button>
    </div>
  );
}

export default InputForm;
