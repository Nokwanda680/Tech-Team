const togglePassword = document.querySelector('#togglePassword');
const passwordField = document.querySelector('#passwordField');
togglePassword.addEventListener('click',function(){
    if (passwordField.getAttribute('type')=='password'){
        passwordField.setAttribute('type','text');
        
    }else{
        passwordField.setAttribute('type','password');
    }
})