//--------ÓRBITA------------
class Orbit{
	
	// Tipo de órbita
	set_type(E){
		if(E > 0){
			this.type = 'hyperbolic';
		}else if(E == 0){
			this.type = 'parabolic';
		}else{
			this.type = 'elliptic';
		};
	};
	
	// Sentido de la órbita
	set_clockwise(pos, vel){
		
		// Clockwise
		this.clockwise = rot_vec(
			pos,
			-angle_vec( vel ),
		).y < 0;
	};
	
	// Semi-latus rectum
	set_p(h){
		this.p = semi_latus_rectum(h);
	};
	
	// Semi-major axis
	set_a(E){
		this.a = semi_major_axis(E);
	};
	
	// Eccentricity
	set_e(E){
		this.e = eccentricity( E, this.p, this.a );
	};
	
	// Periapse
	set_rp(){
		this.rp = periapse( this.p, this.e );
	};
	
	// True anomaly inicial
	set_f0(r0, pos, alpha){
		let f0 = f_from_r( r0, this.p, this.e );
		
		// Corregir la true anomaly según el progreso
		this.f0 = f0 + ( alpha > PI / 2 ) * 2 * ( PI - f0 );
		
		// Orientación del periapse
		this.periapse = rot_vec(
			pos,
			
			// Corregir el periapse según el sentido 
			( 2 * !this.clockwise - 1 ) * this.f0,
			true
		);
		
		// Longitud del periapse
		this.periapse = {
			x: this.rp * this.periapse.x,
			y: this.rp * this.periapse.y,
		};
		
		// Orientación del semi-latus rectum
		this.semi_latus_rectum = rot_vec(
			this.periapse,
			
			// Corregir el Semi-latus rectum según el sentido 
			( 2 * this.clockwise - 1 ) * PI / 2,
			true
		);
		
		// Longitud del semi-latus rectum
		this.semi_latus_rectum = {
			x: this.p * this.semi_latus_rectum.x,
			y: this.p * this.semi_latus_rectum.y,
		};
	};
	
	// Tiempo inicial
	set_t0(){
		if(this.type == 'elliptic'){
			this.t0 = t_from_M(
				M_from_E(
					E_from_f(
						this.f0,
						this.e
					),
					this.e
				),
				this.e,
				this.T
			);
		}else{
			this.t0 = ht_from_M(
				M_from_H(
					H_from_f(
						this.f0,
						this.e
					),
					this.e
				),
				this.a,
				u
			);
		};
	};
	
	// Semi-minor/conjugate axis
	set_b(){
		if(this.type == 'elliptic'){
			this.b = semi_minor_axis( this.a, this.e );
		}else{
			this.b = semi_conjugate_axis( this.a, this.e );
		};
	};
	
	// Apoapse
	set_ra(){
		if(this.type == 'elliptic'){
			this.ra = apoapse( this.p, this.e );
		};
	};
	
	// Period
	set_T(){
		if(this.type == 'elliptic'){
			this.T = period( this.a );
		};
	};
	
	// Outgoing angle
	set_fo(){
		if(this.type != 'elliptic'){
			this.fo = outgoing_angle( this.e );
			
			// Descartar la trayectoria ficticia
			this.plot_inf_lim = - this.fo + 1e-2;
			this.plot_sup_lim = this.fo - 1e-2;
		}else{
			this.plot_inf_lim = 0;
			this.plot_sup_lim = 2 * PI;
		};
		
		// Curva
		this.curve = cartesian_from_polar_curve( curve(
			(f) => {
				return to_px( r_from_f( this.p, this.e, f) );
			},
			(f) => {
				return f;
			},
			this.plot_inf_lim,
			this.plot_sup_lim,
			.05
		));
	};
	
	// Turning angle
	set_delta_angle(){
		if(this.type != 'elliptic'){
			this.delta_angle = turning_angle( this.fo );
		};
	};
	
	// Excess velocity
	set_vx(){
		if(this.type != 'elliptic'){
			this.vx = excess_velocity( this.a );
		};
	};
	
