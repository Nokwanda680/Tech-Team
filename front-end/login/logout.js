// Logout handler
async function logoutUser() {
    try {
        const response = await fetch('https://find-my-vibe.onrender.com/api/accounts/logout/', {
            method: 'POST',
            headers: csrfHeaders({'Content-Type': 'application/json'}),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Clear localStorage
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            localStorage.removeItem('userId');
            
            // Redirect to login
            alert('Logged out successfully');
            window.location.href = '/front-end/login/Login.html';
        } else {
            alert('Logout failed: ' + data.message);
        }
    } catch (error) {
        alert('Error: ' + error.message);
        console.error('Error:', error);
    }
}

// Check if user is logged in
function checkAuth() {
    const username = localStorage.getItem('username');
    if (!username) {
        // Redirect to login if not logged in
        if (!window.location.href.includes('login') && !window.location.href.includes('signup')) {
            window.location.href = '/front-end/login/Login.html';
        }
    }
    return username;
}
