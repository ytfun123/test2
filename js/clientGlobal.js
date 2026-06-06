function addGlobalMessage(msg){
let d=JSON.parse(localStorage.getItem('pc_global')||'[]');
d.push(msg);
localStorage.setItem('pc_global',JSON.stringify(d));
}
function getGlobalMessages(){
return JSON.parse(localStorage.getItem('pc_global')||'[]');
}
