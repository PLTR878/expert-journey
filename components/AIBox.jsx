export default function AIBox({ signal }){
  if(!signal) return null;
  const color = signal.action==='Buy' ? 'text-green-600' : signal.action==='Sell' ? 'text-red-600' : 'text-slate-400';
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">AI Trade Signal</h3>
        <span className={`font-semibold ${color}`}>{signal.action}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
        <div><b>Entry:</b> {signal.entry_zone||'-'}</div>
        <div><b>Target:</b> {signal.target||'-'}</div>
        <div><b>Stop:</b> {signal.stop_loss||'-'}</div>
        <div><b>Confidence:</b> {signal.confidence??'-'}%</div>
      </div>
      {signal.reason && <p className="text-sm mt-2"><b>Reason:</b> {signal.reason}</p>}
    </div>
  )
}
