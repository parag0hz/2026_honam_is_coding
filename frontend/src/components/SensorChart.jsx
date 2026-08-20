import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function SensorChart({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400">
        "가상 센서 데이터 불러오기" 버튼을 눌러 최근 7일 데이터를 확인하세요.
      </div>
    );
  }

  return (
    <div className="h-64 rounded-xl border border-gray-200 bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="air_temp_c" name="기온(°C)" stroke="#ef4444" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="soil_moisture_pct" name="토양수분(%)" stroke="#3b82f6" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="sap_flow_index" name="수액지수" stroke="#22c55e" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SensorChart;