	// Simulation point
	set_sim(ts){
		
		// Tiempo de órbita
		this.t = ts + this.t0;
		
		// Anomalías
		if(this.type != 'elliptic'){
			
			// Anomalía media
			this.M = M_from_ht( this.a, this.t );
		
			// Anomalía hiperbólica
			this.H = H_from_M( this.M, this.e, this.fo );
		
			// Anomalía verdadera
			this.f = f_from_H( this.H, this.e );
		}else{
			
			// Anomalía media
			this.M = M_from_t( this.T, this.t );
		
			// Anomalía excéntrica
			this.E = E_from_M( this.M, this.e );
		
			// Anomalía verdadera
			this.f = f_from_E( this.E, this.e );
		};
		
		// Corregir anomalías según el sentido
		if( !this.clockwise ){
			this.M *= -1;
			this.E *= -1;
			this.H *= -1;
			this.f *= -1;
		};
		
		// Radio simulado
		this.r = r_from_f( this.p, this.e, this.f );
		
		// Posición relativa cartesiana
		this.relative_pos = cartesian_from_polar_point([
			this.r,
			this.f
		]);
		
		// Posición respecto al centro de la órbita
		this.x = this.relative_pos[0] + this.e * this.a;
		this.y = this.relative_pos[1];
		
		// Posición absoluta cartesiana
		this.pos = rot_vec({
			x: this.relative_pos[0],
			y: this.relative_pos[1]
		}, angle_vec( this.periapse ) );
		
		// Velocidad simulada
		this.v = vis_viva( this.r, this.a );
		
		// Componentes relativos de la velocidad simulada
		this.relative_vel = tan_vel(
			this.a,
			this.b,
			this.x,
			this.y,
			this.v,
			this.type,
			this.clockwise
		);
		
		// Componentes absolutos de la velocidad simulada
		this.vel = rot_vec({
			x: this.relative_vel.x,
			y: this.relative_vel.y
		}, angle_vec( this.periapse ) );
		
		// Predicción
		this.sim = {
			pos: { x: this.pos.x, y: this.pos.y },
			vel: { x: this.vel.x, y: this.vel.y }
		};
	};
	
	// Dibujo de la órbita
	draw(request){
		
		// Periapse
		request.push([
			'line',
			to_px( center.x ),
			to_px( center.y ),
			to_px( center.x + this.periapse.x ),
			to_px( center.y + this.periapse.y ),
			'RED'
		]);
		
		// Semi-latus rectum
		request.push([
			'line',
			to_px( center.x ),
			to_px( center.y ),
			to_px( center.x + this.semi_latus_rectum.x ),
			to_px( center.y + this.semi_latus_rectum.y ),
			'RED'
		]);
		
		// Curva de la órbita
		request.push([
			'plot',
			this.curve,
			[ to_px( center.x ), to_px( center.y ) ],
			angle_vec( this.periapse ),
			'RED'
		]);
		
		// Posición simulada
		request.push([
			'line',
			to_px( center.x ),
			to_px( center.y ),
			to_px( center.x + this.sim.pos.x ),
			to_px( center.y + this.sim.pos.y ),
			'RED'
		]);
		
		// Velocidad simulada
		request.push([
			'line',
			to_px( center.x + this.sim.pos.x ),
			to_px( center.y + this.sim.pos.y ),
			
			// La longitud del vector velocidad se dibuja sin tener en cuenta la escala
			to_px( center.x + this.sim.pos.x ) + this.sim.vel.x * 1e1,
			to_px( center.y + this.sim.pos.y ) + this.sim.vel.y * 1e1,
			'MAGENTA'
		]);
	};
	
	// Variables de la órbita (a partir del satélite que la recorre)
	constructor(pos, vel, alpha, r, h, E){
		this.set_type(E);
		this.set_clockwise(pos, vel);
		this.set_p(h);
		this.set_a(E);
		this.set_e(E);
		this.set_rp();
		this.set_f0(r, pos, alpha);
		this.set_b();
		this.set_ra();
		this.set_T();
		this.set_fo();
		this.set_delta_angle();
		this.set_vx();
		this.set_t0();
	};
};

//--------SATÉLITE----------
class Satellite{
	
	// Lista de satélites
	static list = [];
	
	// Satélite controlado
	static ctrl = null;
	
