//-----HERRAMIENTAS-------

var ctx = null; // Lienzo
var request = []; // Último pedido
const colors = { // Paleta
	WHITE: '#FFFFFF',
	BLACK: '#000000',
	RED: '#FF0000',
	GREEN: '#00FF00',
	BLUE: '#0000FF',
	YELLOW: '#FFFF00',
	MAGENTA: '#FF00FF',
	CYAN: '#00FFFF'
};

//-----DIBUJO------------

// BORRAR TODO EL LIENZO
function erase(){
	ctx.fillStyle = colors['BLACK'];
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// SEGMENTO
function line(x1, y1, x2, y2, c){
	ctx.strokeStyle = colors[c];
	ctx.beginPath();
	ctx.moveTo(Math.floor(x1), Math.floor(y1));
	ctx.lineTo(Math.floor(x2), Math.floor(y2));
	ctx.stroke();
}

// CURVA
function plot(points, center, angle, color){
	
	// Verificar que hay puntos
	if(points == null){
		return;
	};
	
	// Punto de inicio
	var start = points[0];
	
	// Punto final
	var end = [];
	
	// Rotar el lienzo
	ctx.save();
	ctx.translate(center[0], center[1]);
	ctx.rotate(angle);
	
	// Dibujar segmentos iterativamente
	for(var i=1; i<points.length; i++){
		
		// Calcular punto final
		end = points[i];
		
		// Trazar línea
		line(
			start[0],
			start[1],
			end[0],
			end[1],
			color
		);
		
		// Reasignar punto inicial
		start = end;
	};
	
	// Restaurar posición del lienzo
	ctx.restore();
};

// ELIPSE
function ellipse(cx, cy, rx, ry, c){
	ctx.strokeStyle = colors[c];
	ctx.fillStyle = colors[c];
	ctx.beginPath();
	ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
	ctx.stroke();
}

// TEXTO
function print(txt, x, y, c){
	ctx.font = "10px Arial";
	ctx.fillStyle = colors[c];
	ctx.fillText(txt, x, y);
}

//-----COMUNICACIÓN--------

// INSTRUCCIONES DE MAIN
self.onmessage = (e) => {
	switch (e.data.type) {
		
		// Recibir el lienzo
		case 'context':
			
			// Adoptar contexto
			ctx = e.data.canvas.getContext('2d');
			
			// Comenzar loop de animación
			animate();
			break;
		
		// Recibir un pedido
		case 'request':
			
			// Pedido en espera
			request = e.data.req;
			break;
	}
};

// LOOP DE ANIMACIÓN
function animate(){
	
	// Verificar que haya algún pedido
	if(request.length == 0){
		requestAnimationFrame(animate);
		return;
	};
	
	// Separar los ítems del pedido en espera
	let reqs = request.slice();
	
	// Limpiar canvas
	erase();
	
	// Resolver la lista de ítems
	reqs.forEach(function(value, index, array){
		solve(value);
	});
	
	// Enviar frame
	requestAnimationFrame(animate);
};

// RESOLVER UN ÍTEM
function solve(req){
	switch(req[0]){
		case 'plot':
			plot(req[1], req[2], req[3], req[4]);
		case 'line':
			line(req[1], req[2], req[3], req[4], req[5]);
			break;
		case 'circle':
			ellipse(req[1], req[2], req[3], req[3], req[4]);
			break;
		case 'ellipse':
			ellipse(req[1], req[2], req[3], req[4], req[5]);
			break;
		case 'print':
			print(req[1], req[2], req[3], req[4]);
			break;
	};
};