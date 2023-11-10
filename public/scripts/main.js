//--------- HILO PRINCIPAL ------------

// Se corre una instancia de Worker (hilo) con el código animador
const animator = new Worker("/scripts/animador.js");

// El canvas puede transferir al Worker el control de su contexto.
// para eso, se lo tiene que enviar a través de un mensaje con un objeto Offscreen conteniéndolo.
const canvas = document.getElementById('draw');
const main_offscreen = canvas.transferControlToOffscreen();

// Posicion del mouse
var mousePos = {
	x: .5 * canvas.width,
	y: .5 * canvas.height
};

// Capturar posición del mouse ante cualquier movimiento
canvas.addEventListener('mousemove', evt => {
	mousePos = getMousePos(canvas, evt);
}, false);

// Reiniciar el juego con un click
canvas.addEventListener('click', () => {
	location.reload();
}, false);

// Enviar al animador el contexto
animator.postMessage({ type: 'context', canvas: main_offscreen }, [main_offscreen]);
//console.log('> Contexto enviado al animador.');

// Argumentos para el conteo de tiempo
var time; // Reloj universal
var second; // Segundero universal
var seconds = 0; // Reloj local
var pre = '0'; // Segundero local
var s_seconds = 0; // Tiempo simulado
var frac = 60; // Fracción de segundo para el loop

// Parámetro gravitacional terrestre (kilómetros ^ 3 / segundo ^ 2)
const u = 3.986e5;

// Radio terrestre (kilómetros)
const re = 6.37812e3;

// Día terrestre (segundos)
const eday = 8.64e4;

// Escala del gráfico (kilómetros por pixel de lienzo)
const scale = .25 * re;

// Escala de tiempo (Segundos simulados por segundo real)
const t_scale = .1 * eday;

// Punto de referencia (kilómetros)
const center = {
	x: scale * canvas.width * .5,
	y: scale * canvas.height * .5
}

// Vector posición (kilómetros)
var pos = {
	x: 0,
	y: 0
};

// Anomalía real simulada
var s_f = 0;

// Radio simulado
var s_r = {
	x: 0,
	y: 0
};

// Radius (kilómetros)
var r = 0;

// Vector velocidad (kilómetros / segundo)
var vel = {
	x: -4,
	y: 0
};

// Velocity (kilómetros / segundo)
var v = 0;

// Angle between vel. and pos.
var alpha = 0;

// Angular momentum
var h = 0;

// Energy
var E = 0;

// Type
var type = '';

// contradicción con la ecuación polar
var contradiction = false;

// Semi-latus rectum
var p = 0;

// Vector eje vertical
var axis = null;

// Periapse
var rp = 0;

// True anomaly
var f = 0;

// Periapse vector
var rp_vec = null;

// Semi-latus vector
var p_vec = null;

// Semi-major axis
var a = 0;

// Eccentricity
var e = 0;

// Orbit
var orbit = null;

// Apoapse
var ra = 0;

// Excess velocity
var vx = 0;

// Period
var T = 0;

// Outgoing angle
var fo = 0;

// Turning angle
var delta_angle = 0;

// Comenzar loop del Juego
setInterval(orbitLoop, 1000 / frac);

