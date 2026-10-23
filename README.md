# Historias que Inspiran

Plataforma web para compartir historias universitarias reales, creada en los **Seminarios Proyecta 2026-1** de Talento Magdalena – Universidad del Magdalena (Santa Marta, Colombia).

🔗 **Sitio en vivo:** https://YATORAYAGUCHI19.github.io/historias-que-inspiran/

## ✨ Características

- Publicar historias con nombre, programa, foto opcional y texto libre.
- Galería de tarjetas con búsqueda, orden por fecha y botón "Ver más".
- Lector de historias en ventana modal.
- Diseño responsive y accesible (teclado, `Esc` para cerrar).

## 🛠️ Tecnologías

HTML5 · CSS3 · JavaScript · [Firebase Realtime Database](https://firebase.google.com/docs/database) · Font Awesome · Google Fonts · GitHub Pages

## 📁 Estructura

```
historias-que-inspiran/
├── index.html              Página de inicio
├── historias.html          Galería y formulario
├── css/
│   ├── styles.css          Estilos compartidos
│   ├── index.css           Estilos del inicio
│   └── historias.css       Estilos de la galería
├── js/
│   ├── firebase-config.js  Conexión a Firebase
│   ├── index.js            Lógica del inicio
│   └── historias.js        Lógica de la galería
├── img/
│   └── logo.png            Logo del proyecto
├── database.rules.json     Reglas de seguridad de Firebase
└── README.md
```

## 🚀 Probar en tu computador

```bash
git clone https://github.com/TU-USUARIO/historias-que-inspiran.git
cd historias-que-inspiran
python -m http.server 8000
```
Abre http://localhost:8000

## 🔐 Seguridad

Los datos de `firebase-config.js` son públicos por diseño. La protección real son las reglas de `database.rules.json` (permiten leer y crear historias, pero no editarlas ni borrarlas, y validan cada campo) y la restricción de la API key por dominio en Google Cloud.

## 👥 Autor

Fran Javier Chacon Mejia

## 📄 Licencia

Proyecto académico © 2026. Todos los derechos reservados.
