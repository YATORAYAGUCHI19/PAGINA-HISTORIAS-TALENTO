/* ============================================================
   LÓGICA DE LA PÁGINA DE HISTORIAS
   ============================================================ */

const PAGE_SIZE       = 6;          // historias que se muestran por tanda
const MAX_PHOTO_CHARS = 1400000;    // tamaño máximo de la foto (debe ser menor al de las reglas de Firebase)
const storiesRef      = db.ref('talento_stories');

let allStories   = [];   // todas las historias descargadas
let filtered     = [];   // las que quedan después de filtrar/buscar
let visibleCount = 0;    // cuántas se están mostrando
let currentSort  = 'recent';
let photoBase64  = null; // foto elegida en el formulario
let toastTimer;

/* ─────────────  UTILIDADES  ───────────── */

/* Convierte texto "peligroso" en texto seguro para meterlo en HTML.
   Evita que alguien escriba <script> o comillas para romper la página. */
function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

/* Solo acepta fotos que sean realmente imágenes en base64 */
function safePhoto(photo) {
    return (typeof photo === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(photo)) ? photo : null;
}

function showToast(msg, type = 'ok') {
    const t   = document.getElementById('toast');
    const ico = type === 'ok' ? 'fa-check-circle' : 'fa-exclamation-circle';
    t.innerHTML = `<i class="fas ${ico}"></i> ${esc(msg)}`;
    t.className = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3600);
}

function formatDate(ts, month) {
    return ts ? new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month, year: 'numeric' }) : '';
}

