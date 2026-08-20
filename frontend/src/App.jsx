import { useState } from 'react'
import { fetchRiskAssessment, fetchSimulatedSensorData } from './api'
import InputForm from './components/InputForm'
import RiskGauge from './components/RiskGauge'
import SensorChart from './components/SensorChart'

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
  const [isLoadingSensor, setIsLoadingSensor] = useState(false)
  const [isAssessing, setIsAssessing] = useState(false)
  const [error, setError] = useState('')

  const handleLoadSensorData = async () => {
    setIsLoadingSensor(true)
    setError('')
    try {
      const data = await fetchSimulatedSensorData()
      setSensorData(data)
      setFormValues({
        air_temp_c: data.air_temp_c,
        soil_temp_c: data.soil_temp_c,
        soil_moisture_pct: data.soil_moisture_pct,
        sap_flow_index: data.sap_flow_index,
        humidity_pct: data.humidity_pct,
        recent_3day_avg_temp_c: data.recent_3day_avg_temp_c,
        accumulated_temperature: data.accumulated_temperature,
      })
    } catch (err) {
      setError(err.message || '센서 데이터를 불러오지 못했습니다.')
    } finally {
      setIsLoadingSensor(false)
    }
  }

  const handleFormChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

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

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Fruit-Harness AI</h1>
          <p className="mt-2 text-gray-600">
            환상박피(girdling) 시공, 지금 해도 안전할까요? 기상·토양·수액 데이터로 미리 확인하세요.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            ※ 실제 센서 연동 전 단계로, 아래 데이터는 모두 데모용 가상(mock) 데이터입니다.
          </p>
        </header>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">1. 가상 센서 데이터 불러오기</h2>
              <p className="text-sm text-gray-500">최근 7일 기온/토양수분/수액지수 데이터를 시뮬레이션합니다.</p>
            </div>
            <button
              type="button"
              onClick={handleLoadSensorData}
              disabled={isLoadingSensor}
              className="rounded-lg bg-blue-600 px-5 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoadingSensor ? '불러오는 중...' : '가상 센서 데이터 불러오기'}
            </button>
          </div>
          <div className="mt-4">
            <SensorChart history={sensorData?.history} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <InputForm
            values={formValues}
            onChange={handleFormChange}
            onSubmit={handleAssessRisk}
            isSubmitting={isAssessing}
          />
          <RiskGauge result={riskResult} />
        </div>
      </div>
    </div>
  )
}

export default App

