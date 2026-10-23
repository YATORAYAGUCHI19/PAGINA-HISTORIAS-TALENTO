/* Lógica de la página de inicio */

// Si alguien entra a index.html#submit, lo mandamos a historias.html#submit
if (window.location.hash === '#submit') {
    window.location.replace('historias.html#submit');
}

// Contador de historias del hero
db.ref('talento_stories').once('value')
    .then(snap => {
        const total = snap.numChildren();
        const el = document.getElementById('heroCount');
        if (!el) return;
        if (total === 0)      el.textContent = 'Sé el primero';
        else if (total === 1) el.textContent = '1 historia';
        else                  el.textContent = total + ' historias';
    })
    .catch(() => {
        const el = document.getElementById('heroCount');
        if (el) el.textContent = '—';
    });
