import yahooFinance from "yahoo-finance2";

export default async function handler(req, res) {
  try {
    const list = ["TSLA","NVDA","SMCI","BBAI","AEHR","PLTR","GWH","QS","DNA","RXRX","IONQ","RKLB","SOFI","AFRM"];
    const out = [];
    for (const symbol of list) {
      const { quotes=[] } = await yahooFinance.chart(symbol, { interval:"1d", range:"3mo" });
      if(!quotes.length) continue;
      const close = quotes.map(q=>q.close);
      const vol   = quotes.map(q=>q.volume);
      const ema9  = ema(close,9);
      const ema21 = ema(close,21);
      const macd  = ema(close,12).map((v,i)=>v-ema(close,26)[i]);
      const rsi14 = rsi(close,14);
      const i = close.length-1;
      const score = (
        (ema9[i]>ema21[i]?0.3:0) +
        (macd[i]>0?0.3:0) +
        (rsi14[i]>50&&rsi14[i]<75?0.3:0)
      ).toFixed(2);
      out.push({symbol, price:close[i], score, vol:vol[i]});
    }
    out.sort((a,b)=>b.score-a.score);
    res.json({date:new Date(),items:out.slice(0,5)});
  } catch(e){ res.status(500).json({error:e.message}); }
}

function ema(arr,n){const k=2/(n+1);let prev=arr[0];return arr.map(v=>(prev= v*k+prev*(1-k)));}

function rsi(closes,n=14){
  let gains=0,losses=0;
  for(let i=1;i<=n;i++){const ch=closes[i]-closes[i-1];if(ch>0)gains+=ch;else losses-=ch;}
  let rs=gains/(losses||1);
  const out=new Array(closes.length).fill(50);
  out[n]=100-100/(1+rs);
  for(let i=n+1;i<closes.length;i++){
    const ch=closes[i]-closes[i-1];
    const G=ch>0?ch:0,L=ch<0?-ch:0;
    gains=(gains*(n-1)+G)/n;
    losses=(losses*(n-1)+L)/n;
    rs=gains/(losses||1);
    out[i]=100-100/(1+rs);
  }
  return out;
  }
