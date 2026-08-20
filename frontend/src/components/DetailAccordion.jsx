import { useState } from 'react'
import InputForm from './InputForm'
import SensorChart from './SensorChart'

function DetailAccordion({ history, values, onChange, onSubmit, isSubmitting }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-gray-700"
      >
        <span>상세 데이터 보기 (판단 근거)</span>
        <span className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="space-y-6 border-t border-gray-200 p-6">
          <SensorChart history={history} />
          <InputForm values={values} onChange={onChange} onSubmit={onSubmit} isSubmitting={isSubmitting} />
        </div>
      )}
    </div>
  )
}

export default DetailAccordion
