// ============ FRIENDS MODULE ============

async function addFriend() {
    const friendInput = document.getElementById("friendIdInput");
    const username = friendInput.value.trim();
    if (!username) { showAlert("friendAlert","Please enter a username"); return; }
    const response = await fetch("/api/chillcord",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"addFriend",userId:currentUser.id,username})
    });
    const data=await response.json();
    if(!response.ok){ showAlert("friendAlert",data.error); return; }
    globalStore=data;
    friendInput.value="";
    displayFriends();
    showAlert("friendAlert","Friend added successfully!",true);
}

function displayFriends() {
    const friendsList = document.getElementById('friendsList');
    const friendIds = globalStore.friends[currentUser.id] || [];

    if (friendIds.length === 0) {
        friendsList.innerHTML = '<p style="font-size: 12px; color: #95a5a6;">No friends added yet</p>';
        return;
    }

    const friendsHTML = friendIds.map(friendId => {
        const friend = globalStore.users.find(u => u.id === friendId);
        if (!friend) return '';

        const isChatActive = currentChat === `friend_${friendId}`;
        return `
            <div class="chat-item ${isChatActive ? 'active' : ''}" 
                 data-chat-id="friend_${friendId}"
                 onclick="selectChat('friend_${friendId}')">
                👤 ${escapeHtml(friend.username)}
            </div>
        `;
    }).filter(html => html !== '').join('');

    friendsList.innerHTML = friendsHTML || '<p style="font-size: 12px; color: #95a5a6;">No friends added yet</p>';
}

function removeFriend(friendId) {
    const friendIdx = globalStore.friends[currentUser.id].indexOf(friendId);
    if (friendIdx > -1) {
        globalStore.friends[currentUser.id].splice(friendIdx, 1);
    }

    const userIdx = globalStore.friends[friendId].indexOf(currentUser.id);
    if (userIdx > -1) {
        globalStore.friends[friendId].splice(userIdx, 1);
    }

    saveStore();
    displayFriends();
    showAlert('friendAlert', 'Friend removed', true);
    
    if (currentChat.startsWith('friend_')) {
        selectChat('global');
    }
}