/* Reduce la foto a máx. 1000px de ancho y la convierte a JPEG liviano */
function compressImage(file, maxW, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
        reader.onload = e => {
            const img = new Image();
            img.onerror = () => reject(new Error('Imagen no válida'));
            img.onload = () => {
                let w = img.width, h = img.height;
                if (w > maxW) { h = h * maxW / w; w = maxW; }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fff';            // fondo blanco por si el PNG es transparente
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/* ─────────────  CARGAR HISTORIAS  ───────────── */

function loadStories() {
    storiesRef.orderByChild('timestamp').once('value')
        .then(snap => {
            allStories = [];
            snap.forEach(child => { allStories.push({ id: child.key, ...child.val() }); });
            applyFilter();
        })
        .catch(err => {
            console.error(err);
            document.getElementById('headerCount').textContent = 'No se pudieron cargar las historias';
            showToast('Error de conexión. Recarga la página.', 'fail');
        });
}

/* ─────────────  FILTRO Y BÚSQUEDA  ───────────── */

function setFilter(type, btn) {
    currentSort = type;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilter();
}

function applyFilter() {
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    let list = [...allStories];

    list.sort((a, b) => currentSort === 'recent'
        ? (b.timestamp || 0) - (a.timestamp || 0)
        : (a.timestamp || 0) - (b.timestamp || 0));

    if (q) {
        list = list.filter(s =>
            (s.name   || '').toLowerCase().includes(q) ||
            (s.career || '').toLowerCase().includes(q));
    }

    filtered = list;

    const n = allStories.length;
    document.getElementById('headerCount').textContent =
        n + (n === 1 ? ' historia publicada' : ' historias publicadas');

    renderGrid(true);
}

/* ─────────────  DIBUJAR TARJETAS  ───────────── */

function renderGrid(reset) {
    const grid = document.getElementById('storiesGrid');
    if (reset) { grid.innerHTML = ''; visibleCount = 0; }

    if (filtered.length === 0) {
        const none = allStories.length === 0;
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-feather-alt"></i>
                <h3>${none ? 'Aún no hay historias' : 'Sin resultados'}</h3>
                <p>${none ? 'Sé el primero en compartir tu experiencia con la comunidad.'
                          : 'Intenta con otro nombre o programa.'}</p>
            </div>`;
        document.getElementById('storiesFooter').style.display = 'none';
        return;
    }

    const batch = filtered.slice(visibleCount, visibleCount + PAGE_SIZE);
    batch.forEach((story, i) => grid.appendChild(buildCard(story, i)));
    visibleCount += batch.length;

    document.getElementById('storiesFooter').style.display =
        visibleCount < filtered.length ? 'block' : 'none';

    const btn = document.getElementById('btnVerMas');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-plus-circle"></i> Ver más historias';
}

function buildCard(story, animIdx) {
    const card = document.createElement('article');
    card.className = 'story-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.style.animationDelay = animIdx * 0.07 + 's';
    card.addEventListener('click', () => openStory(story));
    card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openStory(story); }
    });

    const text    = story.story || '';
    const excerpt = text.substring(0, 175) + (text.length > 175 ? '…' : '');
    const photo   = safePhoto(story.photo);
    const name    = story.name || 'Estudiante';

    const photoHtml = photo
        ? `<img class="card-photo" src="${esc(photo)}" alt="Foto de ${esc(name)}" loading="lazy">`
        : `<div class="card-no-photo"><i class="fas fa-user"></i></div>`;

    card.innerHTML = `
        <div class="card-photo-wrap">
            ${photoHtml}
            <div class="card-photo-overlay">
                <span class="card-read-hint"><i class="fas fa-book-open"></i> Leer historia</span>
            </div>
            ${story.career ? `<span class="card-tag">${esc(story.career.split('·')[0].trim())}</span>` : ''}
        </div>
        <div class="card-body">
            <h3 class="card-name">${esc(name)}</h3>
            <div class="card-career">${esc(story.career || 'Unimagdalena')}</div>
            <p class="card-excerpt">${esc(excerpt)}</p>
            <div class="card-footer">
                <span class="card-date"><i class="fas fa-calendar-alt"></i> ${esc(formatDate(story.timestamp, 'short'))}</span>
                <span class="card-arrow"><i class="fas fa-arrow-right"></i></span>
            </div>
        </div>`;
    return card;
}

function loadMore() {
    const btn = document.getElementById('btnVerMas');
    btn.disabled = true;
    btn.innerHTML = '<div class="spin"></div> Cargando…';
    setTimeout(() => renderGrid(false), 280);
}

/* ─────────────  MODAL: LEER HISTORIA  ───────────── */

function openStory(story) {
    const name   = story.name || 'Estudiante';
    const career = story.career || 'Unimagdalena';
    const photo  = safePhoto(story.photo);

    const closeBtn = `<button class="modal-close-btn" onclick="closeStory()" aria-label="Cerrar"><i class="fas fa-times"></i></button>`;
    const nameBlock = `
        <div class="modal-name-block">
            <h2>${esc(name)}</h2>
            <p>${esc(career)}</p>
        </div>`;

    document.getElementById('modalMediaSection').innerHTML = photo
        ? `<div class="modal-photo-wrap">
               <img src="${esc(photo)}" alt="Foto de ${esc(name)}">
               <div class="modal-photo-gradient"></div>
               ${closeBtn}${nameBlock}
           </div>`
        : `<div class="modal-no-photo">
               <i class="fas fa-user"></i>
               ${closeBtn}${nameBlock}
           </div>`;

    const date = formatDate(story.timestamp, 'long');
    document.getElementById('modalChips').innerHTML = `
        <span class="chip chip-teal"><i class="fas fa-university"></i> Unimagdalena</span>
        ${date ? `<span class="chip chip-grey"><i class="fas fa-calendar"></i> ${esc(date)}</span>` : ''}
        <span class="chip chip-grey"><i class="fas fa-seedling"></i> Seminarios Proyecta 2026-1</span>`;

    document.getElementById('modalStory').textContent = story.story || '';

    document.getElementById('storyModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeStory() {
    document.getElementById('storyModal').classList.remove('open');
    document.body.style.overflow = '';
}

/* ─────────────  MODAL: ESCRIBIR HISTORIA  ───────────── */

function openSubmit() {
    document.getElementById('submitOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('iName').focus(), 100);
}

/* Cierra el formulario. Si ya escribiste algo, pregunta antes de borrar. */
function closeSubmit() {
    const hasContent = document.getElementById('iStory').value.trim() ||
                       document.getElementById('iName').value.trim();
    if (hasContent && !confirm('¿Descartar lo que escribiste?')) return;
    hideSubmit();
    resetForm();
}

function hideSubmit() {
    document.getElementById('submitOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function resetForm() {
    document.getElementById('iName').value   = '';
    document.getElementById('iCareer').value = '';
    document.getElementById('iStory').value  = '';
    document.getElementById('wordCount').textContent = '0 palabras';
    removePhoto();
}

function onPhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Solo se aceptan imágenes', 'fail'); return; }
    if (file.size > 4 * 1024 * 1024)    { showToast('La imagen supera 4 MB', 'fail'); return; }

    compressImage(file, 1000, 0.78)
        .then(b64 => {
            if (b64.length > MAX_PHOTO_CHARS) { showToast('La imagen es demasiado pesada', 'fail'); return; }
            photoBase64 = b64;
            document.getElementById('photoPreviewImg').src = b64;
            document.getElementById('photoPreview').style.display = 'block';
        })
        .catch(() => showToast('No se pudo procesar la imagen', 'fail'));
}

function removePhoto() {
    photoBase64 = null;
    document.getElementById('iPhoto').value = '';
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('photoPreviewImg').src = '';
}

async function submitStory() {
    const name   = document.getElementById('iName').value.trim();
    const career = document.getElementById('iCareer').value.trim();
    const story  = document.getElementById('iStory').value.trim();

    if (!name)  { showToast('Por favor escribe tu nombre', 'fail'); return; }
    if (!story) { showToast('Por favor escribe tu historia', 'fail'); return; }

    const btn = document.getElementById('btnSubmit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spin"></div> Publicando…';

    try {
        const payload = { name, career, story, timestamp: Date.now() };
        if (photoBase64) payload.photo = photoBase64;

        await storiesRef.push(payload);
        showToast('¡Historia publicada! Gracias por compartir ✨', 'ok');
        hideSubmit();
        resetForm();
        loadStories();
    } catch (err) {
        console.error(err);
        showToast('Error al publicar. Inténtalo de nuevo.', 'fail');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar historia';
    }
}

/* ─────────────  EVENTOS INICIALES  ───────────── */

document.getElementById('searchInput').addEventListener('input', applyFilter);

document.getElementById('iStory').addEventListener('input', e => {
    const words = e.target.value.trim().split(/\s+/).filter(Boolean).length;
    document.getElementById('wordCount').textContent = words + (words === 1 ? ' palabra' : ' palabras');
});

/* Clic fuera del modal de lectura = cerrar */
document.getElementById('storyModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeStory();
});

/* Tecla Escape */
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('storyModal').classList.contains('open')) closeStory();
    else if (document.getElementById('submitOverlay').classList.contains('open')) closeSubmit();
});

loadStories();

/* Si vienen desde el inicio con #submit, abre el formulario */
if (window.location.hash === '#submit') {
    setTimeout(openSubmit, 400);
    history.replaceState(null, '', window.location.pathname);
}
