function saveUser(u,p){
localStorage.setItem('pc_'+u,p);
}
function getUser(u){
return localStorage.getItem('pc_'+u);
}
