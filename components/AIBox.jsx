// /components/AIBox.jsx
export default function AIBox({ signal }) {
  if (!signal) return (
    <div className="card p-4 text-center">
      <p>กำลังวิเคราะห์ข้อมูลด้วย AI...</p>
    </div>
  );

  const color =
    signal.action === 'Buy'
      ? 'text-green-500'
      : signal.action === 'Sell'
      ? 'text-red-500'
      : 'text-gray-400';

  return (
    <div className="card p-4">
      <h3 className="font-bold mb-2">สัญญาณการเทรดโดย AI</h3>
      <div className="flex justify-between items-center mb-2">
        <span>คำแนะนำ:</span>
        <span className={`font-bold ${color}`}>
          {signal.action === 'Buy'
            ? 'ซื้อ'
            : signal.action === 'Sell'
            ? 'ขาย'
            : 'ถือ'}
        </span>
      </div>

      <div>ราคาเข้า: {signal.entry || '-'}</div>
      <div>เป้าหมายราคา: {signal.target || '-'}</div>
      <div>จุดตัดขาดทุน: {signal.stop || '-'}</div>
      <div>ความมั่นใจของ AI: {(signal.confidence * 100).toFixed(1)}%</div>
      <div className="mt-1 text-sm text-gray-500">
        เหตุผล: {signal.reason || '-'}
      </div>
    </div>
  );
}
