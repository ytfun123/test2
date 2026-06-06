// ============ CHAT MODULE ============

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function selectChat(chatId) {
    currentChat = chatId;
    lastMessageCount = 0;
    displayMessages();
    updateChatHeader();
    updateChatItemActiveState();
}

function updateChatHeader() {
    const chatTitle = document.getElementById('chatTitle');
    const chatDescription = document.getElementById('chatDescription');

    if (currentChat === 'global') {
        chatTitle.textContent = '🌍 Global Chat';
        chatDescription.textContent = 'Everyone on the platform';
    } else if (currentChat.startsWith('friend_')) {
        const friendId = currentChat.replace('friend_', '');
        const friend = globalStore.users.find(u => u.id === friendId);
        chatTitle.textContent = friend?.username || 'Unknown User';
        chatDescription.textContent = 'Direct Message';
    } else if (currentChat.startsWith('group_')) {
        const groupId = currentChat.replace('group_', '');
        const group = globalStore.groups.find(g => g.id === groupId);
        chatTitle.textContent = group?.name || 'Unknown Group';
        chatDescription.textContent = `Group • ${group?.members?.length || 0} members`;
    }
}

function updateChatItemActiveState() {
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });

    document.querySelectorAll('.chat-item').forEach(item => {
        const itemChatId = item.getAttribute('data-chat-id');
        if (itemChatId === currentChat) {
            item.classList.add('active');
        }
    });
}

function displayMessages() {
    const messagesArea = document.getElementById('messagesArea');
    let messages = [];

    if (currentChat === 'global') {
        messages = globalStore.messages['global'] || [];
    } else if (currentChat.startsWith('friend_')) {
        const friendId = currentChat.replace('friend_', '');
        const key1 = `dm_${currentUser.id}_${friendId}`;
        const key2 = `dm_${friendId}_${currentUser.id}`;
        messages = globalStore.messages[key1] || globalStore.messages[key2] || [];
    } else if (currentChat.startsWith('group_')) {
        const groupId = currentChat.replace('group_', '');
        messages = globalStore.messages[`group_${groupId}`] || [];
    }

    if (messages.length === lastMessageCount && messagesArea.children.length > 1) {
        return;
    }

    lastMessageCount = messages.length;

    if (messages.length === 0) {
        messagesArea.innerHTML = '<div class="empty-state">No messages yet. Start the conversation! 💬</div>';
        return;
    }

    messagesArea.innerHTML = messages.map(msg => {
        const isOwn = msg.userId === currentUser.id;
        const user = globalStore.users.find(u => u.id === msg.userId);
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="message ${isOwn ? 'own' : ''}">
                <div class="message-content">
                    <div class="message-author">${user?.username || 'Unknown'}</div>
                    <div class="message-text">${escapeHtml(msg.text)}</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
    }).join('');

    messagesArea.scrollTop = messagesArea.scrollHeight;
}

async function sendMessage() {
    const messageInput=document.getElementById("messageInput");
    const text=messageInput.value.trim();
    if(!text) return;
    let conversationId="global";
    if(currentChat.startsWith("friend_")){
        const friendId=currentChat.replace("friend_","");
        conversationId=[currentUser.id,friendId].sort().join(":");
    }
    const response=await fetch("/api/chillcord",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"sendMessage",userId:currentUser.id,conversationId,text})
    });
    const data=await response.json();
    if(!response.ok){ showAlert("globalAlert",data.error); return; }
    globalStore=data;
    messageInput.value="";
    displayMessages();
}

function showChat() {
    document.getElementById('welcomeMenu').classList.remove('active');
    document.getElementById('signupContainer').classList.remove('active');
    document.getElementById('signinContainer').classList.remove('active');
    document.getElementById('recoveryContainer').classList.remove('active');
    document.getElementById('chatContainer').classList.add('active');

    document.getElementById('currentUsername').textContent = currentUser.username;
    document.getElementById('currentUserId').textContent = `ID: ${currentUser.id}`;

    currentChat = 'global';
    lastMessageCount = 0;
    displayMessages();
    displayFriends();
    displayGroups();
    updateChatHeader();
}
