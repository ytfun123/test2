// ============ AUTHENTICATION MODULE ============

function generateUserId() {
    return 'USER_' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function showAlert(elementId, message, isSuccess = false) {
    const alertDiv = document.getElementById(elementId);
    if (!alertDiv) return;
    alertDiv.innerHTML = `<div class="alert ${isSuccess ? 'success' : ''}">${message}</div>`;
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 4000);
}

function switchToSignUp() {
    document.getElementById('welcomeMenu').classList.remove('active');
    document.getElementById('signinContainer').classList.remove('active');
    document.getElementById('recoveryContainer').classList.remove('active');
    document.getElementById('signupContainer').classList.add('active');
}

function switchToSignIn() {
    document.getElementById('welcomeMenu').classList.remove('active');
    document.getElementById('signupContainer').classList.remove('active');
    document.getElementById('recoveryContainer').classList.remove('active');
    document.getElementById('signinContainer').classList.add('active');
}

function switchToRecovery() {
    document.getElementById('signinContainer').classList.remove('active');
    document.getElementById('signupContainer').classList.remove('active');
    document.getElementById('recoveryContainer').classList.add('active');
}

function handleSignUp(e) {
    e.preventDefault();

    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (username.length < 3) {
        showAlert('signupAlert', 'Username must be at least 3 characters');
        return;
    }

    if (globalStore.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        showAlert('signupAlert', 'Username already taken');
        return;
    }

    if (password.length < 6) {
        showAlert('signupAlert', 'Password must be at least 6 characters');
        return;
    }

    const newUser = {
        id: generateUserId(),
        username: username,
        password: password,
        createdAt: new Date().toISOString()
    };

    globalStore.users.push(newUser);
    globalStore.friends[newUser.id] = [];
    saveStore();

    showAlert('signupAlert', 'Account created successfully! Sign in now.', true);

    setTimeout(() => {
        document.getElementById('signupForm').reset();
        switchToSignIn();
    }, 1500);
}

function handleSignIn(e) {
    e.preventDefault();

    const username = document.getElementById('signinUsername').value.trim();
    const password = document.getElementById('signinPassword').value;

    const user = globalStore.users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
    );

    if (!user) {
        showAlert('signinAlert', 'Invalid username or password');
        return;
    }

    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    document.getElementById('signinForm').reset();
    showChat();
}

function handleRecovery(e) {
    e.preventDefault();

    const username = document.getElementById('recoveryUsername').value.trim();

    const user = globalStore.users.find(u => 
        u.username.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
        showAlert('recoveryAlert', 'No account found with this username');
        return;
    }

    showAlert('recoveryAlert', `Your password: ${user.password}`, true);

    setTimeout(() => {
        document.getElementById('recoveryForm').reset();
        switchToSignIn();
    }, 3000);
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    currentChat = 'global';
    document.getElementById('chatContainer').classList.remove('active');
    document.getElementById('welcomeMenu').classList.add('active');
    document.getElementById('signupForm').reset();
    document.getElementById('signinForm').reset();
}
