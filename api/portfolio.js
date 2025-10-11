import yahooFinance from "yahoo-finance2";

export default async function handler(req,res){
  try{
    const startCapital=10000;
    const picks=["PLTR","TSLA","NVDA","SMCI","SOFI"];
    const prices=[];
    for(const s of picks){
      const {quotes=[]}=await yahooFinance.chart(s,{interval:"1d",range:"1mo"});
      if(!quotes.length)continue;
      prices.push({symbol:s,price:quotes.at(-1).close});
    }
    const avg=prices.reduce((a,b)=>a+b.price,0)/prices.length;
    const alloc=startCapital/prices.length;
    const portfolio=prices.map(p=>({symbol:p.symbol,hold:alloc/p.price,price:p.price,value:alloc}));
    const total=portfolio.reduce((a,b)=>a+b.value,0);
    res.json({capital:startCapital,portfolio,total,profit:(total-startCapital).toFixed(2)});
  }catch(e){res.status(500).json({error:e.message});}
}
