/* ============================================================
   CONEXIÓN A FIREBASE (se usa en todas las páginas)
   Estos datos NO son contraseñas: es normal que sean públicos.
   La seguridad real está en las "Reglas" de Firebase
   (archivo database.rules.json) y en restringir la API key.
   ============================================================ */
const firebaseConfig = {
    apiKey:            "AIzaSyDCW3yXz62Ya7_TEyEvTL201cWm-jTy1zw",
    authDomain:        "pagina-93ac5.firebaseapp.com",
    databaseURL:       "https://pagina-93ac5-default-rtdb.firebaseio.com",
    projectId:         "pagina-93ac5",
    storageBucket:     "pagina-93ac5.firebasestorage.app",
    messagingSenderId: "1007694698216",
    appId:             "1:1007694698216:web:7d5fa9dd8a79d786e35b5d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
