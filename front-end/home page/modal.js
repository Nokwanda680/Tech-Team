document.addEventListener('DOMContentLoaded', () => {
  const modalOverlay = document.getElementById('modal1');
  const listingsGrid = document.getElementById('card1');
  const closeBtn = document.querySelector('.modal-close') || document.querySelector('.close');

  // Raw card data (normalized below)
  const rawCards = [
    {
      id:1,
      status: "Available Now",
      "main-image":"img3.jpeg",
      price: "4,800",
      distance: "1.1km from campus",
      room_type: "Double",
      accomodation_name: "Belhar-Lofts",
      accomodation_type: "Apartment",
      main_image: "img1.jpeg",
      sub_image1: "img2.jpeg",
      sub_image2: "img3.jpeg",
      sub_image3: "",
      sub_image4: "",
      description: "A sun-drenched one-bedroom apartment on the 4th floor with partial ocean views. Fully furnished with a modern kitchen, fast fibre internet, and access to a rooftop pool.",
      ammenity_1_wi_fi: "Wi-Fi",
      ammenity_2: "Free-Laundry",
      ammenity_3: "Furniture",
      ammenity_4: "Security",
      ammenity_5: "Study Area And computer Lab",
      video: "video.mp4"
    },
    {
      id:2,
      status: "Available in 2 Months",
      price: "7,300",
      image: "kovacs_image1.jpg",
      distance: "on-campus",
      room_type: "Single",
      accomodation_name: "Kovacs Student Village",
      accomodation_type: "Student Residence",
      description: "Single rooms are for one occupant, sharing an inter-leading door to an en-suite bathroom.",
      ammenity_1_wi_fi: "Free-Wi-Fi",
      ammenity_2: "Furniture",
      ammenity_3: "Water",
      ammenity_4: "Free-Electricity",
      ammenity_5: "Free-Laundry",
      video: ""
    },
    {
      id:3,
      status: "Available Soon!",
      image: "image 4.jpg",
      price: "5,200",
      distance: "3km from campus",
      room_type: "Double",
      accomodation_name: "FJ Properties",
      accomodation_type: "Private Accommodation",
      description: "",
      video: ""
    },
    {
      id:4,
      status: "Available in 3 Weeks",
      image: "kovacs_image2.jpg",
      price: "7,800",
      distance: "on-campus",
      room_type: "Single",
      accomodation_name: "Kovacs Student Village",
      accomodation_type: "Student Residence",
      description: "",
      video: ""
    },
    {
      id:5,
      status: "Available Now!",
      image: "kern_main.jpeg",
      price: "3,800",
      distance: "0.4km from campus",
      room_type: "Single",
      accomodation_name: "308 On Kern",
      accomodation_type: "Apartment",
      sub_image1: "img2.jpeg",
      sub_image2: "img3.jpeg",
      description: "",
      ammenity_1_wi_fi: "",
      video: ""
    }
  ];

  // Normalize card object shape: images array, amenities array, ensure main_image
  const cards = rawCards.map((c) => {
    const images = [];
    const main = c.main_image || c.image || c['main-image'] || '';
    if (main) images.push(main);
    ['sub_image1','sub_image2','sub_image3','sub_image4'].forEach(k => { if (c[k]) images.push(c[k]); });
    if (Array.isArray(c.images)) c.images.forEach(i=>images.push(i));

    const amenities = [];
    if (Array.isArray(c.amenities)) c.amenities.slice(0,9).forEach(a=>{ if (a) amenities.push(a); });
    for (let i=1;i<=9;i++){
      const k1 = 'ammenity_'+i;
      const k2 = 'ammenity_'+i+'_wi_fi';
      if (c[k1]) amenities.push(c[k1]);
      else if (c[k2]) amenities.push(c[k2]);
    }

    return Object.assign({}, c, {
      main_image: main || '',
      images: images,
      amenities: amenities,
    });
  });

  // Render cards (summary view)
  function renderCards(list){
    if (!listingsGrid) return;
    listingsGrid.innerHTML = list.map((card, idx) => {
      const thumb = (card.images && card.images[0]) ? card.images[0] : (card.image || card.main_image || '');
      return `
        <article class="card" data-index="${idx}">
          <div class="card-media">
            <img src="/Images/${thumb}" alt="">
            <span class="card-badge">${card.status || ''}</span>
          </div>
          <div class="card-body">
            <div class="card-price"><span>R${card.price || ''}</span><small>/month</small></div>
            <h4>${card.room_type || ''} — ${card.accomodation_name || ''}</h4>
            <div class="card-location">
              <p><img src="/Images/location.webp" alt="" height="30"></p>
              <p>${card.distance || ''}</p>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Populate static modal from a card object (only set fields that exist)
  function populateModal(data){
    if (!modalOverlay || !data) return;
    const headerSub = modalOverlay.querySelector('.modal-header div div:first-child');
    const headerTitle = modalOverlay.querySelector('.modal-header div div:nth-child(2)');
    if (headerSub) headerSub.textContent = data.Suburb || data.suburb || data.accomodation_name || '';
    if (headerTitle) headerTitle.textContent = [data.room_type || '', data.accomodation_name || ''].filter(Boolean).join(' — ');

    // Gallery
    const gallery = modalOverlay.querySelector('.modal-gallery');
    if (gallery){
      const imgs = [];
      if (data.images && data.images.length) imgs.push(`<div class="modal-gallery-main"><img src="/Images/${data.images[0]}" alt="Main photo"></div>`);
      (data.images||[]).slice(1,5).forEach(src=>{ if (src) imgs.push(`<div class="modal-gallery-thumb"><img src="/Images/${src}" alt=""></div>`); });
      if (imgs.length) gallery.innerHTML = imgs.join('');
    }

    // Price & status
    const priceEl = modalOverlay.querySelector('.modal-price');
    if (priceEl) priceEl.innerHTML = (data.price ? `R${data.price}` : '') + (data.price ? ' <span>/month</span>' : '');
    const chip = modalOverlay.querySelector('.chip.active');
    if (chip) chip.textContent = data.status || '';

    // Location
    const loc = modalOverlay.querySelector('.modal-content .card-location');
    if (loc){
      const icon = loc.querySelector('svg');
      loc.innerHTML = '';
      if (icon) loc.appendChild(icon);
      const p = document.createElement('p'); p.textContent = data.distance || '';
      loc.appendChild(p);
    }

    // Description
    const aboutP = modalOverlay.querySelector('.modal-section p');
    if (aboutP) aboutP.textContent = data.description || data.summary || '';

    // Amenities
    const amenGrid = modalOverlay.querySelector('.amenity-grid');
    if (amenGrid){
      if (data.amenities && data.amenities.length){
        amenGrid.innerHTML = data.amenities.slice(0,9).map(a=>`<div class="amenity">${a}</div>`).join('');
      } else {
        amenGrid.innerHTML = '';
      }
    }

    // Video
    const vp = modalOverlay.querySelector('.video-preview');
    if (vp){
      const videoEl = vp.querySelector('video');
      if (videoEl){
        if (data.video) videoEl.src = `/Images/${data.video}`;
        else videoEl.removeAttribute('src');
      }
    }
  }

  // Click delegation: open modal populated from the clicked card's full data
  if (listingsGrid){
    listingsGrid.addEventListener('click', (e)=>{
      const cardEl = e.target.closest('.card');
      if (!cardEl) return;
      const idx = Number(cardEl.dataset.index);
      if (isNaN(idx)) return;
      const data = cards[idx];
      if (!data) return;
      populateModal(data);
      modalOverlay.style.display = 'flex';
    });
  }

  // Close handlers
  if (closeBtn){
    closeBtn.addEventListener('click', ()=>{ modalOverlay.style.display = 'none'; });
  }
  window.addEventListener('click', (e)=>{ if (e.target === modalOverlay) modalOverlay.style.display = 'none'; });

  // Initial render
  renderCards(cards);
});
