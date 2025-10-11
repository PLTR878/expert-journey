export default async function handler(req,res){
  try{
    const sectors=[
      {theme:"AI/Data/Cloud",symbols:["PLTR","SMCI","AI","NVDA","BBAI"]},
      {theme:"Battery/Energy",symbols:["SLDP","QS","GWH"]},
      {theme:"BioTech/Genomics",symbols:["DNA","RXRX"]},
      {theme:"Space/Quantum",symbols:["IONQ","RKLB"]},
      {theme:"Fintech/Payment",symbols:["SOFI","AFRM"]}
    ];
    const out=[];
    for(const s of sectors){
      for(const sym of s.symbols){
        const futureScore=Math.round(Math.random()*40+60); // placeholder “อนาคตไกล”
        out.push({sector:s.theme,symbol:sym,score:futureScore});
      }
    }
    out.sort((a,b)=>b.score-a.score);
    res.json({date:new Date(),items:out});
  }catch(e){res.status(500).json({error:e.message});}
}
