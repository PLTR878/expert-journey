<div className="card p-4">
  <h3 className="font-bold">สัญญาณการเทรดโดย AI</h3>
  {signal ? (
    <>
      <div className="flex justify-between items-center">
        <span>คำแนะนำ:</span>
        <span className={`font-bold ${signal.action === 'Buy' ? 'text-green-500' : signal.action === 'Sell' ? 'text-red-500' : 'text-gray-400'}`}>
          {signal.action === 'Buy' ? 'ซื้อ' : signal.action === 'Sell' ? 'ขาย' : 'ถือ'}
        </span>
      </div>
      <div>เป้าหมายราคา: {signal.target || '-'}</div>
      <div>จุดตัดขาดทุน: {signal.stop || '-'}</div>
      <div>ความมั่นใจของ AI: {(signal.confidence * 100).toFixed(1)}%</div>
      <div>เหตุผล: {signal.reason || '-'}</div>
    </>
  ) : (
    <p>กำลังวิเคราะห์ด้วย AI...</p>
  )}
</div>
