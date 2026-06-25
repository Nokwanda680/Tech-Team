const save_button1 = document.getElementById('save1');
const previous = document.getElementById('prev1');
const section1 = dpcuemtn.getElementById('section1')
const section2 = dpcuemtn.getElementById('section2')

if (save_button1){save_button1.addEventListener('click',()=>{
    section1.style.display = "none";
    section2.style.display = "flex";

})}