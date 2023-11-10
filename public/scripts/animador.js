// Notificar la ejecución del código animador
//console.log('> Ejecución del código Worker.');

// Contexto del canvas
var ctx = null;

// Imagenes
var maik_img = null;
var nega_img = null;

// Rotaciones
var maik_rot = null;
var nega_rot = null;

// Pedidos
var requests = [];

// Argumentos para el dibujo
var drawCages = [];

// COMUNICACIÓN CON MAIN
self.onmessage = function(e) {
	switch (e.data.type) {
		
		// Recibir el contexto donde dibujar
		case 'context':
			
			// Almacenar
			ctx = e.data.canvas.getContext('2d');
			
			// Notificar operación
			//console.log('> Contexto recibido.');
			
			// Comenzar loop de animación
			animate();
			break;
		
		// Recibir imagen base
		case 'imagen_base':
			
			// Almacenar
			maik_img = e.data.bitmap;
			
			// Notificar operación
			//console.log('> Imagen base recibida.');
			break;
		
		// Recibir imagen nega
		case 'imagen_nega':
			
			// Almacenar
			nega_img = e.data.bitmap;
			
			// Notificar operación
			//console.log('> Imagen nega recibida.');
			break;
		
		// Recibir un pedido
		case 'request':
			
			// Almacenar
			requests = e.data.req;
			break;
	}
}

// FRAME DE ANIMACIÓN
function animate(){
	
	// Verificar que haya algún pedido
	if(requests == null){
		requestAnimationFrame(animate);
		return;
	}
	
	// Tomar el pedido más reciente
	const reqs = requests.slice();
	
	// Limpiar canvas
	erase();
	
	// Resolución del pedido
	drawCages = [];
	reqs.forEach(function(value, index, array){
		solve(value, drawCages);
	});
	
	// Imprimir frame
	requestAnimationFrame(animate);
}

// RESOLVER EL ÍTEM DE UN PEDIDO
function solve(req, drawcages){
	switch(req[0]){
		case 'maik':
			maik(req, drawcages, true);
			break;
		case 'nega':
			maik(req, drawcages, false);
			break;
		case 'plot':
			plot(req[1], req[2], req[3]);
		case 'line':
			linea(req[1], req[2], req[3], req[4], req[5]);
			break;
		case 'circle':
			circulo(req[1], req[2], req[3]);
			break;
		case 'ellipse':
			elipse(req[1], req[2], req[3], req[4]);
			break;
		case 'debug':
			debug(req[1], req[2], req[3]);
			break;
		case 'drawcage':
			ctx.fillStyle = 'green';
			ctx.fillRect(req[1], req[2], req[3], req[4]);
			break;
		case 'hitbox':
			ctx.fillStyle = 'red';
			ctx.fillRect(req[1], req[2], req[3], req[4]);
			break;
		case 'over': 
			game_over();
			break;
		case 'win': 
			win();
			break;
	}
	return;
}

// RESOLVER PETICIÓN DE UN JUGADOR/ENEMIGO
function maik(req, drawcages, player){
	
	// No dibujar aquello que está fuera de rango
	if(req[4].x > ctx.canvas.width || 
		req[4].y > ctx.canvas.height ||
		req[4].x + req[4].w < 0 ||
		req[4].y + req[4].h < 0){
		return;
	}
	
	// Comparar con la lista actual de drawCages
	var i = 0;
	var drawcage_diag = 0;
	for(; i<drawcages.length; i++){
		const c1x = req[4].x + 0.5 * req[4].w;
		const c1y = req[4].y + 0.5 * req[4].h;
		const c2x = drawcages[i].x + 0.5 * drawcages[i].w;
		const c2y = drawcages[i].y + 0.5 * drawcages[i].h;
		
		// Comparar distancia de los centros con el 30% del radio del objeto al que colisiona
		drawcage_diag = hipo(drawcages[i].w * .5, drawcages[i].h * .5) * .3;
		
		// Si la caja está oculta en cualquier otra, no dibujar
		if(distance(c1x, c1y, c2x, c2y) <= drawcage_diag){
			return;
		}
	}
	
	// Si la caja no está oculta en ninguna otra, dibujar y agregar a la lista
	if(i == drawcages.length){
		
		// Discernir entre jugador/enemigo
		if(player){
			paintRotation(maik_rot, req[1], req[2], req[3]);
		}else{
			paintRotation(nega_rot, req[1], req[2], req[3]);
		}
		drawcages.push(req[4]);
	}
}

