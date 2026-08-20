import { useCallback, useEffect, useState } from 'react'
import { fetchRiskAssessment, fetchSimulatedSensorData } from './api'
import DetailAccordion from './components/DetailAccordion'
import PhotoCheck from './components/PhotoCheck'
import RiskGauge from './components/RiskGauge'
import StatusBadges from './components/StatusBadges'
import { getFieldBadges } from './riskDisplay'

const DEFAULT_FORM_VALUES = {
  air_temp_c: 14.0,
  soil_temp_c: 11.0,
  soil_moisture_pct: 40.0,
  sap_flow_index: 55.0,
  humidity_pct: 60.0,
  recent_3day_avg_temp_c: 13.0,
  accumulated_temperature: 250.0,
}

function App() {
  const [sensorData, setSensorData] = useState(null)
  const [formValues, setFormValues] = useState(DEFAULT_FORM_VALUES)
  const [riskResult, setRiskResult] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAssessing, setIsAssessing] = useState(false)
  const [error, setError] = useState('')
  const [photoOverride, setPhotoOverride] = useState(null)

  // 새로고침 아이콘과 최초 로드가 공유하는 자동 판정 루틴: 새 가상 데이터를 불러와 바로 위험도 판단까지 실행한다.
  const runAutoAssessment = useCallback(async () => {
    setIsLoading(true)
    setError('')
    setPhotoOverride(null) // 새 환경 데이터가 들어오면 이전 사진 판독 결과는 더 이상 유효하지 않다.
    try {
      const data = await fetchSimulatedSensorData()
      const nextValues = {
        air_temp_c: data.air_temp_c,
        soil_temp_c: data.soil_temp_c,
        soil_moisture_pct: data.soil_moisture_pct,
        sap_flow_index: data.sap_flow_index,
        humidity_pct: data.humidity_pct,
        recent_3day_avg_temp_c: data.recent_3day_avg_temp_c,
        accumulated_temperature: data.accumulated_temperature,
      }
      setSensorData(data)
      setFormValues(nextValues)
      const result = await fetchRiskAssessment(nextValues)
      setRiskResult(result)
    } catch (err) {
      setError(err.message || '데이터를 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    runAutoAssessment()
  }, [runAutoAssessment])

  const handleFormChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  // 상세 데이터 폼에서 값을 직접 수정했을 때만 쓰는 수동 재판단(심사위원이 근거를 검증할 수 있도록 유지).
  const handleAssessRisk = async () => {
    setIsAssessing(true)
    setError('')
    try {
      const result = await fetchRiskAssessment(formValues)
      setRiskResult(result)
    } catch (err) {
      setError(err.message || '위험도 판단에 실패했습니다.')
    } finally {
      setIsAssessing(false)
    }
  }

  const badges = getFieldBadges(formValues)

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fruit-Harness AI</h1>
            <p className="text-xs text-gray-400">※ 데모용 가상(mock) 센서 데이터 기반 판단입니다.</p>
          </div>
          <button
            type="button"
            onClick={runAutoAssessment}
            disabled={isLoading}
            aria-label="새로고침"
            title="다시 판정하기"
            className="rounded-full border border-gray-300 bg-white p-3 text-xl shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            🔄
          </button>
        </header>

        <RiskGauge result={riskResult} isLoading={isLoading} error={error} photoOverride={photoOverride} />

        {riskResult && (
          <div className="mt-4">
            <PhotoCheck key={sensorData?.timestamp} environmentResult={riskResult} onResult={setPhotoOverride} />
          </div>
        )}

        <div className="my-4">
          <StatusBadges badges={badges} />
        </div>

        <DetailAccordion
          history={sensorData?.history}
          values={formValues}
          onChange={handleFormChange}
          onSubmit={handleAssessRisk}
          isSubmitting={isAssessing}
        />
      </div>
    </div>
  )
}

export default App


