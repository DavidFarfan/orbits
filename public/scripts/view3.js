//---------VISTA 3: ESFERA CELESTE------------------
class View3 extends View{
	constructor(){
		return;
	};
	
	static show(animator, origin, PHI, LAMBDA){
	
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
			" -> lat: " + str( significant( rad_to_deg( PHI ), 4 ) ) + 
			"° lon: " + str( significant( rad_to_deg( LAMBDA ), 4 ) ) + "°",
			10, 
			10,
			'WHITE'
		]);
		
		//--------DATOS DEL PUNTO MONITOREADO-----------
		
		// Pointing Coordinates of the sun from ctrl (rad)
		let p_q;
		if(Satellite.ctrl.orbit.perturbation != undefined){
			
			// Corregir si el nodo ascendente ha cambiado de dirección
			let u_omega = Satellite.ctrl.orbit.perturbation.upper_omega;
			let tilt = Satellite.ctrl.orbit.perturbation.axial_tilt;
			if(Satellite.ctrl.orbit.perturbation.negative_inclination){
				u_omega += PI;
				tilt *= -1;
			};
			p_q = pointing_coordiantes(
				Satellite.ctrl.orbit.r,
				{	// Sun
					x: 0,
					y: 0,
					z: 0
				},
				Satellite.ctrl.orbit.perturbation.i,
				tilt,
				u_omega
			);
			
			// Right ascension
			request.push([
				'print', 
				"RA = " + str( p_q.alpha ) + " rad",
				10, 
				20,
				'WHITE'
			]);
			
			// Declination
			request.push([
				'print', 
				"D = " + str( p_q.delta ) + " rad",
				10,
				30,
				'WHITE'
			]);
		};
		
		// Hora sideral del meridiano cero (rad)
		request.push([
			'print', 
			"GST = " + str( Satellite.ctrl.GST ) + " rad",
			10, 
			40,
			'WHITE'
		]);
		
		// Fecha (TT)
		let epoch = new Date('January 01, 2000 12:00:00 GMT+00:00');
		let date = new Date( s_to_ms( s_time ) + epoch.getTime() );
		request.push([
			'print', 
			"Date (TT) = " + str( date ),
			10, 
			50,
			'WHITE'
		]);
		
		// Hora universal coordinada
		let sun_sky = celestial_sphere_pos(p_q.alpha, p_q.delta, LAMBDA, PHI, Satellite.ctrl.GST);
		request.push([
			'print', 
			"Real UTC = " + hour_string( rad_to_h_m_s( sun_sky.hour ) ),
			10, 
			60,
			'WHITE'
		]);
		request.push([
			'print', 
			"sun x = " + str( significant( sun_sky.pos.x, 4 ) ) + 
			", sun y = " + str( significant( sun_sky.pos.y, 4 ) ) + 
			", sun z = " + str( significant( sun_sky.pos.z, 4 ) ),
			10, 
			70,
			'WHITE'
		]);
		let color;
		if(sun_sky.pos.z > 0){
			color = 'YELLOW';
		}else{
			color = 'GREY'
		};
		
		// Sun
		request.push([
			'circle', 
			origin.x + sun_sky.pos.x * 1e2,
			origin.y + sun_sky.pos.y * 1e2, 
			2,
			color
		]);
		
		// North position over location
		let north_sky = celestial_sphere_pos(0, PI / 2, LAMBDA, PHI, Satellite.ctrl.GST);
		request.push([
			'print', 
			"north x = " + str( significant( north_sky.pos.x, 4 ) ) + 
			", north y = " + str( significant( north_sky.pos.y, 4 ) ) + 
			", north z = " + str( significant( north_sky.pos.z, 4 ) ),
			10, 
			80,
			'WHITE'
		]);
		if(north_sky.pos.z > 0){
			color = 'RED';
		}else{
			color = 'GREY'
		};
		
		// North
		request.push([
			'circle', 
			origin.x + north_sky.pos.x * 1e2,
			origin.y + north_sky.pos.y * 1e2, 
			1,
			color
		]);
		
		// South position over location
		let south_sky = celestial_sphere_pos(0, -PI / 2, LAMBDA, PHI, Satellite.ctrl.GST);
		request.push([
			'print', 
			"south x = " + str( significant( south_sky.pos.x, 4 ) ) + 
			", south y = " + str( significant( south_sky.pos.y, 4 ) ) + 
			", south z = " + str( significant( south_sky.pos.z, 4 ) ),
			10, 
			90,
			'WHITE'
		]);
		if(south_sky.pos.z > 0){
			color = 'RED';
		}else{
			color = 'GREY'
		};
		
		// South
		request.push([
			'circle', 
			origin.x + south_sky.pos.x * 1e2,
			origin.y + south_sky.pos.y * 1e2, 
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
			"local x = " + str( significant( local_sky.pos.x, 4 ) ) + 
			", local y = " + str( significant( local_sky.pos.y, 4 ) ) + 
			", local z = " + str( significant( local_sky.pos.z, 4 ) ),
			10, 
			100,
			'WHITE'
		]);
		if(local_sky.pos.z > 0){
			color = 'BLUE';
		}else{
			color = 'GREY'
		};
		
		// Local meridian
		request.push([
			'circle', 
			origin.x + local_sky.pos.x * 1e2,
			origin.y + local_sky.pos.y * 1e2, 
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
			"east x = " + str( significant( east_sky.pos.x, 4 ) ) + 
			", east y = " + str( significant( east_sky.pos.y, 4 ) ) + 
			", east z = " + str( significant( east_sky.pos.z, 4 ) ),
			10, 
			110,
			'WHITE'
		]);
		if(east_sky.pos.z > 0){
			color = 'GREEN';
		}else{
			color = 'GREY'
		};
		
		// East
		request.push([
			'circle', 
			origin.x + east_sky.pos.x * 1e2,
			origin.y + east_sky.pos.y * 1e2, 
			1,
			color
		]);
		
		// Info. básica
		super.print_basic(request);
		
		// Enviar pedido al animador
		animator.postMessage({
			type: 'request',
			req: request
		});
	};
};
