//------------------------ APP CON NODE, EJS Y EXPRESS -------------------

// Importar el módulo progre 'Express'
const express = require('express');
const app = express();

// Path para el manejo de direcciones
const path = require('path');

// Puerto 3000
app.set('port', 3000);

// Integrar el procesador HTML: EJS
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

// Establecer la ubicación de las vistas
app.set('views', path.join(__dirname, 'views'));

// Módulo para el manejo de las rutas
app.use(require('./routes/'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')))

// INICIO DE LA APP
app.listen(process.env.PORT || app.get('port'), () => {
	//console.log("<>Server ok");
});
