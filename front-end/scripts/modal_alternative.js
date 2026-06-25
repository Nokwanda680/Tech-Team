document.addEventListener('DOMContentLoaded',()=>{
    const closebtn = document.getElementById('close');
    const listings = document.getElementById('cards');
    const number = document.getElementById("accomodations");
    const modal = document.getElementById('modal1');
    const pagintation = document.getElementById('pagintation');
    var card = [{
        "id":1,
        "status":"Available now!",
        "main_img":"img1.jpeg",
        "price":"4,800",
        "distance":"1.1 km from campus",
        "room_type":"Single",
        "accomodation_name":"Belhar-Lofts",
        "company_name":"Belhar Lofts Accomodation",
        "surburb":"Belhar",
        "sub_image1":"img2.jpeg",
        "sub_image2":"img3.jpeg",
        "sub_image3":"image4.jpg",
        "video":"video1.mp4",
        "description":"A sun-drenched one-bedroom apartment on the 4th floor with partial ocean views. Fully furnished with a modern kitchen, fast fibre internet, and access to a rooftop pool. Perfect for a focused student who wants proximity to campus and the city's best coffee shops.",
        "ammenity_1":"Free Wi-Fi",
        "ammenity_2":"",
        "ammenity_3":"",
        "ammenity_4":"",
        "ammenity_5":"",
    },{
        "id": 2,
        "status":"Available Soon! ",
        "main_img":"kern2.jpeg",
        "price":"5,500",
        "distance":"0.3km from campus",
        "room_type":"Single",
        "accomodation_name":"308 on kern",
        "company_name":"Kern Cres",
        "surburb":"Belhar",
        "sub_image1":"",
        "sub_image2":"",
        "sub_image3":"",
        "sub_image4":"",
        "sub_image1":"",
        "sub_image2":"",
        "sub_image3":"",
        "video":"",
        "description":"A sun-drenched one-bedroom apartment on the 4th floor with partial ocean views. Fully furnished with a modern kitchen, fast fibre internet, and access to a rooftop pool. Perfect for a focused student who wants proximity to campus and the city's best coffee shops.",
        "ammenity_1":"",
        "ammenity_2":"",
        "ammenity_3":"",
        "ammenity_4":"",
        "ammenity_5":"",
        "ammenity_6":"",        
    },{
        "id":3 ,
        "status":"New Listing!",
        "main_img":"kern1.jpeg",
        "price":"6,700",
        "distance":"0.3km from campus",
        "room_type":"Single",
        "accomodation_name":"308 on Kern",
        "company_name":"Kern Cres",
        "surburb":"Belhar",
        "sub_image1":"",
        "sub_image2":"",
        "sub_image3":"",
        "sub_image4":"",
        "sub_image1":"",
        "sub_image2":"",
        "sub_image3":"",
        "video":"",
        "description":"A sun-drenched one-bedroom apartment on the 4th floor with partial ocean views. Fully furnished with a modern kitchen, fast fibre internet, and access to a rooftop pool. Perfect for a focused student who wants proximity to campus and the city's best coffee shops.",
        "ammenity_1":"",
        "ammenity_2":"",
        "ammenity_3":"",
        "ammenity_4":"",
        "ammenity_5":"",
        "ammenity_6":"", 
    },{
        "id": 4,
        "status":"Available Soon!",
        "main_img":"img2.jpeg",
        "price":"5,200",
        "distance":'4km from campus',
        "room_type":"Single",
        "accomodation_name":"",
        "company_name":"FJ Properties",
        "surburb":"Bellville",
        "sub_image1":"",
        "sub_image2":"",
        "sub_image3":"",
        "sub_image4":"",
        "sub_image1":"",
        "sub_image2":"",
        "sub_image3":"",
        "video":"",
        "description":"A sun-drenched one-bedroom apartment on the 4th floor with partial ocean views. Fully furnished with a modern kitchen, fast fibre internet, and access to a rooftop pool. Perfect for a focused student who wants proximity to campus and the city's best coffee shops.",
        "ammenity_1":"",
        "ammenity_2":"",
        "ammenity_3":"",
        "ammenity_4":"",
        "ammenity_5":"",
        "ammenity_6":"", 
    },{
        "id":5,
        "status":"Available Now!",
        "main_img":"kovacs_image1.jpg",
        "price":"7,300",
        "distance":"on-campus",
        "room_type":"Single",
        "accomodation_name":"Kovacs",
        "company_name":"Kovacs Student Village",
        "surburb":"Bellville",
        "sub_image1":"",
        "sub_image2":"",
        "sub_image3":"",
        "sub_image4":"",
        "sub_image1":"",
        "sub_image2":"",
        "sub_image3":"",
        "video":"",
        "description":"A sun-drenched one-bedroom apartment on the 4th floor with partial ocean views. Fully furnished with a modern kitchen, fast fibre internet, and access to a rooftop pool. Perfect for a focused student who wants proximity to campus and the city's best coffee shops.",
        "ammenity_1":"",
        "ammenity_2":"",
        "ammenity_3":"",
        "ammenity_4":"",
        "ammenity_5":"",
        "ammenity_6":"",
        
    },
];
var number_of_accomodations = card.length;
number.innerHTML = number_of_accomodations;
function create_cards(card){
    return `
    <article class="card" id="card${card.id}" onclick="openModal(${card.id})">
        <div class="card-media" >
          <img src='/Images/${card.main_img || "No main picture  Available right now"}' alt="Student apartment">
          <span class="card-badge">${card.status || "Room Status unavailable"}</span>
          <span class="heart-icon"></span>
        </div>
        <div class="card-body">
          <div class="card-price"><span>R ${card.price || "Room Price Unavailable"}</span><small>/month</small></div>
          <h4>${card.room_type || "Room Type Currently Unavailable"} — ${card.surburb || "Room Location unavailable"}</h4>
          <div class="card-location">
            <p><img src="/Images/location.webp" alt="" height="30px" style="mix-blend-mode: multiply;"></p>
            <p> ${card.distance || "Accomodation Distance unavailable"}</p>
          </div>
        </div>
    </article>
    `;
}

listings.innerHTML= card.map(create_cards).join('');
/*
function paginantation(){
  return`
  <div class="pagintation">
          <buttton class="page-btn">‹</buttton>
          <buttton class="page-btn">1</buttton>
          <buttton class="page-btn">2</buttton>
          <buttton class="page-btn">3</buttton>
          <buttton class="page-btn">4</buttton>
          <buttton class="page-btn">...</buttton>
          <buttton class="page-btn">10</buttton>
          
        
  `;
}
pagintation.innerHTML= paginantation;*/

function create_modal(card){
    return `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div>
          <div style="font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:.1em; color:var(--bg); margin-bottom:4px;">${card.surburb || "Accomodation Suburb un-available"} · Cape Town</div>
          <div style="font-family:'Syne',sans-serif; font-size:1.5rem; font-weight:800;">${card.room_type || "Room Type Un-available"}— ${card.accomodation_name || "Accomodation name Unavailable"}</div>
        </div>
        <button class="modal-close close" id="close">&times;</button>
      </div>
      <div class="modal-gallery">
        <div class="modal-gallery-main">
          <img src="/Images/${card.main_img || "image unavailable "}" alt="Main photo" onclick="openModal(card.id)">
        </div>
        <div class="modal-gallery-thumb" color='black'><img src="/Images/${card.sub_image1 || "Image unavailable"}" alt="Bedroom"></div>
        <div class="modal-gallery-thumb"><img src="/Images/${card.sub_image2 || "Image unavailable"}" alt="Living area"></div>
        <div class="modal-gallery-thumb"><img src="/Images/${card.sub_image3 || "Image unavailable"}" alt="Kitchen"></div>
        <div class="modal-gallery-thumb"><img src="/Images/${card.sub_image4 || "Image unavailable"}" alt="Study area"></div>
      </div>
      <div class="modal-content">
        <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:12px;justify-content: space-between;">
          <span class="modal-price">${card.price || "Room Price Unavailable"}<span>/month</span></span>
          <span class="chip active" style="font-size:0.7rem; padding:4px 12px;color: var(--ink);background: var(--lime);width: 100px;border-radius: 1.001rem;">${card.status || "status Unavailable"}</span>
        </div>
        <div class="card-location" style="margin-bottom:0;color: var(--bg);">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${card.distance ||  "Accomodation Distance unavailable" }
        </div>
        <div class="modal-section">
          <h4>About this place</h4>
          <p style="font-size:0.9rem; color:var(--bg); line-height:1.7;">${card.description || "Description unavailable"}</p>
        </div>
        <div class="modal-section">
          <h4>Amenities</h4>
          <div class="amenity-grid">
            <div class="amenity"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>${card.ammenity_1 || "No Ammenity Input"}</div>
            <div class="amenity"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>${card.ammenity_2 || "No ammenity Input"}</div>
            <div class="amenity"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>${card.ammenity_3 || "No ammenity Input"}</div>
            <div class="amenity"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>${card.ammenity_4 || "No ammenity Input"}</div>
            <div class="amenity"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>${card.ammenity_5 || "No ammenity Input"}</div>
            <div class="amenity"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> ${card.ammenity_6 || "No ammenity Input"}</div>
          </div>
        </div>
        <div class="modal-section">
          <h4>Video Walkthrough</h4>
          <div class="video-preview">
            <video src="/Images/${card.video || "Video un-available"}" autoplay muted></video>
            <div class="play-btn"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
          </div>
          <div style="font-size:0.78rem; color:var(--bg); margin-top:8px; text-align:center;">Property video tour uploaded by landlord · 2:34</div>
        </div>
        <div class="modal-cta">
          <button class="btn-primary">Request a Viewing</button>
          <button class="btn-secondary">Message the Landlord</button>
        </div>
      </div>
    </div> `;
}
/*
function openModal(id){
  modal.classList('open');
  modal.style.display ='block';
}
card[card.id].addEventListener('click',()=>{
  modal.style.display = 'block';
})
//create_cards(card).addEventListener('click',()=>{
//  modal.style.display = 'flex';})
if (closebtn){
  closebtn.addEventListener('click',()=>{
    modal.style.display= 'none';})
}
window.addEventListener('click', (e)=>{ if (e.target === modal) modal.style.display = 'none'; });
*/
function openModal(id) {
  const selectedCard = card.find((item) => item.id === id);
  if (!selectedCard) return;
  modal.innerHTML = create_modal(selectedCard);
  modal.style.display = 'flex';
  const closeButton = modal.querySelector('.modal-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
}
window.openModal = openModal;
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});
})