// STATE
const state = {
  isDark: false, capturedImage: null, selectedFrame: 0,
  gridMode: 1, timerDuration: 3, gallery: [], currentPage: 'landing',
  galleryCategory: 'All', lightboxIndex: null, lightboxImages: [],
  stream: null, countdown: null, countdownTimer: null,
  isCapturingGrid: false, gridCaptureCount: 0, tempGridImages: [],
  cameraState: 'loading', currentSlide: 0, slideProgress: 0,
  carouselTimer: null, carouselProgressTimer: null,
  statsPhotos: 0, statsFrames: 0, statsUsers: 0, statsTimer: null,
  miniSlide: 0, miniTimer: null,
};

// Load saved gallery
try {
  const saved = localStorage.getItem('photobooth_gallery');
  if (saved) state.gallery = JSON.parse(saved);
} catch(e){}

// If gallery is empty, add the three custom images
if (state.gallery.length === 0) {
  const customImages = [
    { id: 'custom-1', src:'1.jpg', category: 'Nature', date: new Date().toISOString(), frameId: null },
    { id: 'custom-2', src:'4.jpeg', category: 'Portrait', date: new Date().toISOString(), frameId: null },
    { id: 'custom-3', src:'10.jpg', category: 'Nature', date: new Date().toISOString(), frameId: null }
  ];
  state.gallery.push(...customImages);
  saveGallery();
}

function saveGallery() {
  try { localStorage.setItem('photobooth_gallery', JSON.stringify(state.gallery)); } catch(e){}
}

// DARK MODE
function toggleDark() {
  state.isDark = !state.isDark;
  document.body.classList.toggle('dark', state.isDark);
  const btn = document.getElementById('dark-btn');
  btn.innerHTML = state.isDark
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}

// GALLERY DROPDOWN (click-based)
function toggleGalleryDropdown() {
  const menu = document.getElementById('nav-gallery-menu');
  menu.classList.toggle('open');
}
document.addEventListener('click', e => {
  if (!e.target.closest('.nav-dropdown')) {
    const menu = document.getElementById('nav-gallery-menu');
    if (menu) menu.classList.remove('open');
  }
});

// MOBILE GALLERY SUBMENU
function toggleMobileGallery() {
  const sub = document.getElementById('mobile-gallery-submenu');
  const chev = document.getElementById('mobile-gallery-chevron');
  const isOpen = sub.style.display === 'flex';
  sub.style.display = isOpen ? 'none' : 'flex';
  if (chev) chev.style.transform = isOpen ? '' : 'rotate(180deg)';
}

// ============================================================
// NAVBAR ACTIVE STATE HELPERS
// ============================================================

// Sets nav-home or nav-gallery as active (for page-level nav)
function setNavActive(page) {
  document.getElementById('nav-home').classList.toggle('active', page === 'landing');
  document.getElementById('nav-gallery').classList.toggle('active', page === 'gallery');
  // Clear any section-level active when not on landing
  if (page !== 'landing') {
    document.querySelectorAll('.nav-link').forEach(l => {
      if (l.id !== 'nav-home' && l.id !== 'nav-gallery') {
        l.classList.remove('active', 'scrollspy-active');
      }
    });
  }
}

// Sets a specific section link as active (used on click + scrollspy)
// sectionId: 'hero' | 'features' | 'how' | 'faq' | 'plugins-section' | 'contact'
const sectionNavId = {
  'hero':            'nav-home',
  'features':        'nav-features',
  'how':             'nav-how',
  'faq':             'nav-faq',
  'plugins-section': 'nav-plugins',
  'contact':         'nav-contact',
};
function setNavSectionActive(sectionId) {
  const targetId = sectionNavId[sectionId] || 'nav-home';
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active', 'scrollspy-active'));
  const target = document.getElementById(targetId);
  if (target) target.classList.add('active');
}

// ============================================================
// NAVIGATION
// ============================================================
function navigate(page) {
  ['landing','camera','gallery'].forEach(p => {
    const el = document.getElementById('page-'+p);
    if(el) el.classList.remove('active');
  });
  const target = document.getElementById('page-'+page);
  if (target) target.classList.add('active');
  state.currentPage = page;
  window.scrollTo(0,0);
  if (page !== 'camera' && state.stream) {
    state.stream.getTracks().forEach(t=>t.stop());
    state.stream=null;
  }
  if (page === 'camera') initCameraFlow();
  if (page === 'gallery') renderGallery();

  // Update navbar active state
  setNavActive(page);
}

function navigateGallery(cat) {
  state.galleryCategory = cat;
  const menu = document.getElementById('nav-gallery-menu');
  if(menu) menu.classList.remove('open');
  navigate('gallery');
}

// ============================================================
// SCROLL-TO-SECTION — with click-scroll guard
// ============================================================
let isClickScrolling = false;
let clickScrollTimer = null;

function scrollToSection(id) {
  if (state.currentPage !== 'landing') {
    navigate('landing');
    setTimeout(() => scrollToSection(id), 150);
    return;
  }

  // Immediately mark the clicked section's nav link as active
  setNavSectionActive(id);

  // Block scrollspy from overriding for 1 second
  isClickScrolling = true;
  clearTimeout(clickScrollTimer);
  clickScrollTimer = setTimeout(() => {
    isClickScrolling = false;
  }, 1000);

  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// MOBILE MENU
function openMobileMenu() {
  document.getElementById('mobile-overlay').style.display='block';
  document.getElementById('mobile-menu').classList.add('open');
}
function closeMobileMenu() {
  document.getElementById('mobile-overlay').style.display='none';
  document.getElementById('mobile-menu').classList.remove('open');
}

// NAVBAR SCROLL
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  document.getElementById('fab').classList.toggle('visible', window.scrollY > 300 && state.currentPage !== 'camera');
});

// PRELOADER
setTimeout(() => {
  const pre = document.getElementById('preloader');
  pre.classList.add('hiding');
  setTimeout(() => { pre.style.display='none'; }, 800);
  startLandingAnimations();
}, 2500);

