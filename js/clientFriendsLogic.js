const peerCordFriends={
add(name){console.log("Add friend:",name);},
remove(name){console.log("Remove friend:",name);},
list(){return JSON.parse(localStorage.getItem("pc_friends")||"[]");}
};