//--------- LOOP DE SIMULACIÓN ------------
function orbitLoop(){
	
	// ------------ CONTEO DEL TIEMPO ------------
	
	// Agregar la fracción de tiempo simulado que corresponde
	s_seconds += t_scale / frac;
	
	// Verificar el segundero del reloj universal
	time = Date.now().toString();
	second = time.substr(-4).charAt(0);
	
	// Hacer un ajuste cada segundo
	if(second != pre){
		
		// El segundero local se sincroniza con el reloj universal
		seconds++;
		
		// El tiempo simulado se sincroniza con el reloj local
		s_seconds = t_scale * seconds;
		
		// Preparar el parámetro para el siguiente ajuste
		pre = second;
	};
	
	// ------------ CÁLCULO DE ÓRBITA ------------
	
	// Calcular posición del satélite
	pos = {
		x: scale * mousePos.x - center.x,
		y: scale * mousePos.y - center.y
	}
	
	// Calcular velocidad del satélite
	vel = {
		//x: 5e-2 * pos.x / scale,
		//y: 5e-2 * -pos.y / scale
		x: 1,
		y: 4
	}
	
	// Calcular radio
	r = hipo(pos.x, pos.y);
	
	// Calcular velocidad
	v = hipo(vel.x, vel.y);
	
	// Calcular ángulo entre la vel. y la pos.
	alpha = angle_between(pos, vel);
	
	// Calcular momento angular
	h = norm_vec(pos) * norm_vec(vel) * Math.sin(alpha);
	
	// Calcular energía de la órbita
	E = .5 * Math.pow(norm_vec(vel), 2) - ( u / r );
	
	// Calcular semi-latus rectum
	p = Math.pow(h, 2) / u;
	
	// Calcular semi-major axis, eccentricity y periapse
	if(E == 0){
		
		// Órbita parabólica
		a = Number. MAX_VALUE;
		e = 1;
	}else{
		
		// Orbita elíptica o hiperbólica
		a = - u / ( 2 * E );
		e = Math.sqrt( 1 - p / a );
	};
	
	// Calcular true anomaly
	if(e == 0){
		
		// Órbita circular
		f = 0;
	}else{
		var cos_f = ( 1 / e ) * ( p / r - 1 );
		if(cos_f > 1){
			f = 0;
		}else if(cos_f < -1){
			f = Math.PI;
		}else{
			f = Math.acos(cos_f);
		}
	}
	
	// Corregir true anomaly según el punto inicial de la trayectoria
	if( alpha > .5 * Math.PI ){
		f *= -1;
	}
	
	// Calcular vector eje vertical
	axis = rot_vec(
		pos,
		-angle_vec(vel),
		true
	);
	
	// Calcular periapse
	rp = p / (1 + e);
	
	// Corregir el vector periapse según el lado del eje en que está el satélite
	if( axis.y > 0 ){
		rp_vec = rot_vec(
			pos,
			f,
			true
		);
	}else{
		rp_vec = rot_vec(
			pos,
			-f,
			true
		);
	}
	
	// Calcular vector periapse
	rp_vec = {
		x: rp * rp_vec.x,
		y: rp * rp_vec.y,
	};
	
	// Corregir el vector semi-latus  según el lado del eje en que está el satélite
	if( axis.y < 0 ){
		p_vec = rot_vec(
			rp_vec,
			.5 * Math.PI,
			true
		);
	}else{
		p_vec = rot_vec(
			rp_vec,
			-.5 * Math.PI,
			true
		);
	}
	
	// Calcular vector semi-latus
	p_vec = {
		x: p * p_vec.x,
		y: p * p_vec.y
	};
	
	// Verificar el tipo de órbita
	if(E > 0){
		type = 'hyperbolic';
	}else if(E == 0){
		type = 'parabolic';
	}else{
		type = 'elliptic';
	}
	
	// Calcular Outoging angle
	fo = Math.acos( -1 / e );
	
	// Calcular turning angle
	delta_angle = 2 * fo - Math.PI;
	
	// Calcular apoapse
	ra = p / (1 - e);
		
	// Calcular excess velocity (Vis-viva relation)
	vx = Math.sqrt( - u / a );
	
	// Calcular period (Kepler's third law)
	T = 2 * Math.PI * Math.sqrt( Math.pow( a, 3 ) / u );
	
	// Calcular anomalía real simulada (Media vuelta por día terrestre)
	s_f = Math.PI * s_seconds / eday;
	
	// Calcular radio simulado
	s_r = {
		r: orbital_r(p, e, s_f),
		theta: s_f
	};
	
	// -------------- DEBUG -----------------
	
	// Construir pedido para el animador
	var request = [];
	
	// Establecer límites de la gráfica
	var plot_inf_lim = 0;
	var plot_sup_lim = 2 * Math.PI;
	if(type == 'hyperbolic'){
		plot_inf_lim = - fo + 1e-2;
		plot_sup_lim = fo - 1e-2;
	};
	
	// Debug: Órbita
	orbit = cartesian_from_polar_curve(curve(
		(f) => {
			return orbital_r(p, e, f) / scale;
		},
		(f) => {
			return f;
		},
		plot_inf_lim,
		plot_sup_lim,
		.05
	));
	
	// Gráfica ajustada a la situación
	request.push([
		'plot',
		orbit,
		[center.x / scale, center.y / scale],
		angle_vec(rp_vec)
	]);
	
	// Debug: Tipo de órbita
	request.push([
		'debug', 
		type,
		10,
		100
	]);
	
	// Tierra
	var draw_radius = re / scale;
	if(draw_radius < 1){
		draw_radius = 1;
	};
	request.push([
		'ellipse', 
		center.x / scale,
		center.y / scale, 
		draw_radius,
		draw_radius
	]);
	
	// Satélite
	request.push([
		'circle',
		( center.x + pos.x ) / scale,
		( center.y + pos.y ) / scale, 
		1
	]);
	
	// Vector r
	request.push([
		'line', 
		center.x / scale,
		center.y / scale,  
		( center.x + pos.x ) / scale,
		( center.y + pos.y ) / scale
	]);
	
	// Vector v
	request.push([
		'line',
		( center.x + pos.x ) / scale,
		( center.y + pos.y ) / scale,
		
		// La longitud del vector velocidad se dibuja sin tener en cuenta la escala
		(( center.x + pos.x ) / scale ) + vel.x * 1e1,
		(( center.y + pos.y ) / scale ) + vel.y * 1e1
	]);
	
	// Vector periapse
	request.push([
		'line', 
		center.x / scale,
		center.y / scale,  
		( center.x + rp_vec.x ) / scale,
		( center.y + rp_vec.y ) / scale,
		true
	]);
	
	// Vector semi-latus rectum
	request.push([
		'line', 
		center.x / scale,
		center.y / scale,  
		( center.x + p_vec.x ) / scale,
		( center.y + p_vec.y ) / scale,
		true
	]);
	
	// Vector r simulado
	var cart_s_r = cartesian_from_polar_point([
		s_r.r,
		s_r.theta
	]);
	request.push([
		'line', 
		center.x / scale,
		center.y / scale,  
		( center.x + cart_s_r[0] ) / scale,
		( center.y + cart_s_r[1] ) / scale
	]);
	
	// Debug: Tiempo real transcurrido en segundos
	request.push([
		'debug', 
		"real elapsed = " + seconds.toString() + "s",
		10, 
		canvas.height - 10
	]);
	
	// Debug: Tiempo simulado transcurrido en días terrestres
	request.push([
		'debug', 
		"simul elapsed = " + (s_seconds / eday).toString() + " eday",
		10, 
		canvas.height - 20
	]);
	
	// Debug: Anomalía real simulada en radianes
	request.push([
		'debug', 
		"simul f = " + s_f.toString() + " rad",
		10, 
		canvas.height - 30
	]);
	
	// Debug: Radio simulado en radios terrestres
	request.push([
		'debug', 
		"simul r = " + ( s_r.r / re ).toString() + " er",
		10, 
		canvas.height - 40
	]);
	
	// Debug: Origen de coordenadas en radios terrestres
	request.push([
		'debug', 
		"center x = " + ( center.x / re ).toString() + 
		" er, center y = " + ( center.y / re ).toString() + " er",
		10, 
		10
	]);
	
	// Debug: Posición en radios terrestres
	request.push([
		'debug', 
		"pos x = " + ( pos.x / re ).toString() + 
		" er, pos y = " + ( pos.y / re ).toString() + " er",
		10, 
		20
	]);
	
	// Debug: Distancia en radios terrestres
	request.push([
		'debug', 
		"radius = " + ( r / re ).toString() + " er",
		10,
		30
	]);
	
	// Debug: Velocidad en kilómetros / segundo
	request.push([
		'debug', 
		"vel x = " + vel.x.toString() + 
		" km/s, vel y = " + vel.y.toString() + " km/s",
		10, 
		40
	]);
	
	// Debug: Velocidad en kilómetros / segundo
	request.push([
		'debug', 
		"velocity = " + v.toString() + " km/s",
		10, 
		50
	]);
	
	// Debug: Ángulo alpha en radianes
	request.push([
		'debug', 
		"alpha = " + alpha.toString() + " rad",
		10, 
		60
	]);
	
	// Debug: Momento angular
	request.push([
		'debug', 
		"h = " + h.toString(),
		10, 
		70
	]);
	
	// Debug: Parámetro gravitacional en unidades SI
	request.push([
		'debug', 
		"u = " + u.toString() + " km3/s2",
		10, 
		80
	]);
	
	// Debug: Energía orbital
	request.push([
		'debug', 
		"energy = " + E.toString(),
		10, 
		90
	]);
	
	// Debug: Semi-latus rectum en radios terrestres
	request.push([
		'debug', 
		"p = " + ( p / re ).toString() + " er",
		canvas.width * .5, 
		canvas.height - 10
	]);
	
	// Debug: Semi-major axis en radios terrestres
	request.push([
		'debug', 
		"a = " + ( a / re ).toString() + " er",
		canvas.width * .5, 
		canvas.height - 20
	]);
	
	// Debug: Eccentricity
	request.push([
		'debug', 
		"e = " + e.toString(),
		canvas.width * .5, 
		canvas.height - 30
	]);
	
	// Debug: true anomaly en radianes
	request.push([
		'debug', 
		"f = " + f.toString() + " rad",
		canvas.width * .5, 
		canvas.height - 40
	]);
	
	// Debug: Periapse en radios terrestres
	request.push([
		'debug',
		"rp = " + ( rp / re ).toString() + " er",
		canvas.width * .5, 
		canvas.height - 50
	]);
	
	// Debug: Angulo del periapse con la horizontal en radianes
	request.push([
		'debug', 
		"alpha_rp = " + ( 2 * Math.PI - angle_vec( rp_vec ) ).toString() + " rad",
		canvas.width * .5, 
		canvas.height - 60
	]);
	
	// Debug: outgoing angle en radianes
	request.push([
		'debug', 
		"fo = " + fo.toString() + " rad",
		canvas.width * .5, 
		canvas.height - 70
	]);
	
	// Debug: turning angle en radianes
	request.push([
		'debug', 
		"delta_angle = " + delta_angle.toString() + " rad",
		canvas.width * .5, 
		canvas.height - 80
	]);
	
	// Debug: Apoapse en radios terrestres
	request.push([
		'debug', 
		"ra = " + ( ra / re ).toString() + " er",
		canvas.width * .5, 
		canvas.height - 90
	]);
	
	// Debug: Excess velocity en kilómetros / segundo
	request.push([
		'debug', 
		"vx = " + vx.toString() + " km/s",
		canvas.width * .5, 
		canvas.height - 100
	]);
	
	// Debug: Period en días terrestres
	request.push([
		'debug', 
		"T = " + ( T / eday ).toString() + " eday",
		canvas.width * .5, 
		canvas.height - 110
	]);
	
	// Enviar petición al animador
	animator.postMessage({ type: 'request', req: request});
}

// CAPTURA DE POSICIÓN DEL MOUSE
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(),root = document.documentElement;
	
	// return relative mouse position
    var mouseX = evt.clientX - rect.left - root.scrollLeft;
    var mouseY = evt.clientY - rect.top - root.scrollTop;
	
    return {
      x: mouseX,
      y: mouseY
    };
}