// HERO FLOATING BUBBLES
function buildHeroBg() {
  const bg = document.getElementById('hero-bg');
  for (let i=0;i<20;i++) {
    const el = document.createElement('div');
    el.className = 'animate-float';
    const size = Math.random()*100+50;
    el.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${(Math.random()*5).toFixed(1)}s;animation-duration:${(Math.random()*10+10).toFixed(1)}s;`;
    bg.appendChild(el);
  }
}
buildHeroBg();

// STATS COUNTER
function startStatsCounter() {
  if (state.statsTimer) return;
  state.statsTimer = setInterval(()=>{
    state.statsPhotos = Math.min(state.statsPhotos+25,1000);
    state.statsFrames = Math.min(state.statsFrames+2,50);
    state.statsUsers  = Math.min(state.statsUsers+15,500);
    document.getElementById('stat-photos').textContent = state.statsPhotos+'+';
    document.getElementById('stat-frames').textContent = state.statsFrames+'+';
    document.getElementById('stat-users').textContent  = state.statsUsers+'+';
    if (state.statsPhotos>=1000 && state.statsFrames>=50 && state.statsUsers>=500) clearInterval(state.statsTimer);
  },50);
}

// CAROUSEL
function carouselGo(idx) {
  document.getElementById('slide-'+state.currentSlide).classList.remove('active');
  state.currentSlide = idx;
  document.getElementById('slide-'+idx).classList.add('active');
  state.slideProgress = 0;
  restartCarouselProgress();
}
function carouselNext() { carouselGo((state.currentSlide+1)%3); }
function carouselPrev() { carouselGo((state.currentSlide+2)%3); }
function restartCarouselProgress() {
  if (state.carouselProgressTimer) clearInterval(state.carouselProgressTimer);
  state.slideProgress = 0; updateDots();
  state.carouselProgressTimer = setInterval(()=>{
    state.slideProgress += 2; updateDots();
    if (state.slideProgress >= 100) {
      clearInterval(state.carouselProgressTimer);
      carouselGo((state.currentSlide+1)%3);
    }
  }, 80);
}
function updateDots() {
  [0,1,2].forEach(i => {
    const inner = document.getElementById('dot-'+i);
    if (i < state.currentSlide) inner.style.width='100%';
    else if (i === state.currentSlide) inner.style.width=state.slideProgress+'%';
    else inner.style.width='0%';
  });
}
restartCarouselProgress();

// MINI CAROUSEL
const miniImages = ['https://picsum.photos/seed/1/600/300','https://picsum.photos/seed/2/600/300','https://picsum.photos/seed/3/600/300'];
state.miniTimer = setInterval(()=>{
  state.miniSlide=(state.miniSlide+1)%miniImages.length;
  const img=document.getElementById('mini-carousel-img');
  if(img) img.src=miniImages[state.miniSlide];
}, 3000);
function miniCarouselPrev(e) {
  e.stopPropagation();
  state.miniSlide=(state.miniSlide+2)%miniImages.length;
  document.getElementById('mini-carousel-img').src=miniImages[state.miniSlide];
}
function miniCarouselNext(e) {
  e.stopPropagation();
  state.miniSlide=(state.miniSlide+1)%miniImages.length;
  document.getElementById('mini-carousel-img').src=miniImages[state.miniSlide];
}

// FEATURE MODAL DATA
const featureData = [
  {
    title: 'Instant Capture',
    img: 'https://picsum.photos/seed/feat1/600/400',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    desc: 'Our camera module delivers a seamless, professional photo-booth experience right in your browser — no installs, no hassle.',
    bullets: [
      'HD quality via getUserMedia API',
      'Countdown timers: 3s, 5s, or 10s',
      'Single shot or 2×2 grid mode',
      'Mirror effect for natural selfies',
      'Flash animation on capture',
    ],
  },
  {
    title: 'Beautiful Frames',
    img: 'https://picsum.photos/seed/feat2/600/400',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    desc: 'Six handcrafted frame styles transform your photo into a keepsake. Each frame is rendered pixel-perfectly using CSS and Canvas.',
    bullets: [
      'Classic White — clean & timeless',
      'Polaroid — nostalgic bottom label',
      'Vintage Sepia — warm aged look',
      'Neon Glow — teal light effect',
      'Film Strip — cinematic borders',
      'Elegant Maroon — bold & refined',
    ],
  },
  {
    title: 'Easy Download',
    img: 'https://picsum.photos/seed/feat3/600/400',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    desc: 'Your photos are composited in real-time using the HTML5 Canvas API and downloaded at full original resolution — zero quality loss.',
    bullets: [
      'Full resolution PNG output',
      'Canvas API compositing',
      'Frame applied before download',
      'Instant one-click download',
      'No watermarks, completely free',
    ],
  },
  {
    title: 'Personal Gallery',
    img: 'https://picsum.photos/seed/feat4/600/400',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    desc: 'Every photo you save is stored locally in your browser and organized into your personal gallery — accessible any time, fully private.',
    bullets: [
      'Saved to localStorage (private)',
      'Category tags: Nature, Portrait, Events, Fun',
      'Filter by category in gallery view',
      'Delete photos anytime',
      'Click to view full details & info',
    ],
  },
];

let featureModalInstance = null;
function openFeatureModal(idx) {
  const d = featureData[idx];
  document.getElementById('feat-modal-icon').innerHTML = d.icon;
  document.getElementById('feat-modal-title').textContent = d.title;
  document.getElementById('feat-modal-img').src = d.img;
  document.getElementById('feat-modal-desc').textContent = d.desc;
  const ul = document.getElementById('feat-modal-list');
  ul.innerHTML = d.bullets.map(b => `<li>${b}</li>`).join('');
  if (!featureModalInstance) {
    featureModalInstance = new bootstrap.Modal(document.getElementById('featureModal'));
  }
  featureModalInstance.show();
}
function closeFeatureModal() {
  if (featureModalInstance) featureModalInstance.hide();
}

// HOW IT WORKS POPOVERS
function toggleHowPopover(idx) {
  const all = document.querySelectorAll('.how-popover');
  all.forEach((p, i) => {
    if (i === idx) { p.classList.toggle('open'); }
    else { p.classList.remove('open'); }
  });
}
document.addEventListener('click', e => {
  if (!e.target.closest('.how-icon-clickable')) {
    document.querySelectorAll('.how-popover').forEach(p => p.classList.remove('open'));
  }
});

// FAQ
const faqs = [
  {q:"How does the photo booth work?",a:"Simply click \"Take Photo\" to open the camera. Allow webcam access, set your preferred timer and layout, then strike a pose! After capturing, choose a frame, preview it, and download or save to your gallery."},
  {q:"Do I need to install anything?",a:"No installation required! Our photo booth runs entirely in your browser using your device's webcam. It works on desktop and mobile devices with a modern browser."},
  {q:"Can I take multiple photos in one frame?",a:"Yes! Use the 2×2 Grid mode in the camera settings. It will capture 4 photos sequentially with your chosen timer, then composite them into a single image."},
  {q:"How do I save photos to the gallery?",a:"After selecting a frame, click \"Save to Gallery\" and choose a category (Nature, Portrait, Events, or Fun). Your photo will be stored locally and appear in the Gallery page."},
  {q:"Are my photos stored securely?",a:"All photos are stored locally in your browser's localStorage. Nothing is uploaded to any server — your photos stay on your device and are completely private."},
  {q:"What frame options are available?",a:"We offer 6 frame styles: Classic White, Polaroid, Vintage Sepia, Neon Glow, Film Strip, and Elegant Maroon. Each is rendered in real-time and applied to your downloaded image."},
];
(function buildFaq() {
  const list = document.getElementById('faq-list');
  faqs.forEach((faq,i)=>{
    const item = document.createElement('div'); item.className='faq-item';
    item.innerHTML=`<button class="faq-btn${i===0?' open':''}" id="faq-btn-${i}" onclick="toggleFaq(${i})"><span>${faq.q}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button><div class="faq-body${i===0?' open':''}" id="faq-body-${i}">${faq.a}</div>`;
    list.appendChild(item);
  });
})();
function toggleFaq(idx) {
  const btn=document.getElementById('faq-btn-'+idx), body=document.getElementById('faq-body-'+idx);
  const isOpen=body.classList.contains('open');
  faqs.forEach((_,i)=>{ document.getElementById('faq-btn-'+i).classList.remove('open'); document.getElementById('faq-body-'+i).classList.remove('open'); });
  if (!isOpen) { btn.classList.add('open'); body.classList.add('open'); }
}

// PLUGIN COMPONENTS
function pluginShowAlert() {
  document.getElementById('plugin-alert-wrap').innerHTML=`<div class="plugin-alert"><div class="plugin-alert-left"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><polyline points="20 6 9 17 4 12"/></svg> Success alert!</div><button class="plugin-alert-close" onclick="document.getElementById('plugin-alert-wrap').innerHTML='<button class=show-link onclick=pluginShowAlert()>Show Alert</button>'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`;
}
function toggleAccordion(idx) { document.getElementById('acc-btn-'+idx).classList.toggle('open'); document.getElementById('acc-'+idx).classList.toggle('open'); }
function togglePluginDropdown() { document.getElementById('plugin-dropdown').classList.toggle('open'); }
function closePluginDropdown() { document.getElementById('plugin-dropdown').classList.remove('open'); }
document.addEventListener('click', e => { if (!e.target.closest('.plugin-dropdown-wrap')) closePluginDropdown(); });
function openPluginModal()  { document.getElementById('plugin-modal-overlay').classList.add('open'); }
function closePluginModal() { document.getElementById('plugin-modal-overlay').classList.remove('open'); }
function openPluginOffcanvas()  { document.getElementById('plugin-offcanvas-overlay').classList.add('open'); document.getElementById('plugin-offcanvas').classList.add('open'); }
function closePluginOffcanvas() { document.getElementById('plugin-offcanvas-overlay').classList.remove('open'); document.getElementById('plugin-offcanvas').classList.remove('open'); }
function switchTab(idx) {
  ['Home','Profile','Contact'].forEach((_,i)=>{ document.getElementById('tab-btn-'+i).classList.toggle('active',i===idx); });
  document.getElementById('tab-content').textContent=`Content for ${['Home','Profile','Contact'][idx]} tab.`;
}
function showPluginToast() {
  const container=document.getElementById('plugin-toast-container');
  const el=document.createElement('div'); el.className='plugin-toast';
  el.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><div class="plugin-toast-body"><h5>Notification</h5><p>Action completed successfully!</p></div><button class="plugin-toast-close" onclick="this.parentElement.remove()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
  container.appendChild(el);
  setTimeout(()=>{ el.classList.add('hiding'); setTimeout(()=>el.remove(),300); }, 3000);
}

// TOAST
function showToast(msg, type='success') {
  const container=document.getElementById('toast-container');
  const el=document.createElement('div'); el.className=`toast-item ${type}`;
  const icon=type==='success'?`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  el.innerHTML=`<div class="toast-icon">${icon}</div><div class="toast-msg">${msg}</div><button class="toast-close" onclick="this.parentElement.remove()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
  container.appendChild(el);
  setTimeout(()=>el.remove(), 3000);
}

// ═══════════════════════════════════════════════
//  PHOTO BOOTH — 3-STEP FLOW
// ═══════════════════════════════════════════════

// LAYOUTS DEFINITION
const pbLayouts = [
  { id:'layout-a', name:'Layout A',    shots:3, tag:'TRY IT NOW',    aspect:0.6, desc:'Size 6x2 Strip\n(3 Pose)' },
  { id:'layout-b', name:'Layout B',    shots:4, tag:'TRY IT NOW',    aspect:0.6, desc:'Size 6x2 Strip\n(4 Pose)' },
  { id:'layout-c', name:'Hearts',      shots:4, tag:'NEW LAYOUT',    aspect:0.6, desc:'Size 6x2 Strip\n(4 Pose)' },
  { id:'layout-d', name:'Vintage',     shots:4, tag:'NEW LAYOUT',    aspect:0.6, desc:'Size 6x2 Strip\n(4 Pose)' },
  { id:'layout-e', name:'Solace',      shots:4, tag:'NEW LAYOUT',    aspect:0.6, desc:'Size 6x2 Strip\n(4 Pose)' },
  { id:'layout-f', name:'Classic',     shots:4, tag:'TRY IT NOW',    aspect:0.6, desc:'Size 6x2 Strip\n(4 Pose)' },
  { id:'layout-g', name:'With Love',   shots:4, tag:'TEMPLATE',      aspect:0.6, desc:'Size 6x2 Strip\n(4 Pose)' },
  { id:'layout-h', name:'Holiday',     shots:3, tag:'HOT',           aspect:0.6, desc:'Size 6x2 Strip\n(3 Pose)' },
  { id:'layout-i', name:'Aesthetic',   shots:4, tag:'NEW LAYOUT',    aspect:0.6, desc:'Size 6x2 Strip\n(4 Pose)' },
];

// CUSTOMIZE STATE
const pbState = {
  selectedLayout: null,
  capturedShots: [],
  frameColor: '#e8c5d8',
  photoShape: 'circle',
  selectedSticker: null,
  logoText: 'photobooth',
  layoutOffset: 0,
  isTakingShot: false,
};

// PLAIN FRAME COLORS
const pbColors = [
  '#ff69b4','#ffb6c1','#87ceeb','#fffacd','#90ee90','#dda0dd','#f5deb3','#800000','#ffffff','#000000',
  '#ff9999','#ffcc99','#99ff99','#99ccff','#cc99ff','#ff99cc','#ccff99','#99ffcc','#ffff99','#c0c0c0',
  '#ff6666','#ff9966','#66ff66','#6699ff','#9966ff','#ff6699','#99ff66','#66ffcc','#ffcc66','#808080',
  '#cc0000','#cc6600','#00cc00','#0066cc','#6600cc','#cc0066','#66cc00','#00ccaa','#ccaa00','#404040',
  '#990000','#995500','#009900','#004499','#440099','#990044','#449900','#009977','#997700','#202020',
];

// STICKERS (emoji)
const pbStickers = [
  null,
  '🐰','🍀','💋','💗','🎀','➕','🤍','🐱','✨','❄️',
  '⭐','🐥','🧸','💝','🦝','🐶','🐩','🦊','🐾','▼',
  '🎂','🐇','🍓','🌸','🦋','🌺','💚','🍵','👟','🍄',
  '💎','💐','🎃','🎅','🧝',
];

// ── INIT FLOW ──
function initCameraFlow() {
  pbState.capturedShots = [];
  pbState.selectedLayout = null;
  showStep('layout');
  buildLayoutPicker();
}

function showStep(step) {
  ['layout','capture','customize'].forEach(s => {
    const el = document.getElementById('step-'+s);
    if(el) el.style.display = s===step ? 'flex' : 'none';
  });
}

// ── STEP 1: LAYOUT PICKER ──
function buildLayoutPicker() {
  const track = document.getElementById('layouts-track');
  track.innerHTML = '';
  pbLayouts.forEach((layout, i) => {
    const card = document.createElement('div');
    card.className = 'pb-layout-card';
    card.dataset.idx = i;
    const slots = Array.from({length: layout.shots}, () =>
      `<div class="pb-layout-slot" style="height:${Math.round(88/layout.shots)-4}px;"></div>`
    ).join('');
    card.innerHTML = `
      <div class="pb-layout-thumb">
        <div class="pb-layout-tag">${layout.tag}</div>
        <div class="pb-layout-thumb-inner">${slots}</div>
      </div>
      <div class="pb-layout-card-info">
        <div class="pb-layout-card-name">${layout.name}</div>
        <div class="pb-layout-card-sub">${layout.desc.replace('\n','<br>')}</div>
      </div>`;
    card.onclick = () => selectLayout(i);
    track.appendChild(card);
  });
  pbState.layoutOffset = 0;
  updateLayoutTrack();
}

function selectLayout(idx) {
  document.querySelectorAll('.pb-layout-card').forEach((c,i) => c.classList.toggle('selected', i===idx));
  pbState.selectedLayout = pbLayouts[idx];
  pbState.capturedShots = [];
  setTimeout(() => startCaptureStep(), 250);
}

let layoutCardsVisible = 5;
function updateLayoutTrack() {
  const track = document.getElementById('layouts-track');
  const cardW = 160;
  track.style.transform = `translateX(-${pbState.layoutOffset * cardW}px)`;
}
function layoutCarouselNext() {
  const max = Math.max(0, pbLayouts.length - layoutCardsVisible);
  if(pbState.layoutOffset < max) { pbState.layoutOffset++; updateLayoutTrack(); }
}
function layoutCarouselPrev() {
  if(pbState.layoutOffset > 0) { pbState.layoutOffset--; updateLayoutTrack(); }
}
function setTimerUI(btn, val) {
  document.querySelectorAll('.pb-timer-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.timerDuration = val;
}

// ── STEP 2: CAPTURE ──
function startCaptureStep() {
  if(!pbState.selectedLayout) return;
  pbState.capturedShots = [];
  pbState.isTakingShot = false;
  showStep('capture');
  document.getElementById('capture-layout-name').textContent = pbState.selectedLayout.name + ' — ' + pbState.selectedLayout.shots + ' shots';
  const hint = document.getElementById('pb-shot-hint');
  const proceed = document.getElementById('pb-proceed-btn');
  if(hint) { hint.style.display = 'block'; hint.textContent = 'Tap to take photo'; }
  if(proceed) proceed.style.display = 'none';
  buildFilmstrip();
  updateRemainingIndicator();
  startCamera();
}

function buildFilmstrip() {
  const slots = document.getElementById('pb-filmstrip-slots');
  slots.innerHTML = '';
  for(let i = 0; i < pbState.selectedLayout.shots; i++) {
    const slot = document.createElement('div');
    slot.className = 'pb-filmstrip-slot';
    slot.id = 'pb-slot-' + i;
    const num = document.createElement('span');
    num.className = 'pb-slot-num';
    num.textContent = i + 1;
    slot.appendChild(num);
    slots.appendChild(slot);
  }
}

function updateFilmstrip() {
  const shots = pbState.capturedShots;
  const total = pbState.selectedLayout.shots;
  for(let i = 0; i < total; i++) {
    const slot = document.getElementById('pb-slot-' + i);
    if(!slot) continue;
    if(shots[i]) {
      slot.innerHTML = '';
      slot.classList.add('filled');
      const img = document.createElement('img');
      img.src = shots[i];
      slot.appendChild(img);
      const del = document.createElement('button');
      del.className = 'pb-slot-delete';
      del.innerHTML = '✕';
      del.onclick = (e) => { e.stopPropagation(); deleteShot(i); };
      slot.appendChild(del);
    } else {
      slot.innerHTML = '';
      slot.classList.remove('filled');
      const num = document.createElement('span');
      num.className = 'pb-slot-num';
      num.textContent = i + 1;
      slot.appendChild(num);
    }
  }
  updateRemainingIndicator();
}

function deleteShot(idx) {
  pbState.capturedShots.splice(idx, 1);
  updateFilmstrip();
  if(pbState.capturedShots.length < pbState.selectedLayout.shots) {
    document.getElementById('shutter-btn').disabled = false;
  }
}

function updateRemainingIndicator() {
  const rem = document.getElementById('pb-filmstrip-remaining');
  const total = pbState.selectedLayout ? pbState.selectedLayout.shots : 0;
  const done = pbState.capturedShots.length;
  const left = total - done;
  if(left > 0) {
    rem.textContent = left + ' more\nphoto' + (left>1?'s':'') + ' needed';
  } else {
    rem.innerHTML = '✅ All done!\n<br>Tap below\nto proceed.';
  }
}

function goToLayoutPicker() {
  if(state.stream) { state.stream.getTracks().forEach(t=>t.stop()); state.stream=null; }
  pbState.capturedShots = [];
  pbState.selectedLayout = null;
  document.querySelectorAll('.pb-layout-card').forEach(c=>c.classList.remove('selected'));
  showStep('layout');
}
function goToCaptureStep() {
  if(state.stream) { state.stream.getTracks().forEach(t=>t.stop()); state.stream=null; }
  pbState.capturedShots = [];
  pbState.isTakingShot = false;
  if(!pbState.selectedLayout) { goToLayoutPicker(); return; }
  showStep('capture');
  buildFilmstrip();
  updateRemainingIndicator();
  const prog = document.getElementById('pb-capture-progress');
  if(prog) prog.style.display = 'none';
  const bar = document.getElementById('pb-progress-bar');
  if(bar) bar.style.width = '0%';
  const shutter = document.getElementById('shutter-btn');
  if(shutter) { shutter.disabled = false; shutter.style.opacity='1'; }
  startCamera();
}

// ── CAMERA ──
async function startCamera() {
  setCameraState('loading');
  try {
    const s = await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:720},facingMode:'user'}});
    state.stream = s;
    const video = document.getElementById('camera-video');
    video.srcObject = s;
    video.style.display = 'block';
    setCameraState('ready');
  } catch(err) { setCameraState('error','Unable to access camera. Please ensure permissions are granted.'); }
}
function setCameraState(s, msg='') {
  state.cameraState = s;
  const loading = document.getElementById('camera-loading');
  const error = document.getElementById('camera-error');
  if(loading) loading.style.display = s==='loading' ? 'flex' : 'none';
  if(error) error.style.display = s==='error' ? 'flex' : 'none';
  if(s==='error' && document.getElementById('camera-error-msg')) document.getElementById('camera-error-msg').textContent = msg;
  const shutter = document.getElementById('shutter-btn');
  if(shutter) shutter.disabled = (s==='loading'||s==='error');
}
function setTimer(v) { state.timerDuration = parseInt(v)||0; }

