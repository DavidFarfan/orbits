//---------VISTA------------------------------------
class View{
	constructor(){
		return;
	};
	
	// Dibujar Efemérides en formato vector
	static draw_ephemeris(){
		
		// Seleccionar vista para las Efemérides
		let print_pos = center_body.get_print_pos();
		let coord1 = print_pos[c1];
		let coord2 = print_pos[c2];
		let eph_r_1 = null;
		let eph_r_2 = null;
		let eph_v_1 = null;
		let eph_v_2 = null;
		switch(view_page){
			
			// Planta
			case 1:
				eph_r_1 = 0;
				eph_r_2 = 1;
				eph_v_1 = 3;
				eph_v_2 = 4;
				break;
			
			// Elevación
			case 2:
				eph_r_1 = 1;
				eph_r_2 = 2;
				eph_v_1 = 4;
				eph_v_2 = 5;
				break;
			default:
				return;
		};
		
		// Pedido al animador
		if(ephemeris != null){
			ephemeris.forEach(function(value, index, array){
				
				// Posición absoluta
				request.push([
					'circle',
					to_px( coord1 + value[eph_r_1] ),
					to_px( coord2 + value[eph_r_2] ),
					1,
					'YELLOW'
				]);
				
				// Vector r
				request.push([
					'line', 
					to_px( coord1 ),
					to_px( coord2 ),  
					to_px( coord1 + value[eph_r_1] ),
					to_px( coord2 + value[eph_r_2] ),
					'YELLOW'
				]);
				
				// Vector v
				request.push([
					'line',
					to_px( coord1 + value[eph_r_1] ),
					to_px( coord2 + value[eph_r_2] ),
					
					// La longitud del vector se dibuja sin tener en cuenta la escala
					to_px( coord1 + value[eph_r_1] ) + value[eph_v_1] * 1e0,
					to_px( coord2 + value[eph_r_2] ) + value[eph_v_2] * 1e0,
					'YELLOW'
				]);
				
				// Secuencia
				request.push([
					'print', 
					index,
					to_px( coord1 + value[eph_r_1] ) - 10, 
					to_px( coord2 + value[eph_r_2] ) + 10,
					'YELLOW'
				]);
			});
		};
	};
	
	// Info. Básica de simulación
	static print_basic(){
		
		// Sistema de Coordenadas
		request.push([
			'print', 
			"SE J2000",
			10, 
			height_p( 1 ) - 10,
			'WHITE'
		]);
		
		// Lanzamiento (deg)
		request.push([
			'print', 
			"Launch Settings from " + Satellite.ctrl.name + 
			" -> RA: " + str( significant( rad_to_deg( sight_RA ), 4 ) ) + 
			" -> D: " + str( significant( rad_to_deg( sight_D ), 4 ) ) + 
			" -> lat: " + str( significant( rad_to_deg( PHI ), 4 ) ) + 
			"° lon: " + str( significant( rad_to_deg( LAMBDA ), 4 ) ) + "°",
			10, 
			height_p( 1 ) - 20,
			'WHITE'
		]);
		
		// Tiempo local transcurrido (s)
		request.push([
			'print', 
			"real elapsed (s) = " + str( significant( l_time, 4 ) ),
			10, 
			height_p( 1 ) - 30,
			'WHITE'
		]);
		
		// Tiempo de simulación absoluto (eday) y de órbita
		request.push([
			'print', 
			"simul time (eday) = " + str( significant( to_eday( s_time ), 4 ) ) +
			", orbit sim. time (eday) = " + str( significant( to_eday( Satellite.ctrl.orbit.t ), 4 ) ),
			10, 
			height_p( 1 ) - 40,
			'WHITE'
		]);
		
		// Fecha (TT) y Siglos desde el Epoch
		let date = new Date( s_to_ms( s_time ) + EPOCH_J2000.getTime() );
		request.push([
			'print', 
			"Date (TT) = " + str( date.toUTCString() ) +
			", dt (Cy) = " + str( significant( to_century( s_time ), 4 ) ),
			10, 
			height_p( 1 ) - 50,
			'WHITE'
		]);
		
		// Parámetro gravitacional del cuerpo orbitado (km^3/s^2)
		let GM = 0;
		if(Satellite.ctrl.orbited != null){
			GM = Satellite.ctrl.get_gravity();
		};
		request.push([
			'print', 
			"G (km^3/s^2) = " + str( significant( GM, 4 ) ),
			10, 
			height_p( 1 ) - 60,
			'WHITE'
		]);
		
		// Posición de la cámara (er)
		request.push([
			'print', 
			"cam_center (er) = [ "
				+ str( significant( to_er( center.x ), 4 ) ) + ", " 
				+ str( significant( to_er( center.y ), 4 ) ) + ", " 
				+ str( significant( to_er( center.z ), 4 ) ) 
			+ " ]",
			10, 
			height_p( 1 ) - 70,
			'WHITE'
		]);
	};
	
