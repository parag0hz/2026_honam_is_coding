// 화면 문구/배지 상태를 risk_engine.py 의 판단 기준과 최대한 비슷하게 프론트에서 파생시키는 순수 함수 모음.
// 백엔드 로직을 그대로 복제하지는 않고, 화면 요약 표시(뱃지)만을 위한 참고용 판정이다.

const HERO_HEADLINE = {
  safe: '지금 박피해도 안전해요',
  caution: '며칠 더 지켜보고 결정하세요',
  danger: '오늘은 박피를 피하세요',
}

const HERO_BG_CLASS = {
  safe: 'bg-green-500',
  caution: 'bg-yellow-400',
  danger: 'bg-red-500',
}

export function getHeroHeadline(riskLevel) {
  return HERO_HEADLINE[riskLevel] ?? '판단 결과를 확인해 주세요'
}

export function getHeroBgClass(riskLevel) {
  return HERO_BG_CLASS[riskLevel] ?? 'bg-gray-400'
}

function statusOf(isDanger, isCaution) {
  if (isDanger) return 'danger'
  if (isCaution) return 'caution'
  return 'safe'
}

const STATUS_LABEL = { safe: '정상', caution: '주의', danger: '위험' }

export function getFieldBadges(values) {
  const tempStatus = statusOf(
    values.recent_3day_avg_temp_c < 5,
    Math.abs(values.air_temp_c - values.recent_3day_avg_temp_c) > 8 ||
      values.accumulated_temperature < 100 ||
      values.accumulated_temperature > 600,
  )
  const moistureStatus = statusOf(
    values.soil_moisture_pct < 10 || values.soil_moisture_pct > 90,
    values.soil_moisture_pct < 20 || values.soil_moisture_pct > 80,
  )
  const sapStatus = statusOf(values.sap_flow_index < 15, values.sap_flow_index < 30)

  return [
    { key: 'temp', icon: '🌡️', status: tempStatus, label: `기온 ${STATUS_LABEL[tempStatus]}` },
    { key: 'moisture', icon: '💧', status: moistureStatus, label: `토양수분 ${STATUS_LABEL[moistureStatus]}` },
    { key: 'sap', icon: '🌿', status: sapStatus, label: `수액지수 ${STATUS_LABEL[sapStatus]}` },
  ]
}
