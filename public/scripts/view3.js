//---------VISTA 3: ESFERA CELESTE------------------
function view3(animator, origin, PHI, LAMBDA){
	
	// Construir pedido para el animador
	var request = [];
	
	//------CIELO------------
	
	// Sphere
	request.push([
		'circle', 
		origin.x,
		origin.y, 
		1e2,
		'CYAN'
	]);
	
	// North
	request.push([
		'print', 
		"N",
		origin.x, 
		origin.y + 1e2,
		'CYAN'
	]);
	
	// South
	request.push([
		'print', 
		"S",
		origin.x, 
		origin.y - 1e2 - 10,
		'CYAN'
	]);
	
	// East
	request.push([
		'print', 
		"E",
		origin.x + 1e2, 
		origin.y,
		'CYAN'
	]);
	
	// West
	request.push([
		'print', 
		"W",
		origin.x - 1e2 - 10, 
		origin.y,
		'CYAN'
	]);
	
	//--------DATOS DEL PUNTO SOBRE LA SUPERFICIE--------
	
	// Coordenadas (deg)
	request.push([
		'print', 
		"Point coordinates of sun from " + Satellite.ctrl.name + 
		" -> lat: " + str( significant( rad_to_deg( PHI ), 3 ) ) + 
		"° lon: " + str( significant( rad_to_deg( LAMBDA ), 3 ) ) + "°",
		10, 
		height_p( 1 ) - 10,
		'WHITE'
	]);
	
	//--------DATOS DEL PUNTO MONITOREADO-----------
	
	// Pointing Coordinates of the sun from ctrl (rad)
	let p_q;
	if(Satellite.ctrl.orbit.r != undefined){
		p_q = pointing_coordiantes(
			Satellite.ctrl.orbit.r,
			{	// Sun
				x: 0,
				y: 0,
				z: 0
			},
			Satellite.ctrl.orbit.i,
			Satellite.ctrl.axial_tilt,
			Satellite.ctrl.orbit.upper_omega
		);
		
		// Right ascension
		request.push([
			'print', 
			"RA = " + str( p_q.alpha ) + " rad",
			10, 
			10,
			'WHITE'
		]);
		
		// Declination
		request.push([
			'print', 
			"D = " + str( p_q.delta ) + " rad",
			10,
			20,
			'WHITE'
		]);
	};
	
	// Hora sideral del meridiano cero (rad)
	request.push([
		'print', 
		"GST = " + str( Satellite.ctrl.GST ) + " rad",
		10, 
		30,
		'WHITE'
	]);
	
	// Sun position over location
	let sun_sky = celestial_sphere_pos(p_q.alpha, p_q.delta, LAMBDA, PHI, Satellite.ctrl.GST);
	request.push([
		'print', 
		"sun x = " + str( significant( sun_sky.x, 3 ) ) + 
		", sun y = " + str( significant( sun_sky.y, 3 ) ) + 
		", sun z = " + str( significant( sun_sky.z, 3 ) ),
		10, 
		40,
		'WHITE'
	]);
	let color;
	if(sun_sky.z > 0){
		color = 'YELLOW';
	}else{
		color = 'GREY'
	};
	
	// Sun
	request.push([
		'circle', 
		origin.x + sun_sky.x * 1e2,
		origin.y + sun_sky.y * 1e2, 
		2,
		color
	]);
	
	// North position over location
	let north_sky = celestial_sphere_pos(0, PI / 2, LAMBDA, PHI, Satellite.ctrl.GST);
	request.push([
		'print', 
		"north x = " + str( significant( north_sky.x, 3 ) ) + 
		", north y = " + str( significant( north_sky.y, 3 ) ) + 
		", north z = " + str( significant( north_sky.z, 3 ) ),
		10, 
		50,
		'WHITE'
	]);
	if(north_sky.z > 0){
		color = 'RED';
	}else{
		color = 'GREY'
	};
	
	// North
	request.push([
		'circle', 
		origin.x + north_sky.x * 1e2,
		origin.y + north_sky.y * 1e2, 
		1,
		color
	]);
	
	// South position over location
	let south_sky = celestial_sphere_pos(0, -PI / 2, LAMBDA, PHI, Satellite.ctrl.GST);
	request.push([
		'print', 
		"south x = " + str( significant( south_sky.x, 3 ) ) + 
		", south y = " + str( significant( south_sky.y, 3 ) ) + 
		", south z = " + str( significant( south_sky.z, 3 ) ),
		10, 
		60,
		'WHITE'
	]);
	if(south_sky.z > 0){
		color = 'RED';
	}else{
		color = 'GREY'
	};
	
	// South
	request.push([
		'circle', 
		origin.x + south_sky.x * 1e2,
		origin.y + south_sky.y * 1e2, 
		1,
		color
	]);
	
	// Local meridian of location from location
	let local_sky = celestial_sphere_pos(
		LST( Satellite.ctrl.GST, LAMBDA ),
		0,
		LAMBDA,
		PHI,
		Satellite.ctrl.GST
	);
	request.push([
		'print', 
		"local x = " + str( significant( local_sky.x, 3 ) ) + 
		", local y = " + str( significant( local_sky.y, 3 ) ) + 
		", local z = " + str( significant( local_sky.z, 3 ) ),
		10, 
		70,
		'WHITE'
	]);
	if(local_sky.z > 0){
		color = 'BLUE';
	}else{
		color = 'GREY'
	};
	
	// Local meridian
	request.push([
		'circle', 
		origin.x + local_sky.x * 1e2,
		origin.y + local_sky.y * 1e2, 
		1,
		color
	]);
	
	// East of location from location
	let east_sky = celestial_sphere_pos(
		LST( Satellite.ctrl.GST, LAMBDA ) - PI / 2,
		0,
		LAMBDA,
		PHI,
		Satellite.ctrl.GST
	);
	request.push([
		'print', 
		"east x = " + str( significant( east_sky.x, 3 ) ) + 
		", east y = " + str( significant( east_sky.y, 3 ) ) + 
		", east z = " + str( significant( east_sky.z, 3 ) ),
		10, 
		80,
		'WHITE'
	]);
	if(east_sky.z > 0){
		color = 'GREEN';
	}else{
		color = 'GREY'
	};
	
	// East
	request.push([
		'circle', 
		origin.x + east_sky.x * 1e2,
		origin.y + east_sky.y * 1e2, 
		1,
		color
	]);
	
	// Enviar pedido al animador
	animator.postMessage({
		type: 'request',
		req: request
	});
};