function takePicture() {
  if(pbState.isTakingShot) return;
  const total = pbState.selectedLayout ? pbState.selectedLayout.shots : 1;
  if(pbState.capturedShots.length >= total) {
    goToCustomize();
    return;
  }
  pbState.isTakingShot = true;
  document.getElementById('shutter-btn').disabled = true;
  if(state.timerDuration === 0) {
    captureOneShot();
  } else {
    let count = state.timerDuration;
    showCountdown(count);
    state.countdownTimer = setInterval(() => {
      count--;
      if(count > 0) { showCountdown(count); }
      else { clearInterval(state.countdownTimer); hideCountdown(); captureOneShot(); }
    }, 1000);
  }
}

function captureOneShot() {
  flashEffect();
  const video = document.getElementById('camera-video');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/png');
  pbState.capturedShots.push(dataUrl);
  updateFilmstrip();

  const total = pbState.selectedLayout.shots;
  const done = pbState.capturedShots.length;

  const prog = document.getElementById('pb-capture-progress');
  const bar = document.getElementById('pb-progress-bar');
  const txt = document.getElementById('pb-progress-text');
  prog.style.display = 'flex';
  bar.style.width = Math.round((done/total)*100)+'%';
  txt.textContent = done + ' / ' + total + ' photos';

  pbState.isTakingShot = false;

  if(done >= total) {
    document.getElementById('shutter-btn').disabled = true;
    const hint = document.getElementById('pb-shot-hint');
    const proceed = document.getElementById('pb-proceed-btn');
    if(hint) hint.style.display = 'none';
    if(proceed) proceed.style.display = 'block';
    showToast('🎉 All ' + total + ' photos taken! Customize your strip.', 'success');
  } else {
    document.getElementById('shutter-btn').disabled = false;
    const hint = document.getElementById('pb-shot-hint');
    if(hint) hint.textContent = (total - done) + ' photo' + (total-done>1?'s':'') + ' remaining';
  }
}