	// Info. de la esfera celeste
	static info_sphere(){
		
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
		
		// Posición en la esfera celeste
		let sphere_pos = Satellite.celestial_sphere();
		let color;
		if(sphere_pos.vec_r.x > 0){
			color = 'YELLOW';
		}else{
			color = 'RED';
		};
		request.push([
			'circle',
			origin.x + 1e2 * sphere_pos.vec_r.y,
			origin.y + 1e2 * sphere_pos.vec_r.z,
			3,
			color
		]);
		
		// Posición en la esfera celeste
		if(sphere_pos.vec_launch.x > 0){
			color = 'CYAN';
		}else{
			color = 'GREY';
		};
		request.push([
			'circle',
			origin.x + 1e2 * sphere_pos.vec_launch.y,
			origin.y + 1e2 * sphere_pos.vec_launch.z,
			3,
			color
		]);
		
		// Posición de la cámara (er)
		request.push([
			'print', 
			str( destin ) + " seen from " + str( depart ),
			10, 
			10,
			'WHITE'
		]);
	};
	
	// Impresión de las magnitudes
	static print_info(){
		
		// ---------- INFO. ESPECÍFICA DE LA PÁGINA ---------------
		switch(info_page){
			
			// Invariantes y anomalías
			case 0:
				View.print_0();
				break;
			
			// Elementos orbitales
			case 1:
				View.print_1();
				break;
			
			// Elementos orbitales
			case 2:
				View.print_2();
				break;
		};
	};
	
