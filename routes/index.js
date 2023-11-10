//--------------- GESTOR DE RUTAS -----------------

const router = require('express').Router();

// Ruta  principal
router.get('/', (req, res) => {
	res.render('index.html', {title: "MaikEvade"});
});

// Exportar objeto
module.exports = router;