function flashEffect() { const f=document.getElementById('camera-flash'); f.classList.add('active'); setTimeout(()=>f.classList.remove('active'),500); }
function showCountdown(n) { const el=document.getElementById('camera-countdown'),num=document.getElementById('countdown-num'); el.classList.add('visible'); num.textContent=n; num.style.animation='none'; void num.offsetWidth; num.style.animation='scaleIn .3s ease'; }
function hideCountdown() { document.getElementById('camera-countdown').classList.remove('visible'); }

// ── STEP 3: CUSTOMIZE ──
function goToCustomize() {
  if(state.stream) { state.stream.getTracks().forEach(t=>t.stop()); state.stream=null; }
  showStep('customize');
  buildColorGrid();
  buildStickerGrid();
  resetSaveBtn();
  renderCustomizePreview();
}

function buildColorGrid() {
  const grid = document.getElementById('pb-color-grid');
  grid.innerHTML = '';
  pbColors.forEach((color, i) => {
    const sw = document.createElement('button');
    sw.className = 'pb-color-swatch' + (i===0?' active':'');
    sw.style.background = color;
    if(color==='#ffffff') sw.style.border = '2.5px solid #e0e0e0';
    sw.title = color;
    sw.onclick = () => {
      document.querySelectorAll('.pb-color-swatch').forEach(s=>s.classList.remove('active'));
      sw.classList.add('active');
      pbState.frameColor = color;
      renderCustomizePreview();
    };
    grid.appendChild(sw);
  });
  pbState.frameColor = pbColors[0];
}