// BORRAR TODO EL LIENZO
function erase(){
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// TRAZAR LINEA GENERAL
function linea(x1, y1, x2, y2, plot){
	ctx.strokeStyle = '#FFFFFF';
	if(plot){
		ctx.strokeStyle = '#FF0000';
	};
	ctx.beginPath();
	ctx.moveTo(Math.floor(x1), Math.floor(y1));
	ctx.lineTo(Math.floor(x2), Math.floor(y2));
	ctx.stroke();
}

// CURVA PARAMÉTRICA
function plot(points, center, angle){
	
	// Verificar que hay puntos
	if(points == null){
		return;
	}
	
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
		linea(
			start[0],
			start[1],
			end[0],
			end[1],
			true
		);
		
		// Reasignar punto inicial
		start = end;
	};
	
	// Restaurar posición del lienzo
	ctx.restore();
}

// TRAZAR UN CIRCULO
function circulo(cx, cy, r){
	ctx.fillStyle = '#FFFFFF';
	ctx.beginPath();
	ctx.arc(
		Math.floor(cx), 
		Math.floor(cy), 
		Math.floor(r), 
		0, 
		2 * Math.PI
	);
	ctx.fill();
}

// TRAZAR UNA ELIPSE
function elipse(cx, cy, b, a){
	ctx.strokeStyle = '#0000FF';
	ctx.beginPath();
	ctx.ellipse(cx, cy, b, a, 0, 0, 2 * Math.PI, false);
	ctx.stroke();
}

// GAME OVER
function game_over(){
	ctx.font = "bold 50px tahoma";
	ctx.fillStyle = '#111111';
	ctx.textAlign = "center";
	ctx.fillText('GAME OVER', .5 * ctx.canvas.width, .5 * ctx.canvas.height);
	ctx.font = "20px tahoma";
	ctx.fillText('<Click> to retry.', .5 * ctx.canvas.width, .55 * ctx.canvas.height);
}

// WIN
function win(){
	ctx.font = "bold 50px tahoma";
	ctx.fillStyle = '#111144';
	ctx.textAlign = "center";
	ctx.fillText('YOU WIN!', .5 * ctx.canvas.width, .5 * ctx.canvas.height);
	ctx.font = "20px tahoma";
	ctx.fillText('100 Enemies evaded! <Click> to retry.', .5 * ctx.canvas.width, .55 * ctx.canvas.height);
}

// DEBUG TEXTO
function debug(txt, x, y){
	ctx.font = "10px Arial";
	ctx.fillStyle = '#FFFFFF';
	ctx.fillText(txt, x, y);
}

// DIBUJAR UNA ROTACIÓN
function paintRotation(cuts, angle, x, y){
	
	// Calcular el recorte a mostrar
	const step = Math.floor( ( angle / (2 * Math.PI) ) * cuts.length );
	
	/*
	// Mostrar dimensiones del recorte
	ctx.fillStyle = '#000000';
	ctx.fillRect(
		Math.floor(x - .5 * cuts[step].width),
		Math.floor(y - .5 * cuts[step].height),
		cuts[step].width,
		cuts[step].height
	);
	*/
	
	// Dibujar recorte en el canvas principal
	ctx.drawImage(
		cuts[step],
		Math.floor(x - .5 * cuts[step].width),
		Math.floor(y - .5 * cuts[step].height)
	);
	
	/*
	// Mostrar centro
	ctx.fillStyle = '#FF0000';
	ctx.fillRect(
		x,
		y,
		2,
		2
	);
	*/
}

