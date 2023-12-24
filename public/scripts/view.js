//---------VISTA------------------------------------
class View{
	constructor(){
		return;
	};
	
	// Info. Básica de simulación
	static print_basic(request){
		
		// Sistema de coordenadas
		request.push([
			'print', 
			"coordinate system: SE in J2000",
			10, 
			height_p( 1 ) - 10,
			'WHITE'
		]);
		
		// Parámetro gravitacional (km^3/s^2)
		request.push([
			'print', 
			"G (km^3/s^2) = " + str( significant( Satellite.u, 4 ) ),
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
		
		// Tiempo de simulación (eday)
		request.push([
			'print', 
			"simul time (eday) = " + str( significant( to_eday( s_time ), 4 ) ),
			10, 
			height_p( 1 ) - 40,
			'WHITE'
		]);
		
		// Tiempo de órbita (eday)
		request.push([
			'print', 
			"orbit time (eday) = " + str( significant( to_eday( Satellite.ctrl.orbit.t ), 4 ) ),
			10, 
			height_p( 1 ) - 50,
			'WHITE'
		]);
		
		// Posición de la cámara (er)
		request.push([
			'print', 
			"cam_corner (er) = [ "
				+ str( significant( to_er( -center.x ), 4 ) ) + ", " 
				+ str( significant( to_er( -center.y ), 4 ) ) + ", " 
				+ str( significant( to_er( -center.z ), 4 ) ) 
			+ " ]",
			10, 
			height_p( 1 ) - 60,
			'WHITE'
		]);
		
		// Siglos desde el Epoch
		request.push([
			'print', 
			"dt (Cy) = " + str( to_century( s_time ) ),
			10, 
			height_p( 1 ) - 70,
			'WHITE'
		]);
	};
	
	// Impresión de las magnitudes
	static print_info(request, page){
		
		// ---------- INFO. ESPECÍFICA DE LA PÁGINA ---------------
		switch(page){
			
			// Invariantes y anomalías
			case 0:
				View.print_0( request );
				break;
			
			// Elementos orbitales
			case 1:
				View.print_1( request );
				break;
		};
	};
	
	// Página 0: Invariantes y anomalías
	static print_0(request){
		
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
			Satellite.u,
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
	};
	
	// Página 1: Elementos orbitales
	static print_1(request){
		
		// Componentes del nodo ascendente (er)
		request.push([
			'print', 
			"n (er) = [ "
				+ str( significant( to_er( Satellite.ctrl.orbit.ascending_node.x ), 4 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.ascending_node.y ), 4 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.ascending_node.z ), 4 ) ) 
			+ " ], [ "
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.ascending_node.x ), 4 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.ascending_node.y ), 4 ) ) + ", " 
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.ascending_node.z ), 4 ) ) 
			+ " ]",
			10, 
			10,
			'GREEN'
		]);
		
		// Ascending node (er)
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
		
		// Periapse (er)
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
			width_p( .65 ),
			height_p( 1 ) - 10,
			'WHITE'
		]);
		
		// Period (eday)
		request.push([
			'print', 
			"T (eday) = "
				+ str( significant( to_eday( Satellite.ctrl.orbit.T ), 6 ) )
			+ ", "
				+ str( significant( to_eday( Satellite.ctrl.orbit.perturbation.T ), 6 ) ),
			width_p( .65 ),
			height_p( 1 ) - 20,
			'WHITE'
		]);
		
		// Apoapse (er)
		request.push([
			'print', 
			"ra (er) = "
				+ str( significant( to_er( Satellite.ctrl.orbit.ra ), 4 ) )
			+ ", "
				+ str( significant( to_er( Satellite.ctrl.orbit.perturbation.ra ), 4 ) ),
			width_p( .65 ),
			height_p( 1 ) - 30,
			'WHITE'
		]);
		
		// Turning angle (deg)
		request.push([
			'print', 
			"turn (deg) = "
				+ str( significant( rad_to_deg( Satellite.ctrl.orbit.delta_angle ), 4 ) )
			+ ", "
				+ str( significant( rad_to_deg( Satellite.ctrl.orbit.perturbation.delta_angle ), 4 ) ),
			width_p( .65 ),
			height_p( 1 ) - 40,
			'WHITE'
		]);
		
		// Excess velocity (km/s)
		request.push([
			'print', 
			"vx (km/s) = "
				+ str( significant( Satellite.ctrl.orbit.vx, 4 ) )
			+ ", "
				+ str( significant( Satellite.ctrl.orbit.perturbation.vx, 4 ) ),
			width_p( .65 ),
			height_p( 1 ) - 50,
			'WHITE'
		]);
	};
	
};