import { Redis } from '@upstash/redis';

const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });

function analyze(v: any) {
  const year = v.year || 2010, price = v.price || 5000, miles = v.mileage || 100000, age = 2026 - year;
  const baseMSRP: Record<string,number> = {toyota:30000,honda:28000,kia:24000,hyundai:25000,chevrolet:28000,chevy:28000,dodge:26000,mazda:25000,mitsubishi:20000,volkswagen:27000,vw:27000,subaru:28000,ford:28000,nissan:25000,chrysler:26000};
  const msrp = baseMSRP[(v.make||'').toLowerCase()] || 26000;
  const mv = Math.round(msrp * Math.pow(0.87,age) * Math.max(0.2, 1 - (miles/200000)*0.6));
  const ppAvg = Math.round((mv + Math.round(mv*0.78))/2);
  const equity = ppAvg - price;
  let risk = 0;
  if (miles > 150000) risk += 2; if (age > 15) risk += 1; if (price > mv * 1.2) risk += 2;
  let verdict: string, score: number;
  if (equity > 2000 && risk < 4) { verdict = '🔥 STRONG BUY'; score = 90; }
  else if (equity > 500 && risk < 6) { verdict = '✅ RECOMMENDED'; score = 72; }
  else if (equity > -1000) { verdict = '⚠️ PROCEED WITH CAUTION'; score = 45; }
  else { verdict = '🚫 AVOID'; score = 18; }
  if (miles < 80000) score += 5; if (year >= 2015) score += 3;
  score = Math.min(95, Math.max(10, score));
  const opex = Math.round((1200/25)*3.20 + price*0.007 + miles*0.008/12 + 60);
  const vc: Record<string,any> = {
    '🔥 STRONG BUY': {scoreColor:'text-emerald-500',badgeClass:'bg-emerald-500 text-[#0a0905]'},
    '✅ RECOMMENDED': {scoreColor:'text-green-500',badgeClass:'bg-green-600 text-white'},
    '⚠️ PROCEED WITH CAUTION': {scoreColor:'text-amber-500',badgeClass:'bg-amber-500 text-[#0a0905]'},
    '🚫 AVOID': {scoreColor:'text-red-500',badgeClass:'bg-red-600 text-white'},
  }[verdict]!;
  return {
    score, scoreColor: vc.scoreColor, badge: verdict.replace(/[🔥✅⚠️🚫]/g,'').trim(),
    badgeClass: vc.badgeClass, equity: (equity>=0?'+':'')+'$'+equity.toLocaleString(),
    equityColor: equity>2000?'text-emerald-400':equity>0?'text-green-400':equity>-1000?'text-amber-400':'text-red-400',
    opex: '$'+opex.toLocaleString(),
  };
}

async function main() {
  const listings = [
    {name:'2014 Kia Soul',year:2014,make:'Kia',model:'Soul',price:5000,mileage:0,location:'Lewisville, TX',source:'cl',bodyStyle:'SUV'},
    {name:'2016 Kia Sorento LX',year:2016,make:'Kia',model:'Sorento',price:4950,mileage:123000,location:'Dallas, TX',source:'fb',bodyStyle:'SUV'},
    {name:'2015 Kia Optima SX Turbo',year:2015,make:'Kia',model:'Optima',price:5000,mileage:120000,location:'Weatherford, TX',source:'fb',bodyStyle:'Sedan'},
    {name:'2016 Kia Forte5',year:2016,make:'Kia',model:'Forte5',price:4500,mileage:0,location:'Arlington, TX',source:'cl',bodyStyle:'Hatchback'},
    {name:'2012 Dodge Journey 3rd Row',year:2012,make:'Dodge',model:'Journey',price:3300,mileage:0,location:'Fort Worth, TX',source:'cl',bodyStyle:'SUV'},
    {name:'2015 Kia Forte',year:2015,make:'Kia',model:'Forte',price:3600,mileage:0,location:'Dallas, TX',source:'cl',bodyStyle:'Sedan'},
    {name:'2012 VW Passat 2.5L SE',year:2012,make:'Volkswagen',model:'Passat',price:3500,mileage:0,location:'Hurst, TX',source:'cl',bodyStyle:'Sedan'},
    {name:'2010 Dodge Charger',year:2010,make:'Dodge',model:'Charger',price:4500,mileage:0,location:'Arlington, TX',source:'cl',bodyStyle:'Sedan'},
    {name:'2015 Chevy Equinox LT',year:2015,make:'Chevrolet',model:'Equinox',price:5000,mileage:115000,location:'Quinlan, TX',source:'fb',bodyStyle:'SUV'},
    {name:'2014 Mazda CX-5 Touring',year:2014,make:'Mazda',model:'CX-5',price:2000,mileage:113000,location:'Dallas, TX',source:'fb',bodyStyle:'SUV'},
    {name:'2010 Subaru Outback',year:2010,make:'Subaru',model:'Outback',price:4250,mileage:120000,location:'Fort Worth, TX',source:'fb',bodyStyle:'Wagon'},
  ];

  const fleet = listings.map((l,i) => {
    const a = analyze(l);
    return { id: Date.now()+i, name:l.name, year:l.year, make:l.make, model:l.model, price:l.price, mileage:l.mileage, miles: l.mileage ? l.mileage.toLocaleString()+' miles' : 'Unknown miles', location:l.location, source:l.source, bodyStyle:l.bodyStyle, images:[], ...a, status:'analyzed' };
  });
  fleet.sort((a,b) => b.score - a.score);

  await redis.set('fleet', JSON.stringify(fleet));
  console.log(`Saved ${fleet.length} vehicles\n`);
  for (const v of fleet)
    console.log(`  ${v.score}% ${v.badge.padEnd(22)} ${v.equity.padEnd(12)} ${v.opex}/mo  ${v.name}`);
}

main().catch(console.error);