// CALCULAR HOJA DE ROTACIONES
function paintRotationSheet(img, steps){
	
	// Dimensiones de la hoja
	const dim_x = 1;
	const dim_y = steps;
	
	// Longitud de la diagonal de la imagen rectangular
	const diag = Math.sqrt(Math.pow(img.width, 2) + Math.pow(img.height, 2));
	
	// Se crea un canvas invisible y se obtiene su contexto para hacer operaciones
	const sheet_ctx = new OffscreenCanvas(
		Math.floor(dim_x * diag), 
		Math.floor(dim_y * diag)
	).getContext('2d');
	
	// Estilo para el debug
	sheet_ctx.strokeStyle = '#000000';
	sheet_ctx.font = "10px Arial";
	sheet_ctx.fillStyle = '#000000';
	
	// Dibujar posibles rotaciones
	const step = Math.floor(360 / (dim_x * dim_y));
	for(var i=0; i<dim_x; i++){
		for(var j=0; j<dim_y; j++){
			
			/*
			// Cuadrícula
			sheet_ctx.beginPath();
			sheet_ctx.rect(
				Math.floor(i * diag), 
				Math.floor(j * diag), 
				Math.floor(diag), 
				Math.floor(diag)
			);
			sheet_ctx.stroke();
			*/
			
			// Calcular ángulo de rotación
			const radians = (2 * Math.PI / 360) * (dim_y * i + j) * step;
			
			// Ajustar en la casilla que corresponde
			sheet_ctx.save();
			sheet_ctx.translate(
				Math.floor((i + .5) * diag),
				Math.floor((j + .5) * diag)
			);
			sheet_ctx.rotate(radians);
			
			/*
			// Mostrar transformación del canvas
			sheet_ctx.beginPath();
			sheet_ctx.rect(
				0, 
				0, 
				img.width, 
				img.height
			);
			sheet_ctx.stroke();
			*/
			
			// Corregir posición de los centros
			sheet_ctx.translate(
				Math.floor(-.5 * img.width),
				Math.floor(-.5 * img.height)
			);
			
			// Dibujar sprite de Maik (rotado)
			sheet_ctx.drawImage(
				img, 
				0, 
				0
			);
			
			// Debug
			//sheet_ctx.fillText(radians.toString(), 0, 0);
			
			// Olvidar última referencia
			sheet_ctx.restore();
		}
	}
	
	/*
	// Dibujar bordes de la hoja
	sheet_ctx.strokeStyle = '#FF0000';
	sheet_ctx.beginPath();
	sheet_ctx.rect(
		0, 
		0, 
		Math.floor(dim_x * diag), 
		Math.floor(dim_y * diag)
	);
	sheet_ctx.stroke();
	*/
	
	// Recortar el sheet
	var cuts = [];
	for(var i=0; i<steps; i++){
	
		// Canvas auxiliar
		const aux_canvas = new OffscreenCanvas(
			Math.floor(diag), 
			Math.floor(diag)
		).getContext('2d');
		
		// Recortar una rotación de la hoja
		aux_canvas.drawImage(
			sheet_ctx.canvas,
			0,
			Math.floor(i * diag),
			Math.floor(diag),
			Math.floor(diag),
			0,
			0,
			Math.floor(diag),
			Math.floor(diag)
		);
		
		// Acumular recortes
		createImageBitmap(aux_canvas.canvas).then(resolve => {
		
			/*
			// Dibujar las rotaciones en el canvas principal
			ctx.drawImage(
				resolve,
				0,
				0
			);
			*/
		
			// Almacenarlos en formato ImageBitmap
			cuts.push(resolve);
		});
	}
	
	// Devolver recortes de la hoja de rotaciones
	return cuts;
}

// DISTANCIA ENTRE DOS PUNTOS
function distance(x1, y1, x2, y2){
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

// HIPOTENUSA
function hipo(o, a){
	return distance(0, 0, o, a);
}