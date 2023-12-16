//---------VISTA 1: SATÉLITE Y SIMULACIÓN------------------
function view1(animator, ephemeris){
	
	// Construir pedido para el animador
	var request = [];
	
	//-------OBJETOS-----------------
	
	// Sol
	var sun_radius = max( 1, to_px( SUNR ) );
	request.push([
		'circle', 
		to_px( center.x ),
		to_px( center.y ), 
		sun_radius,
		'YELLOW'
	]);
	
	// Satélites
	Satellite.list.forEach(function(value, index, array){
		value.view1(request);
	});
	
	//------EFEMÉRIDES----------------
	
	// Dibujar efemérides si está disponible
	if(ephemeris != null){
		ephemeris.forEach(function(value, index, array){
			
			// Posición absoluta
			request.push([
				'circle',
				to_px( center.x + value[0] ),
				to_px( center.y + value[1] ),
				1,
				'YELLOW'
			]);
			
			// Vector r
			request.push([
				'line', 
				to_px( center.x ),
				to_px( center.y ),  
				to_px( center.x + value[0] ),
				to_px( center.y + value[1] ),
				'YELLOW'
			]);
			
			// Vector v
			request.push([
				'line',
				to_px( center.x + value[0] ),
				to_px( center.y + value[1] ),
				
				// La longitud del vector se dibuja sin tener en cuenta la escala
				to_px( center.x + value[0] ) + value[3] * 1e0,
				to_px( center.y + value[1] ) + value[4] * 1e0,
				'YELLOW'
			]);
			
			// Secuencia
			request.push([
				'print', 
				index,
				to_px( center.x + value[0] ) - 10, 
				to_px( center.y + value[1] ) + 10,
				'YELLOW'
			]);
		});
	};
	
	//------INFO DEL SATÉLITE CONTROLADO----------
	
	// Origen de coordenadas (er)
	request.push([
		'print', 
		"center x = " + str( floor( to_er( center.x ) ) ) + 
		" er, center y = " + str( floor( to_er( center.y ) ) ) + 
		" er, center z = " + str( floor( to_er( center.z ) ) ) + " er",
		10, 
		10,
		'WHITE'
	]);
	
	// Posición relativa del satélite controlado (er)
	request.push([
		'print', 
		"pos x = " + str( floor( to_er( Satellite.ctrl.pos.x ) ) ) + 
		" er, pos y = " + str( floor( to_er( Satellite.ctrl.pos.y ) ) ) +
		" er, pos z = " + str( floor( to_er( Satellite.ctrl.pos.z ) ) ) + " er",
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
		"vel x = " + str( floor( Satellite.ctrl.vel.x ) ) + 
		" km/s, vel y = " + str( floor( Satellite.ctrl.vel.y ) ) + 
		" km/s, vel z = " + str( floor( Satellite.ctrl.vel.z ) ) + " km/s",
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
	
	// Componentes del momento angular (km^2/s)
	request.push([
		'print', 
		"h x = " + str( floor( Satellite.ctrl.h_vec.x ) ) + 
		" km^2/s, h y = " + str( floor( Satellite.ctrl.h_vec.y ) ) + 
		" km^2/s, h z = " + str( floor( Satellite.ctrl.h_vec.z ) ) + " km^2/s",
		10, 
		70,
		"CYAN"
	]);
	
	// Momento angular (km^2/s)
	request.push([
		'print', 
		"h = " + str( Satellite.ctrl.h ) + " km^2/s",
		10, 
		80,
		"CYAN"
	]);
	
	// Energía orbital (km^2/s^2)
	request.push([
		'print', 
		"E = " + str( Satellite.ctrl.E ) + " km^2/s^2",
		10, 
		90,
		'WHITE'
	]);
	
	//-------INFO. DE SIMULACIÓN-------------
	
	// Sistema de coordenadas
	request.push([
		'print', 
		"coordinate system: SE in J2000",
		10, 
		height_p( 1 ) - 10,
		'WHITE'
	]);
	
	// Tiempo local transcurrido (s)
	request.push([
		'print', 
		"real elapsed = " + str( l_time ) + "s",
		10, 
		height_p( 1 ) - 20,
		'WHITE'
	]);
	
	// Tiempo absoluto simulado transcurrido (eday)
	request.push([
		'print', 
		"simul abs = " + str( to_eday( s_time ) ) + " eday",
		10, 
		height_p( 1 ) - 30,
		'WHITE'
	]);
	
	// Tiempo de simulación transcurrido (eday)
	request.push([
		'print', 
		"simul elapsed = " + str( to_eday( ts ) ) + " eday",
		10, 
		height_p( 1 ) - 40,
		'WHITE'
	]);
	
	// Tiempo de órbita (eday)
	request.push([
		'print', 
		"t = " + str( to_eday( Satellite.ctrl.orbit.t ) ) + " eday",
		10, 
		height_p( 1 ) - 50,
		'WHITE'
	]);
	
	// Parámetro gravitacional (km^3/s^2)
	request.push([
		'print', 
		"Gravity parameter = " + str( Satellite.u ) + " km^3/s^2",
		10, 
		height_p( 1 ) - 60,
		'WHITE'
	]);
	
	// Anomalía media (rad)
	request.push([
		'print', 
		"M = " + str( Satellite.ctrl.orbit.M ) + " rad",
		10, 
		height_p( 1 ) - 70,
		'WHITE'
	]);
	
	// Anomalía excéntrica (rad)
	request.push([
		'print', 
		"E = " + str( Satellite.ctrl.orbit.E ) + " rad",
		10, 
		height_p( 1 ) - 80,
		'WHITE'
	]);
	
	// Anomalía hiperbólica (rad)
	request.push([
		'print', 
		"H = " + str( Satellite.ctrl.orbit.H ) + " rad",
		10, 
		height_p( 1 ) - 90,
		'WHITE'
	]);
	
	// Anomalía verdadera (rad)
	request.push([
		'print', 
		"f = " + str( Satellite.ctrl.orbit.f ) + " rad",
		10, 
		height_p( 1 ) - 100,
		'WHITE'
	]);
	
	// Componentes del radio (er)
	request.push([
		'print', 
		"r x = " + str( significant( to_er( Satellite.ctrl.orbit.r.x ), 2 ) ) + 
		" er, r y = " + str( significant( to_er( Satellite.ctrl.orbit.r.y ), 2 ) ) + 
		" er, r z = " + str( significant( to_er( Satellite.ctrl.orbit.r.z ), 2 ) ) + " er",
		10, 
		height_p( 1 ) - 110,
		"WHITE"
	]);
	
	// Componentes de la velocidad (km/s)
	request.push([
		'print', 
		"v x = " + str( significant( Satellite.ctrl.orbit.v.x, 2 ) ) + 
		" km/s, v y = " + str( significant( Satellite.ctrl.orbit.v.y, 2 ) ) + 
		" km/s, v z = " + str( significant( Satellite.ctrl.orbit.v.z, 2 ) ) + " km/s",
		10, 
		height_p( 1 ) - 120,
		"WHITE"
	]);
	
	// Radio (er)
	request.push([
		'print',
		"r = " + str( to_er( norm_vec( Satellite.ctrl.orbit.r ) ) ) + " er",
		10, 
		height_p( 1 ) - 130,
		'WHITE'
	]);
	
	// velocidad (km/s)
	request.push([
		'print',
		"v = " + str( norm_vec( Satellite.ctrl.orbit.v ) ) + " km/s",
		10, 
		height_p( 1 ) - 140,
		'WHITE'
	]);
	
	// Enviar pedido al animador
	animator.postMessage({
		type: 'request',
		req: request
	});
};
