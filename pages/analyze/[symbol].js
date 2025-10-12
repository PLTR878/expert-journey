<h1 className="m-0 text-xl font-bold">{symbol} — วิเคราะห์เรียลไทม์</h1>

<div className="mt-3 card p-3">
  <Chart candles={hist} markers={markers} />
</div>

<div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
  <div className="lg:col-span-2">
    <AIBox signal={signal} />
    <div className="card p-4 mt-3">
      <h3 className="font-bold">ตัวชี้วัดทางเทคนิค (Indicators)</h3>
      {!ind ? 'กำลังโหลดข้อมูล...' : (
        <ul className="text-sm leading-7">
          <li>ราคาปิดล่าสุด: {ind.lastClose}</li>
          <li>EMA20/50/200: {ind.ema20?.toFixed?.(2)} / {ind.ema50?.toFixed?.(2)} / {ind.ema200?.toFixed?.(2)}</li>
          <li>RSI(14): {ind.rsi14?.toFixed?.(1)}</li>
          <li>MACD: เส้นหลัก={ind.macd?.line?.toFixed?.(3)} สัญญาณ={ind.macd?.signal?.toFixed?.(3)} ฮิสโตแกรม={ind.macd?.hist?.toFixed?.(3)}</li>
          <li>ATR(14): {ind.atr14?.toFixed?.(3)}</li>
        </ul>
      )}
    </div>
  </div>
  <NewsFeed items={news} title="ข่าวตลาดล่าสุด" />
</div>
