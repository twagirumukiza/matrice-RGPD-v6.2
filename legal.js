(()=>{
  let p={};
  try{p=JSON.parse(localStorage.getItem('rgpd-matrix-github')||'{}')}catch{}
  p.lang=p.lang||'fr';
  p.theme=p.theme||'dark';
  p.fontSize=Number(p.fontSize||0);
  const lang=document.getElementById('lang');
  const theme=document.getElementById('theme');
  const save=()=>localStorage.setItem('rgpd-matrix-github',JSON.stringify(p));
  function apply(){
    document.body.classList.toggle('light',p.theme==='light');
    document.documentElement.lang=p.lang;
    document.documentElement.style.setProperty('--font-scale',String(1+p.fontSize*.12));
    document.querySelectorAll('[data-fr]').forEach(e=>e.hidden=p.lang==='en');
    document.querySelectorAll('[data-en]').forEach(e=>e.hidden=p.lang!=='en');
    if(lang)lang.textContent=p.lang==='en'?'FR':'EN';
    if(theme)theme.textContent=p.theme==='light'?'◐':'☀';
  }
  if(lang)lang.onclick=()=>{p.lang=p.lang==='en'?'fr':'en';save();apply()};
  if(theme)theme.onclick=()=>{p.theme=p.theme==='light'?'dark':'light';save();apply()};
  document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{
    const v=Number(b.dataset.size);
    p.fontSize=v===0?0:Math.max(-1,Math.min(2,p.fontSize+v));
    save();apply();
  });
  apply();
})();