function buildStickerGrid() {
  const grid = document.getElementById('pb-sticker-grid');
  grid.innerHTML = '';
  pbStickers.forEach((sticker, i) => {
    const btn = document.createElement('button');
    if(sticker === null) {
      btn.className = 'pb-sticker-btn pb-no-sticker active';
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>';
    } else {
      btn.className = 'pb-sticker-btn';
      btn.textContent = sticker;
    }
    btn.onclick = () => {
      document.querySelectorAll('.pb-sticker-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      pbState.selectedSticker = sticker;
      renderCustomizePreview();
    };
    grid.appendChild(btn);
  });
  pbState.selectedSticker = null;
}

function setPhotoShape(btn, shape) {
  document.querySelectorAll('.pb-shape-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  pbState.photoShape = shape;
  renderCustomizePreview();
}

function setLogo(btn, text) {
  document.querySelectorAll('.pb-logo-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  pbState.logoText = text;
  renderCustomizePreview();
}

// ── CANVAS RENDERER ──
function renderCustomizePreview() {
  const canvas = document.getElementById('pb-preview-canvas');
  if(!canvas || !pbState.capturedShots.length) return;
  const shots = pbState.capturedShots;
  const n = shots.length;
  const addDate = document.getElementById('chk-date') ? document.getElementById('chk-date').checked : false;
  const addTime = document.getElementById('chk-time') ? document.getElementById('chk-time').checked : false;

  const SW = 300, pad = 16, gap = 10;
  const photoW = SW - pad*2;
  const photoH = Math.round(photoW * 0.75);
  const bottomBar = 48;
  const SH = pad + n*(photoH+gap) - gap + bottomBar;

  canvas.width = SW; canvas.height = SH;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = pbState.frameColor;
  ctx.roundRect ? ctx.roundRect(0,0,SW,SH,12) : ctx.fillRect(0,0,SW,SH);
  ctx.fill();

  const loadImg = src => new Promise(r => { const i=new Image(); i.onload=()=>r(i); i.src=src; });
  Promise.all(shots.map(loadImg)).then(imgs => {
    imgs.forEach((img, idx) => {
      const x = pad, y = pad + idx*(photoH+gap);
      ctx.save();
      if(pbState.photoShape === 'circle') {
        ctx.beginPath();
        ctx.arc(x+photoW/2, y+photoH/2, Math.min(photoW,photoH)/2, 0, Math.PI*2);
        ctx.clip();
      } else if(pbState.photoShape === 'heart') {
        drawHeartClip(ctx, x+photoW/2, y+photoH/2, Math.min(photoW,photoH)/2);
        ctx.clip();
      } else if(pbState.photoShape === 'square') {
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x,y,photoW,photoH,8) : ctx.rect(x,y,photoW,photoH);
        ctx.clip();
      }
      ctx.drawImage(img, x, y, photoW, photoH);
      ctx.restore();
      if(pbState.selectedSticker) {
        ctx.font = `${Math.round(photoH*0.18)}px serif`;
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText(pbState.selectedSticker, x+photoW-6, y+photoH-4);
      }
    });

    const barY = SH - bottomBar;
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, barY, SW, bottomBar);

    if(pbState.logoText) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 13px Poppins, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(pbState.logoText, SW/2, barY+14);
    }

    if(addDate || addTime) {
      const now = new Date();
      const datePart = addDate ? now.toLocaleDateString('en-US',{year:'numeric',month:'2-digit',day:'2-digit'}) : '';
      const timePart = addTime ? now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : '';
      const dtStr = [datePart, timePart].filter(Boolean).join('  ');
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '10px Poppins, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(dtStr, SW/2, barY+32);
    }
  });
}

