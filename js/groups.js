// ============ GROUPS MODULE ============

function generateGroupCode() {
    return 'GROUP_' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function openCreateGroup() {
    document.getElementById('createGroupModal').classList.add('active');
    document.getElementById('generatedCode').value = generateGroupCode();
}

function closeCreateGroup() {
    document.getElementById('createGroupModal').classList.remove('active');
    document.getElementById('createGroupForm').reset();
    document.getElementById('generatedCode').value = '';
}

function handleCreateGroup(e) {
    e.preventDefault();

    const groupName = document.getElementById('groupName').value.trim();
    const groupCode = document.getElementById('generatedCode').value.trim();

    if (!groupName) {
        showAlert('groupAlert', 'Please enter a group name');
        return;
    }

    const newGroup = {
        id: groupCode,
        name: groupName,
        code: groupCode,
        createdBy: currentUser.id,
        members: [currentUser.id],
        createdAt: new Date().toISOString()
    };

    globalStore.groups.push(newGroup);
    globalStore.messages[`group_${groupCode}`] = [];
    saveStore();

    document.getElementById('createGroupForm').reset();
    closeCreateGroup();
    showAlert('groupAlert', `Group "${groupName}" created!`, true);
    displayGroups();
}

function joinGroupByCode() {
    const groupCodeInput = document.getElementById('groupCodeInput');
    const groupCode = groupCodeInput.value.trim().toUpperCase();

    if (!groupCode) {
        showAlert('groupAlert', 'Please enter a group code');
        return;
    }

    const group = globalStore.groups.find(g => g.code === groupCode);

    if (!group) {
        showAlert('groupAlert', 'Group not found');
        return;
    }

    if (group.members.includes(currentUser.id)) {
        showAlert('groupAlert', 'You are already a member of this group');
        return;
    }

    group.members.push(currentUser.id);
    saveStore();
    groupCodeInput.value = '';
    showAlert('groupAlert', `Joined group "${group.name}"!`, true);
    displayGroups();
}

function displayGroups() {
    const groupsList = document.getElementById('groupsList');
    const userGroups = globalStore.groups.filter(g => g.members.includes(currentUser.id));

    if (userGroups.length === 0) {
        groupsList.innerHTML = '<p style="font-size: 12px; color: #95a5a6;">No groups yet</p>';
        return;
    }

    const groupsHTML = userGroups.map(group => {
        const isChatActive = currentChat === `group_${group.id}`;
        return `
            <div class="chat-item ${isChatActive ? 'active' : ''}" 
                 data-chat-id="group_${group.id}"
                 onclick="selectChat('group_${group.id}')">
                🔷 ${escapeHtml(group.name)}
            </div>
        `;
    }).join('');

    groupsList.innerHTML = groupsHTML || '<p style="font-size: 12px; color: #95a5a6;">No groups yet</p>';
}

function leaveGroup(groupId) {
    const group = globalStore.groups.find(g => g.id === groupId);
    if (!group) return;

    const memberIdx = group.members.indexOf(currentUser.id);
    if (memberIdx > -1) {
        group.members.splice(memberIdx, 1);
    }

    saveStore();
    displayGroups();
    showAlert('groupAlert', `Left group "${group.name}"`, true);
    
    if (currentChat === `group_${groupId}`) {
        selectChat('global');
    }
}
