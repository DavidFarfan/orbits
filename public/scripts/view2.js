//---------VISTA 2: ELEMENTOS ORBITALES------------------
function view2(animator){
	
	// Construir pedido para el animador
	var request = [];
	
	//-------OBJETOS-----------------
	
	// Sol
	var sun_radius = max( 1, to_px( sunr ) );
	request.push([
		'circle', 
		to_px( center.y ),
		to_px( center.z ), 
		sun_radius,
		'YELLOW'
	]);
	
	// Satélites
	Satellite.list.forEach(function(value, index, array){
		value.view2(request);
	});
	
	//------EFEMÉRIDES----------------
	
	// Dibujar efemérides si está disponible
	if(ephemeris != null){
		ephemeris.forEach(function(value, index, array){
			
			// Posición absoluta
			request.push([
				'circle',
				to_px( center.y + value[1] ),
				to_px( center.z + value[2] ),
				1,
				'YELLOW'
			]);
			
			// Vector r
			request.push([
				'line', 
				to_px( center.y ),
				to_px( center.z ),  
				to_px( center.y + value[1] ),
				to_px( center.z + value[2] ),
				'YELLOW'
			]);
			
			// Vector v
			request.push([
				'line',
				to_px( center.y + value[1] ),
				to_px( center.z + value[2] ),
				
				// La longitud del vector se dibuja sin tener en cuenta la escala
				to_px( center.y + value[1] ) + value[4] * 1e0,
				to_px( center.z + value[2] ) + value[5] * 1e0,
				'YELLOW'
			]);
		});
	};
	
	//--------INFO. DE LA ÓRBITA CONTROLADA----------
	
	// Tipo de órbita
	request.push([
		'print', 
		"type: " + Satellite.ctrl.orbit.type,
		width_p( .5 ), 
		height_p( 1 ) - 10,
		'WHITE'
	]);
	
	// Componentes del nodo ascendente (er)
	request.push([
		'print', 
		"n x = " + str( floor( to_er( Satellite.ctrl.orbit.ascending_node.x ) ) ) + 
		" er, n y = " + str( floor( to_er( Satellite.ctrl.orbit.ascending_node.y ) ) ) + 
		" er, n z = " + str( floor( to_er( Satellite.ctrl.orbit.ascending_node.z ) ) ) + " er",
		width_p( .5 ), 
		height_p( 1 ) - 20,
		"GREEN"
	]);
	
	// Componentes del periapsis (er)
	request.push([
		'print', 
		"rp x = " + str( floor( to_er( Satellite.ctrl.orbit.periapse.x ) ) ) + 
		" er, rp y = " + str( floor( to_er( Satellite.ctrl.orbit.periapse.y ) ) ) + 
		" er, rp z = " + str( floor( to_er( Satellite.ctrl.orbit.periapse.z ) ) ) + " er",
		width_p( .5 ), 
		height_p( 1 ) - 30,
		"RED"
	]);
	
	// Componentes de la semi-altura recta (er)
	request.push([
		'print', 
		"p x = " + str( floor( to_er( Satellite.ctrl.orbit.semi_latus_rectum.x ) ) ) + 
		" er, p y = " + str( floor( to_er( Satellite.ctrl.orbit.semi_latus_rectum.y ) ) ) + 
		" er, p z = " + str( floor( to_er( Satellite.ctrl.orbit.semi_latus_rectum.z ) ) ) + " er",
		width_p( .5 ), 
		height_p( 1 ) - 40,
		"BLUE"
	]);
	
	// Ascending node (er)
	request.push([
		'print',
		"n = " + str( to_er( norm_vec( Satellite.ctrl.orbit.ascending_node ) ) ) + " er",
		width_p( .5 ), 
		height_p( 1 ) - 50,
		'GREEN'
	]);
	
	// Periapse (er)
	request.push([
		'print',
		"rp = " + str( to_er( Satellite.ctrl.orbit.rp ) ) + " er",
		width_p( .5 ), 
		height_p( 1 ) - 60,
		'RED'
	]);
	
	// Semi-latus rectum (er)
	request.push([
		'print', 
		"p = " + str( to_er( Satellite.ctrl.orbit.p ) ) + " er",
		width_p( .5 ), 
		height_p( 1 ) - 70,
		'BLUE'
	]);
	
	// Eccentricity (Scalar)
	request.push([
		'print', 
		"e = " + str( Satellite.ctrl.orbit.e ),
		width_p( .5 ), 
		height_p( 1 ) - 80,
		'WHITE'
	]);
	
	// Semi-major axis (er)
	request.push([
		'print', 
		"a = " + str( to_er( Satellite.ctrl.orbit.a ) ) + " er",
		width_p( .5 ), 
		height_p( 1 ) - 90,
		'WHITE'
	]);
	
	// Semi-minor/conjugate axis (er)
	request.push([
		'print', 
		"b = " + str( to_er( Satellite.ctrl.orbit.b ) ) + " er",
		width_p( .5 ), 
		height_p( 1 ) - 100,
		'WHITE'
	]);
	
	// Inclination (rad)
	request.push([
		'print', 
		"i = " + str( Satellite.ctrl.orbit.i ) + " rad",
		width_p( .5 ), 
		height_p( 1 ) - 110,
		'WHITE'
	]);
	
	// Longitude of ascending node (rad)
	request.push([
		'print', 
		"OMEGA = " + str( Satellite.ctrl.orbit.upper_omega ) + " rad",
		width_p( .5 ), 
		height_p( 1 ) - 120,
		'WHITE'
	]);
	
	// Argument of periapse (rad)
	request.push([
		'print', 
		"omega = " + str( Satellite.ctrl.orbit.omega ) + " rad",
		width_p( .5 ), 
		height_p( 1 ) - 130,
		'WHITE'
	]);
	
	// Initial true anomaly (rad)
	request.push([
		'print', 
		"f0 = " + str( Satellite.ctrl.orbit.f0 ) + " rad",
		width_p( .5 ), 
		height_p( 1 ) - 140,
		'WHITE'
	]);
	
	// Initial time (eday)
	request.push([
		'print', 
		"t0 = " + str( to_eday( Satellite.ctrl.orbit.t0 ) ) + " eday",
		width_p( .5 ), 
		height_p( 1 ) - 150,
		'WHITE'
	]);
	
	// Sense
	request.push([
		'print', 
		Satellite.ctrl.orbit.sense,
		width_p( .5 ), 
		height_p( 1 ) - 160,
		'WHITE'
	]);
	
	//--------INFO. ESPECÍFICA DEL TIPO DE ÓRBITA----------
	
	// Outgoing angle (rad)
	request.push([
		'print', 
		"outgoing = " + str( Satellite.ctrl.orbit.fo ) + " rad",
		width_p( .01 ), 
		height_p( 1 ) - 10,
		'WHITE'
	]);
	
	// Period (eday)
	request.push([
		'print', 
		"T = " + str( to_eday( Satellite.ctrl.orbit.T ) ) + " eday",
		width_p( .01 ), 
		height_p( 1 ) - 20,
		'WHITE'
	]);
	
	// Apoapse (er)
	request.push([
		'print', 
		"ra = " + str( to_er( Satellite.ctrl.orbit.ra ) ) + " er",
		width_p( .01 ), 
		height_p( 1 ) - 30,
		'WHITE'
	]);
	
	// Turning angle (rad)
	request.push([
		'print', 
		"turning = " + str( Satellite.ctrl.orbit.delta_angle ) + " rad",
		width_p( .01 ), 
		height_p( 1 ) - 40,
		'WHITE'
	]);
	
	// Excess velocity (km/s)
	request.push([
		'print', 
		"vx = " + str( Satellite.ctrl.orbit.vx ) + " km/s",
		width_p( .01 ), 
		height_p( 1 ) - 50,
		'WHITE'
	]);
	
	// Enviar pedido al animador
	animator.postMessage({
		type: 'request',
		req: request
	});
};