	// Rutina de control manual
	static ctrl_rutine(){
		
		// Cambiar posisición del satélite controlado
		var pos = {
			x: to_km( mousePos.x ) - center.x,
			y: to_km( mousePos.y ) - center.y
		};
		
		// Cambiar velocidad del satélite controlado (no implementado)
		var vel = {
			x: Satellite.ctrl.vel.x,
			y: Satellite.ctrl.vel.y
		};
		
		// Iniciar una nueva simulación al cambiar las condiciones iniciales
		if(
			pos.x != Satellite.ctrl.pos.x || 
			pos.y != Satellite.ctrl.pos.y || 
			vel.x != Satellite.ctrl.vel.x || 
			vel.y != Satellite.ctrl.vel.y
		){
			Satellite.ctrl.pos_set(pos);
			Satellite.ctrl.vel_set(vel);
			Satellite.ctrl.physics();
			
			// Reiniciar tiempo de simulación
			ts0 = s_time;
		};
	};
	
	// Nombre del satélite
	name_set(name){
		this.name = name;
	};
	
	// Control manual sobre el satélite
	ctrl_set(ctrl){
		
		// Quitar el control sobre los demás satélites
		if(ctrl){
			Satellite.ctrl = this;
			Satellite.list.forEach(function(value, index, array){
				value.ctrl = false;
			});
		};
		
		// Dárselo/quitárselo al satélite indicado
		this.ctrl = ctrl;
	};
	
	// Posición absoluta
	pos_get(){
		return {
			x: center.x + this.pos.x,
			y: center.y + this.pos.y
		};
	};
	
	// Posición del satélite respecto al cuerpo celeste (km)
	pos_set(pos){
		this.pos = pos;
		this.r = norm_vec(this.pos);
	};
	
	// Velocidad del satélite (km/s)
	vel_set(vel){
		this.vel = vel;
		this.v = norm_vec(this.vel);
	};
	
	// Magnitudes físicas
	physics(){
		
		// Ángulo entre r y v
		this.alpha = angle_between( this.pos, this.vel );
		
		// Momento angular
		this.h = this.r * this.v * sin( this.alpha );
		
		// Energía de órbita
		this.E = ( 1 / 2 ) * pow( this.v, 2 ) - ( u / this.r );
		
		// Órbita
		this.orbit = new Orbit(
			this.pos,
			this.vel,
			this.alpha,
			this.r,
			this.h,
			this.E
		);
	};
	
	// Dibujar propiedades
	draw(request){
		
		// Órbita
		this.orbit.draw(request);
		
		// Control
		let color;
		if(this.ctrl){
			color = 'WHITE';
		}else{
			color = 'YELLOW';
		};
		
		// Posición absoluta
		request.push([
			'circle',
			to_px( this.pos_get().x ),
			to_px( this.pos_get().y ), 
			1,
			color
		]);
		
		// Vector r
		request.push([
			'line', 
			to_px( center.x ),
			to_px( center.y ),  
			to_px( this.pos_get().x ),
			to_px( this.pos_get().y ),
			color
		]);
		
		// Vector v
		request.push([
			'line',
			to_px( this.pos_get().x ),
			to_px( this.pos_get().y ),
			
			// La longitud del vector velocidad se dibuja sin tener en cuenta la escala
			to_px( this.pos_get().x ) + this.vel.x * 1e1,
			to_px( this.pos_get().y ) + this.vel.y * 1e1,
			color
		]);
		
		// Nombre
		request.push([
			'print', 
			this.name,
			to_px( this.pos_get().x ), 
			to_px( this.pos_get().y ) - 20,
			color
		]);
	};
	
	// Variables del satélite
	constructor(name, pos, vel, ctrl){
		this.name_set(name);
		this.ctrl_set(ctrl);
		this.pos_set(pos);
		this.vel_set(vel);
		this.physics();
		Satellite.list.push(this);
	};
};

//---------CONEXIÓN CON EL ANIMADOR------------

// Lienzo
const canvas = document.getElementById('view1');

// Se corre una instancia de Worker (hilo) con el código animador
const animator = new Worker("/scripts/animador.js");

// El lienzo puede transferir al Worker el control de su contexto.
// para eso, se lo tiene que enviar a través de un mensaje con un objeto Offscreen conteniéndolo.
const main_offscreen = canvas.transferControlToOffscreen();

// Enviar el contexto al animador
animator.postMessage({ type: 'context', canvas: main_offscreen }, [main_offscreen]);

//-------PARÁMETROS DE LA SIMULACIÓN-----------

// Parámetros para el control manual
var mousePos = { // Posicion del mouse
	x: width_p( .5 ),
	y: height_p( .5 )
};

