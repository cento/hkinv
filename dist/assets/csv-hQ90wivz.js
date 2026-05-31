function i(o,s,t){const r=n=>n.includes(",")||n.includes('"')||n.includes(`
`)?`"${n.replace(/"/g,'""')}"`:n,e=[];e.push(s.map(r).join(","));for(const n of t)e.push(n.map(r).join(","));return"\uFEFF"+e.join(`\r
`)}function c(o){return o||""}export{i as exportToCsv,c as formatDateForCsv};
