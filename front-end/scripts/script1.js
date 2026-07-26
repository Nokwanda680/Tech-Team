document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.querySelector('#togglePassword');
    const passwordField = document.querySelector('#Password');
    if (!passwordField) return;
    if (!togglePassword) return;

    togglePassword.addEventListener('click', function(e){
        e.preventDefault();
        const currentType = passwordField.getAttribute('type');
        passwordField.setAttribute('type', currentType === 'password' ? 'text' : 'password');
    });
});