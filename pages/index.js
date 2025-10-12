<tbody>
  {rows.length === 0 && (
    <tr>
      <td colSpan="6" className="py-8 text-center text-gray-400">
        🔍 ยังไม่มีรายการ — กรอกสัญลักษณ์ด้านบนแล้วกด “สแกนใหม่”
        <br /> (ตัวอย่าง: AAPL, MSFT, NVDA)
      </td>
    </tr>
  )}

  {rows.map(r => {
    const q = quotes[r.symbol];
    const price = q?.price ?? r.lastClose ?? '-';
    const change = q?.changePct != null ? `${q.changePct.toFixed(2)}%` : '';

    return (
      <tr key={r.symbol} className="border-b border-gray-700 hover:bg-[#1c2538]/70 transition">
        <td className="p-2 font-semibold text-blue-400">
          <a href={`/analyze/${r.symbol}`}>{r.symbol}</a>
        </td>
        <td className="p-2 text-right">
          {Number.isFinite(r.score) ? r.score.toFixed(3) : '-'}
        </td>
        <td className="p-2 text-right">
          {price}{' '}
          <small className={(q?.changePct || 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
            {change}
          </small>
        </td>
        <td className="p-2 text-right">
          {Number.isFinite(r.rsi) ? r.rsi.toFixed(1) : '-'}
        </td>
        <td className="p-2 text-center">
          {[
            Number.isFinite(r.e20) ? r.e20.toFixed(2) : '-',
            Number.isFinite(r.e50) ? r.e50.toFixed(2) : '-',
            Number.isFinite(r.e200) ? r.e200.toFixed(2) : '-'
          ].join(' / ')}
        </td>
        <td className="p-2 text-center">
          <a
            className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs"
            href={`/analyze/${r.symbol}`}
          >
            ดู
          </a>
        </td>
      </tr>
    );
  })}
</tbody>
