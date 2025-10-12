import { createChart } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

export default function Chart({ candles=[], markers=[] }){
  const ref=useRef(null); const api=useRef(null);
  useEffect(()=>{
    const el=ref.current; if(!el) return;
    const chart=createChart(el,{
      width:el.clientWidth, height:420,
      layout:{ background:{type:'Solid', color:'#ffffff'}, textColor:'#111' },
      grid:{ vertLines:{ color:'#eee' }, horzLines:{ color:'#eee' } },
      rightPriceScale:{ borderColor:'#ddd' }, timeScale:{ borderColor:'#ddd' }
    });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.matches) chart.applyOptions({ layout:{ background:{type:'Solid', color:'#0b1220'}, textColor:'#e5e7eb' }, grid:{ vertLines:{ color:'#15213a' }, horzLines:{ color:'#15213a' } }, rightPriceScale:{ borderColor:'#223355' }, timeScale:{ borderColor:'#223355' }});
    const series=chart.addCandlestickSeries({ upColor:'#16a34a', downColor:'#dc2626', borderVisible:false, wickUpColor:'#16a34a', wickDownColor:'#dc2626' });
    series.setData(candles.map(r=>({ time:Math.floor(r.t/1000), open:r.o, high:r.h, low:r.l, close:r.c })));
    if(markers?.length) series.setMarkers(markers);
    const ro=new ResizeObserver(()=>chart.applyOptions({ width:el.clientWidth })); ro.observe(el);
    api.current={ chart, series };
    return ()=>{ ro.disconnect(); chart.remove(); };
  }, [JSON.stringify(candles)]);
  useEffect(()=>{ if(api.current&&markers) api.current.series.setMarkers(markers); }, [JSON.stringify(markers)]);
  return <div ref={ref} className="w-full" />
}