	// Página 0: Invariantes y anomalías
	static print_0(){
		
		// Posición del satélite controlado (er)
		request.push([
			'print', 
			"r (er) = [ "
				+ str( significant( to_er( Satellite.ctrl.pos.x ), 4 ) ) + ", "
				+ str( significant( to_er( Satellite.ctrl.pos.y ), 4 ) ) + ", "
				+ str( significant( to_er( Satellite.ctrl.pos.z ), 4 ) )
			+ " ], [ "
				+ str( significant( to_er( Satellite.ctrl.orbit.r.x ), 4 ) ) + ", "
				+ str( significant( to_er( Satellite.ctrl.orbit.r.y ), 4 ) ) + ", "
				+ str( significant( to_er( Satellite.ctrl.orbit.r.z ), 4 ) )
			+ " ]",
			10, 
			10,
			'WHITE'
		]);
		
		// Distancia al origen (er)
		request.push([
			'print', 
			"|| r || (er) = "
				+ str( significant( to_er( Satellite.ctrl.r ), 4 ) )
			+ ", "
				+ str( significant( to_er( norm_vec( Satellite.ctrl.orbit.r ) ), 4 ) ),
			10,
			20,
			'WHITE'
		]);
		
		// Componentes de velocidad del satélite controlado (km/s)
		request.push([
			'print', 
			"v (km/s) = [ "
				+ str( significant( Satellite.ctrl.vel.x, 4 ) ) + ", "
				+ str( significant( Satellite.ctrl.vel.y, 4 ) ) + ", "
				+ str( significant( Satellite.ctrl.vel.z, 4 ) )
			+ " ], [ "
				+ str( significant( Satellite.ctrl.orbit.v.x, 4 ) ) + ", "
				+ str( significant( Satellite.ctrl.orbit.v.y, 4 ) ) + ", "
				+ str( significant( Satellite.ctrl.orbit.v.z, 4 ) )
			+ " ]",
			10, 
			30,
			'WHITE'
		]);
		
		// Velocidad del satélite controlado (km/s)
		request.push([
			'print', 
			"|| v || (km/s) = "
				+ str( significant( Satellite.ctrl.v, 4 ) )
			+ ", "
				+ str( significant( norm_vec( Satellite.ctrl.orbit.v ), 4 ) ),
			10,
			40,
			'WHITE'
		]);
		
		// Componentes del momento angular (km^2/s)
		let h_sim = angular_momentum(
			Satellite.ctrl.orbit.r,
			Satellite.ctrl.orbit.v
		);
		request.push([
			'print', 
			"h (km^2/s) = [ "
				+ str( significant( Satellite.ctrl.h_vec.x, 4 ) ) + ", "
				+ str( significant( Satellite.ctrl.h_vec.y, 4 ) ) + ", "
				+ str( significant( Satellite.ctrl.h_vec.z, 4 ) )
			+ " ], [ "
				+ str( significant( h_sim.x, 4 ) ) + ", "
				+ str( significant( h_sim.y, 4 ) ) + ", "
				+ str( significant( h_sim.z, 4 ) )
			+ " ]",
			10, 
			50,
			'WHITE'
		]);
		
		// Momento angular (km^2/s)
		request.push([
			'print', 
			"|| h || (km^2/s) = "
				+ str( significant( Satellite.ctrl.h, 4 ) )
			+ ", "
				+ str( significant( norm_vec( h_sim ), 4 ) ),
			10,
			60,
			'WHITE'
		]);
		
		// Energía orbital (km^2/s^2)
		let E_sim = orbital_energy(
			norm_vec( Satellite.ctrl.orbit.v ),
			Satellite.ctrl.get_gravity(),
			norm_vec( Satellite.ctrl.orbit.r )
		);
		request.push([
			'print', 
			"E (km^2/s^2) = "
				+ str( significant( Satellite.ctrl.E, 4 ) ) + " ( "
				+ Satellite.ctrl.orbit.type
			+ " ), "
				+ str( significant( E_sim, 4 ) ) + " ( "
				+ Satellite.ctrl.orbit.perturbation.type
			+ " )",
			10,
			70,
			'WHITE'
		]);

		// Anomalía media (deg)
		request.push([
			'print', 
			"M (deg) = " + str( significant( rad_to_deg( Satellite.ctrl.orbit.M ), 4 ) ),
			10, 
			80,
			'WHITE'
		]);
		
		// Anomalía excéntrica (deg)
		request.push([
			'print', 
			"E (deg) = " + str( significant( rad_to_deg( Satellite.ctrl.orbit.E ), 4 ) ),
			10, 
			90,
			'WHITE'
		]);
		
		// Anomalía hiperbólica (deg)
		request.push([
			'print', 
			"H (deg) = " + str( significant( rad_to_deg( Satellite.ctrl.orbit.H ), 4 ) ),
			10, 
			100,
			'WHITE'
		]);
		
		// Anomalía verdadera (deg)
		request.push([
			'print', 
			"f (deg) = " + str( significant( rad_to_deg( Satellite.ctrl.orbit.f ), 4 ) ),
			10, 
			110,
			'WHITE'
		]);
		
		// phase
		if(Satellite.ctrl.phase != null){
			request.push([
				'print',
				"phase = " + str( Satellite.ctrl.phase ),
				10, 
				120,
				'WHITE'
			]);
		};
		
		// delta v (m/s)
		if(Satellite.ctrl.delta_v != null){
			request.push([
				'print',
				"delta v (km/s) = [ x: " + str( significant( Satellite.ctrl.delta_v.x, 4 ) ) + 
				", y: " + str( significant( Satellite.ctrl.delta_v.y, 4 ) ) + 
				", z: " + str( significant( Satellite.ctrl.delta_v.z, 4 ) ) + " ]",
				10, 
				130,
				'WHITE'
			]);
		};
		
		// delta v, magnitud (km/s)
		if(Satellite.ctrl.delta_v != null){
			request.push([
				'print',
				"|delta v| (km/s) = " + str( significant( norm_vec( Satellite.ctrl.delta_v ), 4 ) ),
				10, 
				140,
				'WHITE'
			]);
		};
		
		// prev v (km/s)
		if(Satellite.ctrl.prev_v != null){
			request.push([
				'print',
				"prev v (km/s) = [ x: " + str( significant( Satellite.ctrl.prev_v.x, 4 ) ) + 
				", y: " + str( significant( Satellite.ctrl.prev_v.y, 4 ) ) + 
				", z: " + str( significant( Satellite.ctrl.prev_v.z, 4 ) ) + " ]",
				10, 
				150,
				'WHITE'
			]);
		};
	};
	