// Parámetros para la simulación del tiempo
var u_time; // Reloj universal
var u_seconds; // Segundero universal
var l_time = 0; // Reloj local
var l_seconds = '0'; // Segundero local
var s_time = 0; // Tiempo absoluto simulado
var ts0 = 0; // Tiempo inicial de la simulación
var ts = 0; // Tiempo actual de la simulación
var frac = 60; // Fracción de segundo para el loop

// Parámetros de escala de la simulación
const s_scale = .05125 * er; // Escala del espacio (kilómetros por pixel de lienzo)
const t_scale = .2 * eday; // Escala del tiempo (Segundos simulados por segundo real)
const center = { // Punto de referencia (kilómetros)
	x: to_km( width_p( .5 ) ),
	y: to_km( height_p( .5 ) )
}

//--------UNIDADES DE SIMULACIÓN------------

// PORCENTAJE DE ANCHO DEL LIENZO
function width_p(p){
	return canvas.width * p;
};

// PORCENTAJE DE ALTO DEL LIENZO
function height_p(p){
	return canvas.height * p;
};

// CONVERSIÓN DE PIXELES A KILÓMETROS
function to_km(px){
	return s_scale * px;
};

// CONVERSIÓN DE KILÓMETROS A PIXELES
function to_px(x){
	return x / s_scale;
};

// CONVERSIÓN DE SEGUNDOS REALES A SEGUNDOS SIMULADOS
function to_sim_t(t){
	return t_scale * t;
};

// CONVERSIÓN DE SEGUNDOS SIMULADOS A SEGUNDOS REALES
function to_real_t(st){
	return st / t_scale;
};

