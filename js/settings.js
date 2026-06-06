// ============ SETTINGS MODULE ============

function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    document.getElementById('settingsUserId').value = currentUser.id;
    document.getElementById('settingsUsername').value = currentUser.username;
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
    document.getElementById('settingsForm').reset();
}

function handleSettingsSave(e) {
    e.preventDefault();

    const newUsername = document.getElementById('settingsUsername').value.trim();

    if (!newUsername) {
        showAlert('settingsAlert', 'Username cannot be empty');
        return;
    }

    if (newUsername.length < 3) {
        showAlert('settingsAlert', 'Username must be at least 3 characters');
        return;
    }

    // Check if username is already taken (excluding current user)
    if (globalStore.users.some(u => u.id !== currentUser.id && u.username.toLowerCase() === newUsername.toLowerCase())) {
        showAlert('settingsAlert', 'Username already taken');
        return;
    }

    // Update username in current user object
    currentUser.username = newUsername;
    
    // Update in globalStore users array
    const userInStore = globalStore.users.find(u => u.id === currentUser.id);
    if (userInStore) {
        userInStore.username = newUsername;
    }

    // Save changes
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    saveStore();

    // Update UI
    document.getElementById('currentUsername').textContent = currentUser.username;
    showAlert('settingsAlert', 'Username updated successfully!', true);
    
    setTimeout(() => {
        closeSettings();
    }, 1500);
}
