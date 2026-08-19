// Login form handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginform');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('Password').value.trim();
            
            if (!username || !password ) {
                alert('Please fill in all fields');
                return;
            }
            
            try {
                await primeCsrfCookie(true);

                const response = await fetch('http://127.0.0.1:8000/api/accounts/login/', {
                    method: 'POST',
                    headers: csrfHeaders({'Content-Type': 'application/json'}),
                    credentials: 'include',
                    body: JSON.stringify({
                        username: username,
                        //email: username,
                        //student_no: username,
                        password: password
                    })
                });

                const responseText = await response.text();
                let data = {};
                try {
                    data = responseText ? JSON.parse(responseText) : {};
                } catch (parseError) {
                    console.error('Could not parse login response:', parseError, responseText);
                    data = { success: false, message: responseText || 'Unexpected server response.' };
                }

                console.log("Status:", response.status);
                console.log("Response:", data);
                
                if (response.ok && data.success) {
                    console.log("Role:", `"${data.role}"`);
                    //alert('Login successful!');
                    //Store user info(

                    localStorage.setItem('username', data.username);
                    localStorage.setItem('role', data.role);
                    localStorage.setItem('userId', data.user_id);

                    const role = (data.role || '').trim().toUpperCase();
                    const redirectMap = {
                        STUDENT: '../dashboards/student dashboard/dashboard.html',
                        LANDLORD: '../dashboards/landlord dashboard/landlord_dashboard.html',
                        ADMIN: '../dashboards/admin dashboard/admin_dashboard.html'
                    };
                    let redirectPath = redirectMap[role] || redirectMap.STUDENT;

                    if (!redirectMap[role]) {
                        console.warn('Unrecognized role:', JSON.stringify(data.role), 'defaulting to student dashboard.');
                    }

                    const redirectUrl = new URL(redirectPath, window.location.href).toString();
                    console.log('Redirecting to:', redirectUrl, 'for role:', role);
                    window.location.replace(redirectUrl);
                }
                else {
                    alert('Login failed: ' + (data.message || 'Please try again.'));
                }
            } catch (error) {
                alert('Error: ' + error.message);
                console.error('Error:', error);
            }
        });
    }
});

// Password toggle only if the page includes a toggle button.
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('Password');
    const toggleButton = document.getElementById('toggle');

    if (toggleButton && passwordInput) {
        toggleButton.addEventListener('click', function toggle() {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';      
                toggleButton.textContent = 'Hide'; 
            } else {
                passwordInput.type = 'password';  
                toggleButton.textContent = 'Show'; // Update button 
            }
        });
    }
});