//---------DRAW------------------
function draw(){
	
	// Construir pedido para el animador
	var request = [];
	
	//-------OBJETOS-----------------
	
	// Tierra
	var earth_radius = max( 1, to_px( er ) );
	request.push([
		'circle', 
		to_px( center.x ),
		to_px( center.y ), 
		earth_radius,
		'BLUE'
	]);
	
	// Satélites
	Satellite.list.forEach(function(value, index, array){
		value.draw(request);
	});
	
	//-------INFO. DE SIMULACIÓN-------------
	
	// Tiempo local transcurrido (s)
	request.push([
		'print', 
		"real elapsed = " + str( l_time ) + "s",
		10, 
		height_p( 1 ) - 10,
		'WHITE'
	]);
	
	// Tiempo absoluto simulado transcurrido (eday)
	request.push([
		'print', 
		"simul abs = " + str( to_eday( s_time ) ) + " eday",
		10, 
		height_p( 1 ) - 20,
		'WHITE'
	]);
	
	// Tiempo de simulación transcurrido (eday)
	request.push([
		'print', 
		"simul elapsed = " + str( to_eday( ts ) ) + " eday",
		10, 
		height_p( 1 ) - 30,
		'WHITE'
	]);
	
	// Tiempo de órbita (eday)
	request.push([
		'print', 
		"t = " + str( to_eday( Satellite.ctrl.orbit.t ) ) + " eday",
		10, 
		height_p( 1 ) - 40,
		'WHITE'
	]);
	
	// Anomalía media (rad)
	request.push([
		'print', 
		"M = " + str( Satellite.ctrl.orbit.M ) + " rad",
		10, 
		height_p( 1 ) - 50,
		'WHITE'
	]);
	
	if(Satellite.ctrl.orbit.type != 'elliptic'){
		
		// Anomalía hiperbólica (rad)
		request.push([
			'print', 
			"H = " + str( Satellite.ctrl.orbit.H ) + " rad",
			10, 
			height_p( 1 ) - 60,
			'WHITE'
		]);
	}else{
		
		// Anomalía excéntrica (rad)
		request.push([
			'print', 
			"E = " + str( Satellite.ctrl.orbit.E ) + " rad",
			10, 
			height_p( 1 ) - 60,
			'WHITE'
		]);
	};
	
	// Anomalía verdadera (rad)
	request.push([
		'print', 
		"f = " + str( Satellite.ctrl.orbit.f ) + " rad",
		10, 
		height_p( 1 ) - 70,
		'WHITE'
	]);
	
	// Radio simulado (er)
	request.push([
		'print', 
		"r = " + str( to_er( Satellite.ctrl.orbit.r ) ) + " er",
		10, 
		height_p( 1 ) - 80,
		'WHITE'
	]);
	
	// Posición simulada (er)
	request.push([
		'print', 
		"pos x = " + str( floor( to_er( Satellite.ctrl.orbit.sim.pos.x ) ) ) + 
		" er, pos y = " + str( floor( to_er( Satellite.ctrl.orbit.sim.pos.y ) ) ) + " er",
		10, 
		height_p( 1 ) - 90,
		'WHITE'
	]);
	
	// Velocidad simulada (km/s)
	request.push([
		'print', 
		"v = " + str( Satellite.ctrl.orbit.v ) + " km/s",
		10, 
		height_p( 1 ) - 100,
		'WHITE'
	]);
	
	// Vector velocidad simulada (km/s)
	request.push([
		'print', 
		"vel x = " + str( floor( Satellite.ctrl.orbit.sim.vel.x ) ) + 
		" km/s, vel y = " + str( floor( Satellite.ctrl.orbit.sim.vel.y ) ) + " km/s",
		10, 
		height_p( 1 ) - 110,
		'WHITE'
	]);
	
	//------INFO DEL SATÉLITE CONTROLADO----------
	
	// Origen de coordenadas (er)
	request.push([
		'print', 
		"center x = " + str( to_er( center.x ) ) + 
		" er, center y = " + str( to_er( center.y ) ) + " er",
		10, 
		10,
		'WHITE'
	]);
	
	// Posición relativa del satélite controlado (er)
	request.push([
		'print', 
		"pos x = " + str( floor( to_er( Satellite.ctrl.pos.x ) ) ) + 
		" er, pos y = " + str( floor( to_er( Satellite.ctrl.pos.y ) ) ) + " er",
		10, 
		20,
		'WHITE'
	]);
	
	// Distancia al origen (er)
	request.push([
		'print', 
		"radius = " + str( to_er( Satellite.ctrl.r ) ) + " er",
		10,
		30,
		'WHITE'
	]);
	
	// Componentes de velocidad del satélite controlado (km/s)
	request.push([
		'print', 
		"vel x = " + str( Satellite.ctrl.vel.x ) + 
		" km/s, vel y = " + str( Satellite.ctrl.vel.y ) + " km/s",
		10, 
		40,
		'WHITE'
	]);
	
	// Velocidad del satélite controlado (km/s)
	request.push([
		'print', 
		"velocity = " + str( Satellite.ctrl.v ) + " km/s",
		10,
		50,
		'WHITE'
	]);
	
	// Ángulo alpha (rad)
	request.push([
		'print', 
		"alpha = " + str( Satellite.ctrl.alpha ) + " rad",
		10, 
		60,
		'WHITE'
	]);
	
	// Momento angular
	request.push([
		'print', 
		"h = " + str( Satellite.ctrl.h ),
		10, 
		70,
		'WHITE'
	]);
	
	// Energía orbital
	request.push([
		'print', 
		"E = " + str( Satellite.ctrl.E ),
		10, 
		80,
		'WHITE'
	]);
	
	//--------INFO. DE LA ÓRBITA CONTROLADA----------
	
	// Tipo de órbita
	request.push([
		'print', 
		"type: " + Satellite.ctrl.orbit.type,
		width_p( .5 ), 
		height_p( 1 ) - 10,
		'WHITE'
	]);
	
	// Sentido (clockwise)
	request.push([
		'print', 
		"clockwise: " + Satellite.ctrl.orbit.clockwise,
		width_p( .5 ), 
		height_p( 1 ) - 20,
		'WHITE'
	]);
	
	// Semi-latus rectum (er)
	request.push([
		'print', 
		"p = " + str( to_er( Satellite.ctrl.orbit.p ) ) + " er",
		width_p( .5 ), 
		height_p( 1 ) - 30,
		'WHITE'
	]);
	
	// Semi-major axis (er)
	request.push([
		'print', 
		"a = " + str( to_er( Satellite.ctrl.orbit.a ) ) + " er",
		width_p( .5 ), 
		height_p( 1 ) - 40,
		'WHITE'
	]);
	
	// Semi-minor/conjugate axis (er)
	request.push([
		'print', 
		"b = " + str( to_er( Satellite.ctrl.orbit.b ) ) + " er",
		width_p( .5 ), 
		height_p( 1 ) - 50,
		'WHITE'
	]);
	
	// Eccentricity
	request.push([
		'print', 
		"e = " + str( Satellite.ctrl.orbit.e ),
		width_p( .5 ), 
		height_p( 1 ) - 60,
		'WHITE'
	]);
	
	// Periapse (er)
	request.push([
		'print',
		"rp = " + str( to_er( Satellite.ctrl.orbit.rp ) ) + " er",
		width_p( .5 ), 
		height_p( 1 ) - 70,
		'WHITE'
	]);
	
	// True anomaly inicial (rad)
	request.push([
		'print',
		"f0 = " + str( Satellite.ctrl.orbit.f0 ) + " rad",
		width_p( .5 ), 
		height_p( 1 ) - 80,
		'WHITE'
	]);
	
	// Tiempo inicial (eday)
	request.push([
		'print',
		"t0 = " + str( to_eday( Satellite.ctrl.orbit.t0 ) ) + " eday",
		width_p( .5 ), 
		height_p( 1 ) - 90,
		'WHITE'
	]);
	
	//--------INFO. ESPECÍFICA DEL TIPO DE ÓRBITA----------
	if(Satellite.ctrl.orbit.type == 'elliptic'){
	
		// Apoapse (er)
		request.push([
			'print', 
			"ra = " + str( to_er( Satellite.ctrl.orbit.ra ) ) + " er",
			width_p( .5 ), 
			height_p( 1 ) - 100,
			'WHITE'
		]);
	
		// Period (eday)
		request.push([
			'print',
			"T = " + str( to_eday( Satellite.ctrl.orbit.T ) ) + " eday",
			width_p( .5 ), 
			height_p( 1 ) - 110,
			'WHITE'
		]);
	
	}else{
		
		// Outgoing angle (rad)
		request.push([
			'print', 
			"outgoing = " + str( Satellite.ctrl.orbit.fo ) + " rad",
			width_p( .5 ), 
			height_p( 1 ) - 100,
			'WHITE'
		]);
		
		// Turning angle (rad)
		request.push([
			'print', 
			"turning = " + str( Satellite.ctrl.orbit.delta_angle ) + " rad",
			width_p( .5 ), 
			height_p( 1 ) - 110,
			'WHITE'
		]);
		
		// Excess velocity (km/s)
		request.push([
			'print', 
			"vx = " + str( Satellite.ctrl.orbit.vx ) + " km/s",
			width_p( .5 ), 
			height_p( 1 ) - 120,
			'WHITE'
		]);
	};
	
	// Enviar pedido al animador
	animator.postMessage({
		type: 'request',
		req: request
	});
};

