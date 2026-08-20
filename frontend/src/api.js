const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API 요청 실패 (${response.status}): ${text || response.statusText}`);
  }
  return response.json();
}

export async function fetchSimulatedSensorData() {
  const response = await fetch(`${API_BASE_URL}/api/simulate-sensor`);
  return handleResponse(response);
}

export async function fetchRiskAssessment(sensorData) {
  const response = await fetch(`${API_BASE_URL}/api/risk-assessment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sensorData),
  });
  return handleResponse(response);
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  return handleResponse(response);
}