function drawHeartClip(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + r*0.3);
  ctx.bezierCurveTo(cx - r*1.2, cy - r*0.5, cx - r*1.5, cy + r*0.8, cx, cy + r*1.3);
  ctx.bezierCurveTo(cx + r*1.5, cy + r*0.8, cx + r*1.2, cy - r*0.5, cx, cy + r*0.3);
}

async function generateFinalImage() {
  const canvas = document.getElementById('pb-preview-canvas');
  if(!canvas) return null;
  return new Promise(resolve => {
    renderCustomizePreview();
    setTimeout(() => { resolve(canvas.toDataURL('image/png')); }, 300);
  });
}

async function downloadCustomized() {
  const btn = document.querySelector('.pb-dl-btn');
  if(btn){ btn.disabled=true; btn.textContent='Saving...'; }
  const dataUrl = await generateFinalImage();
  if(dataUrl) {
    const a = document.createElement('a');
    a.download = `photobooth-${Date.now()}.png`;
    a.href = dataUrl; a.click();
  }
  if(btn){ btn.disabled=false; btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download'; }
}

function resetSaveBtn() {
  const btn = document.getElementById('save-btn');
  if(!btn) return;
  btn.dataset.saved = 'false';
  btn.style.background = '';
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span id="save-btn-text">Save to Gallery</span><svg id="save-btn-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
}

function proceedToFrames() { goToCustomize(); }
function retakePhoto() { goToCaptureStep(); }
function initCameraPage() { initCameraFlow(); }
function toggleCategoryMenu() { document.getElementById('category-menu').classList.toggle('open'); }
document.addEventListener('click', e=>{ if(!e.target.closest('.category-dropdown'))document.getElementById('category-menu').classList.remove('open'); });

async function saveToGallery(category) {
  document.getElementById('category-menu').classList.remove('open');
  const btn=document.getElementById('save-btn');
  btn.innerHTML='<svg style="width:16px;height:16px;animation:spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>';
  let dataUrl = null;
  try {
    dataUrl = await generateFinalImage();
  } catch(e) {
    showToast('Failed to save image.','error');
    btn.dataset.saved='false';
    btn.style.background='linear-gradient(to right, var(--navy), var(--navy))';
    btn.innerHTML='<svg style="width:16px;height:16px;margin-right:8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span id="save-btn-text">Save to Gallery</span><svg id="save-btn-chevron" style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
    return;
  }
  if(dataUrl){
    state.gallery.unshift({id:Date.now().toString(),src:dataUrl,category,date:new Date().toISOString(),frameId:state.selectedFrame});
    saveGallery();
    showToast('📸 Photo saved to '+category+' gallery!','success');
    btn.dataset.saved='true';
    btn.style.background='#22c55e';
    btn.innerHTML='<svg style="width:16px;height:16px;margin-right:8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Saved to '+category+'!';
    document.getElementById('save-btn-chevron') && (document.getElementById('save-btn-chevron').style.display='none');
    setTimeout(()=>{
      btn.dataset.saved='false';
      btn.style.background='linear-gradient(to right, var(--navy), var(--navy))';
      btn.innerHTML='<svg style="width:16px;height:16px;margin-right:8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span id="save-btn-text">Save Again</span><svg id="save-btn-chevron" style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
    }, 2000);
  } else {
    showToast('Failed to save image.','error');
    btn.dataset.saved='false';
    btn.style.background='linear-gradient(to right, var(--navy), var(--navy))';
    btn.innerHTML='<svg style="width:16px;height:16px;margin-right:8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span id="save-btn-text">Save to Gallery</span><svg id="save-btn-chevron" style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
  }
}

// GALLERY PAGE
function renderGallery() {
  const categories = ['All','Nature','Portrait','Events','Fun'];
  const filtered = state.galleryCategory === 'All' ? state.gallery : state.gallery.filter(img => img.category === state.galleryCategory);
  const tabsEl = document.getElementById('gallery-tabs'); tabsEl.innerHTML = '';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `gallery-tab${state.galleryCategory === cat ? ' active' : ''}`;
    btn.textContent = cat;
    btn.onclick = () => { state.galleryCategory = cat; renderGallery(); };
    tabsEl.appendChild(btn);
  });
  const bento = document.getElementById('gallery-bento'); bento.innerHTML = '';
  state.lightboxImages = filtered;
  if (!filtered.length) {
    bento.innerHTML = `<div class="gallery-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><h3>No photos found</h3><p>There are no photos in the "${state.galleryCategory}" category yet.</p></div>`;
    return;
  }
  let i = 0, flip = false;
  while (i < filtered.length) {
    const row = document.createElement('div'); row.className = `bento-row${flip ? ' flip' : ''}`;
    const largeWrap = document.createElement('div'); largeWrap.style.cssText = 'flex:1;'; largeWrap.appendChild(makeGalleryCard(filtered[i], i, true)); row.appendChild(largeWrap);
    const smalls = []; for (let j = 1; j <= 4 && i + j < filtered.length; j++) smalls.push(i + j);
    if (smalls.length) {
      const smallGrid = document.createElement('div'); smallGrid.className = 'bento-smalls'; smallGrid.style.cssText = 'flex:1;';
      smalls.forEach(idx => smallGrid.appendChild(makeGalleryCard(filtered[idx], idx, false)));
      row.appendChild(smallGrid);
    }
    bento.appendChild(row);
    i += 1 + smalls.length;
    flip = !flip;
  }
}