	// Página 1: Elementos orbitales
	static print_1(){
		
		// Componentes del nodo ascendente (er)
		request.push([
			'print', 
			"n (er) = [ "
				+ str( significant( to_er( Satellite.ctrl.orbit.ascending_node.x ), 3 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.ascending_node.y ), 3 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.ascending_node.z ), 3 ) ) 
			+ " ], [ "
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.ascending_node.x ), 3 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.ascending_node.y ), 3 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.ascending_node.z ), 3 ) ) 
			+ " ]",
			10, 
			10,
			'GREEN'
		]);
		
		// Magnitud del nodo ascendente (er)
		request.push([
			'print', 
			"|| n || (er) = " +
				str(
					significant(
						to_er(
							norm_vec(
								Satellite.ctrl.orbit.ascending_node
							)
						),
						4
					)
				)
			+ ", " +
				str(
					significant(
						to_er(
							norm_vec(
								Satellite.ctrl.orbit.perturbation.ascending_node
							)
						),
						4
					)
				),
			10,
			20,
			'GREEN'
		]);
		
		// Componentes del periapsis (er)
		request.push([
			'print', 
			"rp (er) = [ "
				+ str( significant( to_er( Satellite.ctrl.orbit.periapse.x ), 4 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.periapse.y ), 4 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.periapse.z ), 4 ) ) 
			+ " ], [ "
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.periapse.x ), 4 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.periapse.y ), 4 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.periapse.z ), 4 ) ) 
			+ " ]",
			10, 
			30,
			'RED'
		]);
		
		// Magnitud el periapsis (er)
		request.push([
			'print', 
			"|| rp || (er) = " +
				str(
					significant(
						to_er(
							Satellite.ctrl.orbit.rp
						),
						4
					)
				)
			+ ", " +
				str(
					significant(
						to_er(
							Satellite.ctrl.orbit.perturbation.rp
						),
						4
					)
				),
			10,
			40,
			'RED'
		]);
		
		// Componentes del semi-latus rectum (er)
		request.push([
			'print', 
			"p (er) = [ "
				+ str( significant( to_er( Satellite.ctrl.orbit.semi_latus_rectum.x ), 4 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.semi_latus_rectum.y ), 4 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.semi_latus_rectum.z ), 4 ) ) 
			+ " ], [ "
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.semi_latus_rectum.x ), 4 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.semi_latus_rectum.y ), 4 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.semi_latus_rectum.z ), 4 ) ) 
			+ " ]",
			10, 
			50,
			'BLUE'
		]);
		
		// semi-latus rectum (er)
		request.push([
			'print', 
			"|| p || (er) = " +
				str(
					significant(
						to_er(
							Satellite.ctrl.orbit.p
						),
						4
					)
				)
			+ ", " +
				str(
					significant(
						to_er(
							Satellite.ctrl.orbit.perturbation.p
						),
						4
					)
				),
			10,
			60,
			'BLUE'
		]);
		
		// Eccentricity (adim)
		request.push([
			'print', 
			"e = "
				+ str( significant( Satellite.ctrl.orbit.e, 4 ) )
			+ ", "
				+ str( significant( Satellite.ctrl.orbit.perturbation.e, 4 ) ),
			10,
			70,
			'WHITE'
		]);
		
		// Semi-major axis (er)
		request.push([
			'print', 
			"a (er) = "
				+ str( significant( to_er( Satellite.ctrl.orbit.a ), 4 ) )
			+ ", "
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.a ), 4 ) ),
			10,
			80,
			'WHITE'
		]);
		
		// Semi-minor/conjugate axis (er)
		request.push([
			'print', 
			"b (er) = "
				+ str( significant( to_er( Satellite.ctrl.orbit.b ), 4 ) )
			+ ", "
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.b ), 4 ) ),
			10,
			90,
			'WHITE'
		]);
		
		// Inclination (deg)
		request.push([
			'print', 
			"i (deg) = "
				+ str( significant( rad_to_deg( Satellite.ctrl.orbit.i ), 4 ) )
				+ " ( " + Satellite.ctrl.orbit.sense + " ), "
				+ str( significant( rad_to_deg( Satellite.ctrl.orbit.perturbation.i ), 4 ) )
				+ " ( " + Satellite.ctrl.orbit.perturbation.sense + " )",
			10,
			100,
			'WHITE'
		]);
		
		// Longitude of ascending node (rad)
		request.push([
			'print', 
			"OMEGA (deg) = "
				+ str( significant( rad_to_deg( Satellite.ctrl.orbit.upper_omega ), 4 ) )
			+ ", "
				+ str( significant( rad_to_deg( Satellite.ctrl.orbit.perturbation.upper_omega ), 4 ) ),
			10,
			110,
			'WHITE'
		]);
		
		// Argument of periapse (rad)
		request.push([
			'print', 
			"omega (deg) = "
				+ str( significant( rad_to_deg( Satellite.ctrl.orbit.omega ), 4 ) )
			+ ", "
				+ str( significant( rad_to_deg( Satellite.ctrl.orbit.perturbation.omega ), 4 ) ),
			10,
			120,
			'WHITE'
		]);
		
		// Initial true anomaly / Initial time (rad)
		request.push([
			'print', 
			"f0, t0 (deg, eday) = "
				+ str( significant( rad_to_deg( Satellite.ctrl.orbit.f0 ), 4 ) ) + " ( "
				+ str( significant( to_eday( Satellite.ctrl.orbit.t0 ), 4 ) ) + " ), "
				+ str( significant( rad_to_deg( Satellite.ctrl.orbit.perturbation.f0 ), 4 ) ) + " ( "
				+ str( significant( to_eday( Satellite.ctrl.orbit.perturbation.t0 ), 4 ) )
			+ " )",
			10,
			130,
			'WHITE'
		]);
		
		//--------INFO. ESPECÍFICA DEL TIPO DE ÓRBITA----------
		
		// Outgoing angle (rad)
		request.push([
			'print', 
			"fo (deg) = "
				+ str( significant( rad_to_deg( Satellite.ctrl.orbit.fo ), 4 ) )
			+ ", "
				+ str( significant( rad_to_deg( Satellite.ctrl.orbit.perturbation.fo ), 4 ) ),
			10,
			140,
			'WHITE'
		]);
		
		// Period (eday)
		request.push([
			'print', 
			"T (eday) = "
				+ str( significant( to_eday( Satellite.ctrl.orbit.T ), 6 ) )
			+ ", "
				+ str( significant( to_eday( Satellite.ctrl.orbit.perturbation.T ), 6 ) ),
			10,
			150,
			'WHITE'
		]);
		
		// Apoapse (er)
		request.push([
			'print', 
			"ra (er) = "
				+ str( significant( to_er( Satellite.ctrl.orbit.ra ), 4 ) )
			+ ", "
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.ra ), 4 ) ),
			10,
			160,
			'WHITE'
		]);
		
		// Turning angle (deg)
		request.push([
			'print', 
			"turn (deg) = "
				+ str( significant( rad_to_deg( Satellite.ctrl.orbit.delta_angle ), 4 ) )
			+ ", "
				+ str( significant( rad_to_deg( Satellite.ctrl.orbit.perturbation.delta_angle ), 4 ) ),
			10,
			170,
			'WHITE'
		]);
		
		// Excess velocity (km/s)
		request.push([
			'print', 
			"vx (km/s) = "
				+ str( significant( Satellite.ctrl.orbit.vx, 4 ) )
			+ ", "
				+ str( significant( Satellite.ctrl.orbit.perturbation.vx, 4 ) ),
			10,
			180,
			'WHITE'
		]);
	};
	
	// Página 2: Etapas del vehículo
	static print_2(){
	
		// Plain BG
		request.push([
			'rectangle', 
			width_p(0),
			height_p(0),
			width_p(1),
			height_p(.3),
			'BLACK'
		]);
		
		// Division Line
		request.push([
			'line', 
			width_p(0),
			height_p(.3),
			width_p(1),
			height_p(.3),
			'WHITE'
		]);
	};
	
	// Construcción de vista
	static show(){
		
		// Construir nuevo pedido
		request = [];
		
		//------------SELECCIÓN DE VISTA-----------
		switch(view_page){
			case 1:
			
				//----PLANTA------
				c1 = 'x';
				c2 = 'y';
				break;
			case 2:
				
				//----ELEVACIÓN-----
				c1 = 'y';
				c2 = 'z';
				break;
			case 3:
				
				//------ESFERA CELESTE------------
				View.info_sphere();
				
				// Info. básica
				View.print_basic();
				
				// Enviar pedido al animador
				animator.postMessage({
					type: 'request',
					req: request
				});
				return;
		};
		
		// Satélites
		Satellite.list.forEach(function(value, index, array){
			value.view();
		});
		
		// Efemérides
		View.draw_ephemeris();
		
		// Imprimir info. solicitada
		View.print_basic();
		View.print_info();
		
		// Enviar pedido al animador
		animator.postMessage({
			type: 'request',
			req: request
		});
	};
};