//---------LOOP DE SIMULACIÓN------------
function orbitLoop(){
	
	//------------CONTEO DEL TIEMPO------------
	
	// Agregar la fracción de tiempo simulado que corresponde
	s_time += to_sim_t( 1 / frac );
	
	// Verificar el segundero del reloj universal
	u_time = Date.now().toString();
	u_seconds = u_time.substr(-4).charAt(0);
	
	// Hacer un ajuste cada segundo
	if(u_seconds != l_seconds){
		
		// El reloj local se sincroniza con el reloj universal
		l_time++;
		
		// El tiempo simulado se sincroniza con el reloj local
		s_time = to_sim_t( l_time );
		
		// El segundero local sincroniza con el segundero universal
		l_seconds = u_seconds;
	};
	
	// Calcular tiempo actual de simulación
	ts = s_time - ts0;
	
	//------------CONTROL MANUAL---------
	Satellite.ctrl_rutine();
	
	//------------SIMULACIÓN------------
	
	// Simular todas las trayectorias
	Satellite.list.forEach(function(value, index, array){
		value.orbit.set_sim(ts);
	});
	
	//------------DIBUJO EN PANTALLA-----------
	draw();
}

//------I/O-------------

//CAPTURA DE POSICIÓN DEL MOUSE
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

// Capturar posición del mouse ante cualquier movimiento
canvas.addEventListener('mousemove', evt => {
	mousePos = getMousePos(canvas, evt);
}, false);

// Reiniciar el juego con un click
canvas.addEventListener('click', () => {
	location.reload();
}, false);

//------OBJETOS A SIMULAR--------------

// Satélite ctrl
sat = new Satellite(
	'sat',
	{x: 0, y: 0},
	{x: 1, y: 2},
	true
);

// Satélite 1
sat1 = new Satellite(
	'sat1',
	{x: 20 * er, y: -10 * er},
	{x: 0, y: -1},
	false
);

// Comenzar loop del programa
setInterval(orbitLoop, s_to_ms( 1 / frac ) );