function makeGalleryCard(img, idx, isLarge) {
  const div = document.createElement('div'); div.className = `gallery-card ${isLarge ? 'bento-large' : 'bento-small'}`;
  const isSaved = !img.id.startsWith('sample-');
  div.onclick = () => openLightbox(idx);
  div.innerHTML = `<img class="gallery-card-img" src="${img.src}" alt="Gallery ${idx+1}" loading="lazy"/><div class="gallery-card-badge">${img.category}</div>${isSaved ? `<div class="gallery-card-delete" id="del-${img.id}"><button class="gallery-delete-btn" onclick="showDeleteConfirm(event,'${img.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button></div>` : ''}<div class="gallery-hover-overlay"><div class="gallery-hover-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div></div>`;
  return div;
}

function showDeleteConfirm(e, id) {
  e.stopPropagation();
  const wrap = document.getElementById('del-'+id);
  if (!wrap) return;
  wrap.innerHTML = `<div class="gallery-confirm-delete" onclick="event.stopPropagation()"><span>Delete?</span><button class="gallery-confirm-yes" onclick="confirmDelete(event,'${id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:12px;height:12px;"><polyline points="20 6 9 17 4 12"/></svg></button><button class="gallery-confirm-no" onclick="cancelDelete(event,'${id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`;
}

function confirmDelete(e, id) {
  e.stopPropagation();
  state.gallery = state.gallery.filter(img => img.id !== id);
  saveGallery();
  showToast('🗑️ Photo deleted successfully', 'success');
  renderGallery();
}

function cancelDelete(e, id) {
  e.stopPropagation();
  renderGallery();
}

