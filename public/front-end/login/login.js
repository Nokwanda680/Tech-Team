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
                const response = await fetch('https://find-my-vibe.onrender.com/api/accounts/login/', {
                    method: 'POST',
                    headers: csrfHeaders({'Content-Type': 'application/json'}),
                    credentials: 'include',
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });
                
                const text = await response.text();
                console.log("Server response:", text);
                const data = JSON.parse(text);
                
                if (data.success) {
                    //alert(data.role);
                    //alert('Login successful!');
                    // Store user info

                    localStorage.setItem('username', data.username);
                    localStorage.setItem('role', data.role);
                    localStorage.setItem('userId', data.user_id);
                    // Redirect based on role
                    
                    if (data.role === 'STUDENT') {
                        window.location.href = '/front-end/dashboards/student dashboard/student_dashboard.html';
                    } else if (data.role === 'LANDLORD') {
                        window.location.href = '/front-end/dashboards/landlord dashboard/landlord_dashboard.html';
                    }else if(data.role ==='ADMIN'){
                       // alert("about to redirect");
                        window.location.href='/front-end/dashboards/admin dashboard/admin_dashboard.html';

                    }
                    
                } else {
                    alert('Login failed: ' + data.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
                console.error('Error:', error);
            }
        });
    }
});



//const view = document.getElementById('toogle');
const passwordInput = document.getElementById('Password');
const toggleButton = document.getElementById('toggle');
toggleButton.addEventListener('click', function (){
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';      // Reveal password
    toggleButton.textContent = 'Hide'; // Update button text
  } else {
    passwordInput.type = 'password';  // Hide password
    toggleButton.textContent = 'Show'; // Update button text
  }
});