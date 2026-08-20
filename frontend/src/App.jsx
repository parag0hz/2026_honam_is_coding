import { useState, useEffect } from 'react'
import DetailAccordion from './components/DetailAccordion'
import PhotoCheck from './components/PhotoCheck'
import RiskGauge from './components/RiskGauge'
import StatusBadges from './components/StatusBadges'
import { fetchRiskAssessment, fetchSimulatedSensorData } from './api'
import { getFieldBadges } from './riskDisplay'

function App() {
  const [sensorData, setSensorData] = useState(null)
  const [history, setHistory] = useState([])
  const [riskResult, setRiskResult] = useState(null)
  const [photoResult, setPhotoResult] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isAssessing, setIsAssessing] = useState(false)
  const [error, setError] = useState(null)

  // 1단계: 모니터링 (초기 데이터 로드)
  useEffect(() => {
    loadSimulationData()
  }, [])

  const loadSimulationData = async () => {
    setIsSimulating(true)
    setError(null)
    setRiskResult(null) // 새로운 데이터 로드 시 판단 결과 초기화
    setPhotoResult(null)
    try {
      const { history: sensorHistory, ...current } = await fetchSimulatedSensorData()
      setSensorData(current)
      setHistory(sensorHistory)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSimulating(false)
    }
  }

  const handleValueChange = (key, value) => {
    setSensorData((prev) => ({ ...prev, [key]: value }))
    setRiskResult(null) // 값이 수정되면 판단 결과 초기화
  }

  // 3단계: 가드레일 위험도 진단
  const handleAssessRisk = async () => {
    if (!sensorData) return
    setIsAssessing(true)
    setError(null)
    try {
      const result = await fetchRiskAssessment(sensorData)
      setRiskResult(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsAssessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      <header className="bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fruit-Harness AI</h1>
            <p className="text-sm text-gray-500">※ 데모용 가상(mock) 센서 데이터 기반 판단입니다.</p>
          </div>
          <button
            onClick={loadSimulationData}
            disabled={isSimulating}
            className="flex items-center justify-center rounded-full bg-blue-50 p-3 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
            title="센서 데이터 새로고침"
          >
            <svg className={`h-5 w-5 ${isSimulating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-4xl space-y-6 px-4">
        {/* RiskGauge에 isWaiting props 전달 */}
        <RiskGauge
          result={riskResult}
          isLoading={isAssessing}
          error={error}
          photoOverride={photoResult}
          isWaiting={!riskResult && !isAssessing && !error} 
        />

        {/* 2단계: 착색 상태 확인 (환경 위험도 판정이 끝난 뒤에만 활성화) */}
        <PhotoCheck
          environmentResult={riskResult}
          onResult={setPhotoResult}
        />
        {!riskResult && (
          <p className="-mt-4 text-center text-xs text-gray-400">
            착색 상태 확인은 위험도 판단 후 이용할 수 있어요.
          </p>
        )}

        {sensorData && <StatusBadges badges={getFieldBadges(sensorData)} />}

        {sensorData && (
          <DetailAccordion
            history={history}
            values={sensorData}
            onChange={handleValueChange}
            onSubmit={handleAssessRisk}
            isSubmitting={isAssessing}
          />
        )}
      </main>
    </div>
  )
}

export default App