// LIGHTBOX
const frameNames = ['Classic White','Polaroid','Vintage Sepia','Neon Glow','Film Strip','Elegant Maroon'];

function openLightbox(idx) {
  state.lightboxIndex = idx;
  updateLightbox();
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.getElementById('lbd-confirm-delete').style.display = 'none';
}
function closeLightboxOutside(e) {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
}
function updateLightbox() {
  const imgs = state.lightboxImages;
  const idx = state.lightboxIndex;
  const img = imgs[idx];
  if (!img) return;

  document.getElementById('lightbox-img').src = img.src;
  document.getElementById('lightbox-counter').textContent = `${idx + 1} / ${imgs.length}`;
  document.getElementById('lbd-confirm-delete').style.display = 'none';

  document.getElementById('lbd-category').textContent = img.category || 'Uncategorized';
  document.getElementById('lbd-cat-text').textContent = img.category || '—';

  const frameName = (img.frameId !== null && img.frameId !== undefined) ? frameNames[img.frameId] : null;
  document.getElementById('lbd-frame-text').textContent = frameName || '—';
  const frameBadge = document.getElementById('lbd-frame-badge');
  if (frameName) { frameBadge.textContent = frameName; frameBadge.style.display = ''; }
  else { frameBadge.style.display = 'none'; }

  const isSaved = img.id && !img.id.startsWith('sample-');
  if (img.date) {
    const d = new Date(img.date);
    document.getElementById('lbd-date').textContent = d.toLocaleDateString('en-US', {weekday:'short', year:'numeric', month:'long', day:'numeric'});
    document.getElementById('lbd-time').textContent = d.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
  } else {
    document.getElementById('lbd-date').textContent = '—';
    document.getElementById('lbd-time').textContent = '—';
  }

  document.getElementById('lbd-source').textContent = isSaved ? 'Your Gallery' : 'Your Photo';
  document.getElementById('lbd-delete-btn').style.display = isSaved ? 'flex' : 'none';
}
function lightboxNext(e) {
  if (e) e.stopPropagation();
  state.lightboxIndex = (state.lightboxIndex + 1) % state.lightboxImages.length;
  updateLightbox();
}
function lightboxPrev(e) {
  if (e) e.stopPropagation();
  state.lightboxIndex = (state.lightboxIndex - 1 + state.lightboxImages.length) % state.lightboxImages.length;
  updateLightbox();
}
function lightboxDownload() {
  const img = state.lightboxImages[state.lightboxIndex];
  if (!img) return;
  const a = document.createElement('a');
  a.href = img.src;
  a.download = `photobooth-${img.category || 'photo'}-${Date.now()}.png`;
  a.click();
}
function lightboxDelete() {
  document.getElementById('lbd-confirm-delete').style.display = 'block';
}
function lightboxCancelDelete() {
  document.getElementById('lbd-confirm-delete').style.display = 'none';
}
function lightboxConfirmDelete() {
  const img = state.lightboxImages[state.lightboxIndex];
  if (!img) return;
  state.gallery = state.gallery.filter(g => g.id !== img.id);
  saveGallery();
  showToast('🗑️ Photo deleted successfully', 'success');
  closeLightbox();
  renderGallery();
}
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'ArrowRight') lightboxNext(e);
  if (e.key === 'ArrowLeft') lightboxPrev(e);
  if (e.key === 'Escape') closeLightbox();
});

// STARTUP
function startLandingAnimations(){ startStatsCounter(); }
document.getElementById('footer-year').textContent = new Date().getFullYear();

// ============================================================
// SCROLLSPY — with click-scroll guard
// ============================================================
const spySections = ['hero','features','how','faq','plugins-section','contact'];
const spyNavMap = {
  'hero':            'spy-home',
  'features':        'spy-features',
  'how':             'spy-how',
  'faq':             'spy-faq',
  'plugins-section': 'spy-faq',
  'contact':         'spy-contact'
};
const mobSpyMap = {
  'hero':            'mob-spy-hero',
  'features':        'mob-spy-features',
  'how':             'mob-spy-how',
  'faq':             'mob-spy-faq',
  'plugins-section': 'mob-spy-faq',
  'contact':         'mob-spy-contact'
};

// Maps section IDs to nav-link element IDs for the main navbar
const spyNavLinkMap = {
  'hero':            'nav-home',
  'features':        'nav-features',
  'how':             'nav-how',
  'faq':             'nav-faq',
  'plugins-section': 'nav-plugins',
  'contact':         'nav-contact',
};

function updateScrollspy() {
  // ← GUARD: if a nav link was just clicked, don't override it yet
  if (isClickScrolling) return;
  if (state.currentPage !== 'landing') return;

  let current = 'hero';
  spySections.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= 120) current = id;
  });

  // Update plugin card spy buttons
  document.querySelectorAll('.scrollspy-btn').forEach(btn => btn.classList.remove('active'));
  const activeKey = spyNavMap[current] || 'spy-home';
  const activeBtn = document.getElementById(activeKey);
  if (activeBtn) activeBtn.classList.add('active');

  // Update mobile spy buttons
  document.querySelectorAll('.mobile-spy-btn').forEach(btn => btn.classList.remove('active'));
  const mobKey = mobSpyMap[current];
  const mobBtn = document.getElementById(mobKey);
  if (mobBtn) mobBtn.classList.add('active');

  // ← NEW: update the main navbar links too
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active', 'scrollspy-active'));
  const navLinkId = spyNavLinkMap[current] || 'nav-home';
  const navLink = document.getElementById(navLinkId);
  if (navLink) navLink.classList.add('active');
}

window.addEventListener('scroll', updateScrollspy, { passive: true });

// scrollspyNav — scroll to section from plugin card buttons
function scrollspyNav(id) {
  if (state.currentPage !== 'landing') {
    navigate('landing');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
    return;
  }
  // Set active immediately and guard scrollspy
  setNavSectionActive(id);
  isClickScrolling = true;
  clearTimeout(clickScrollTimer);
  clickScrollTimer = setTimeout(() => { isClickScrolling = false; }, 1000);

  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}