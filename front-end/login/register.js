let currentSection = 1;

        function goToSection(sectionNum) {
            document.querySelectorAll('.signup-section').forEach(section => {
                section.style.display = 'none';
            });
            document.getElementById('section' + sectionNum).style.display = 'block';
            currentSection = sectionNum;
            window.scrollTo(0, 0);
        }

        document.getElementById('landlordSignupForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const password1 = document.getElementById('password1').value;
            const password2 = document.getElementById('password2').value;
            
            if (password1 !== password2) {
                document.getElementById('section3_error').textContent = 'Passwords do not match!';
                return;
            }

            if (password1.length < 8) {
                document.getElementById('section3_error').textContent = 'Password must be at least 8 characters!';
                return;
            }
            const formData = {
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                first_name: document.getElementById('first_name').value,
                last_name: document.getElementById('last_name').value,
                phone_number: document.getElementById('phone_number').value,
                password1: password1,
                password2: password2,
                company_name: document.getElementById('company_name').value,
                id_number: document.getElementById('id_number').value,
                role: 'LANDLORD'
            };
            
            try {
                const response = await fetch('http://127.0.0.1:8000/api/accounts/register/', {
                    method: 'POST',
                    headers: csrfHeaders({'Content-Type': 'application/json'}),
                    credentials: 'include',
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('section3_success').textContent = 'Account created successfully! Redirecting...';
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('role', data.role);
                    setTimeout(() => {
                        window.location.href = '/front-end/login/Login.html';
                    }, 2000);
                } else {
                    document.getElementById('section3_error').textContent = 'Error: ' + (data.message || 'Registration failed');
                }
            } catch (error) {
                document.getElementById('section3_error').textContent = 'Error: ' + error.message;
                console.error('Error:', error);
            }
        });