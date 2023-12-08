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
	
	// Línea de nodos
	set_line_of_nodes(h){
		this.n = line_of_nodes( h );
	};
	
	// Vector excentricidad
	set_eccentricity(u, v, h, r){
		this.eccentricity = ecc_vector( u, v, h, r );
	};
	
	// Semi-latus rectum
	set_p(h, u){
		this.p = semi_latus_rectum( norm_vec( h ), u );
	};
	
	// Semi-major axis
	set_a(E, u){
		this.a = semi_major_axis( E, u );
	};
	
	// Eccentricity
	set_e(E){
		this.e = eccentricity( E, this.p, this.a );
	};
	
	// Semi-minor/conjugate axis
	set_b(){
		if(this.type == 'elliptic'){
			this.b = semi_minor_axis( this.a, this.e );
		}else{
			this.b = semi_conjugate_axis( this.a, this.e );
		};
	};
	
	// Periapse
	set_rp(){
		this.rp = periapse( this.p, this.e );
	};
	
	// Inclination
	set_i(h){
		this.i = inclination( h );
		if(this.i < PI / 2){
			this.sense = 'prograde';
		}else{
			this.sense = 'retrograde';
		};
	};
	
	// Longitude of the ascending node
	set_upper_omega(h, axial_tilt){
		this.upper_omega = longitude_ascending_node( this.n );
		this.rot_axis = rotation_axis(
			h,
			axial_tilt,
			this.upper_omega
		);
	};
	
	// Argument of periapse and initial true anomaly
	set_omega_f0(r){
		let angles = argument_of_periapse_f(
			this.eccentricity,
			r,
			this.upper_omega,
			this.i
		);
		this.omega = angles.omega;
		this.f0 = angles.f;
	};
	
	// Structure vectors
	structure(){
		let set = rp_p_n_vecs(
			this.p,
			this.e,
			this.rp,
			this.i,
			this.upper_omega,
			this.omega
		);
		this.periapse = set.rp;
		this.semi_latus_rectum = set.p;
		this.ascending_node = set.n;
	};
	
	// Tiempo inicial
	set_t0(u){
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
				u,
				this.a
			);
		};
	};
	
	// Period
	set_T(u){
		if(this.type == 'elliptic'){
			this.T = period( this.a, u );
		};
	};
	
	// Curve and Outgoing angle
	set_curve_fo(r){
		if(this.type != 'elliptic'){
			this.fo = outgoing_angle( this.e );
			
			// Descartar la trayectoria ficticia
			this.plot_inf_lim = - this.fo + 1e-2;
			this.plot_sup_lim = this.fo - 1e-2;
		}else{
			this.plot_inf_lim = 0;
			this.plot_sup_lim = 2 * PI;
		};
		
		// Curva en el plano orbital
		this.curve = cartesian_from_polar_curve(curve(
			(f) => {
				return to_px(r_from_f(
					this.p,
					this.e,
					f
				));
			},
			(f) => {
				return f;
			},
			(f) => {
				return 0;
			},
			this.plot_inf_lim,
			this.plot_sup_lim,
			.1
		));
		
		// Curva en el espacio en formato transferible
		for(var k=0; k<this.curve.length; k++){
			let space_point = orbit_planar_point_to_space_point(
				this.curve[k],
				this.i,
				this.omega,
				this.upper_omega
			);
			this.curve[k] = [
				space_point.x,
				space_point.y,
				space_point.z
			];
		};
	};
	
	// Apoapse
	set_ra(){
		if(this.type == 'elliptic'){
			this.ra = apoapse( this.p, this.e );
		};
	};
	
	// Turning angle
	set_delta_angle(){
		if(this.type != 'elliptic'){
			this.delta_angle = turning_angle( this.fo );
		};
	};
	
	// Excess velocity
	set_vx(u){
		if(this.type != 'elliptic'){
			this.vx = excess_velocity( u, this.a );
		};
	};
	
	// Simulated run
	set_sim(ts, u){
		
		// Tiempo de órbita
		this.t = ts + this.t0;
		
		// Posición y velocidad en el tiempo
		let sim = r_v_vecs(
			this.type,
			this.t,
			this.a,
			this.e,
			u,
			this.p,
			this.fo,
			this.T,
			this.i,
			this.omega,
			this.upper_omega
		);
		
		// Simulación
		this.M = sim.M;
		this.E = sim.E;
		this.H = sim.H;
		this.f = sim.f;
		this.r = sim.r;
		this.v = sim.v;
	};
	
	// Vista 1
	view1(request){
		
		// Nodo ascendente
		request.push([
			'line',
			to_px( center.x ),
			to_px( center.y ),
			to_px( center.x + this.ascending_node.x ),
			to_px( center.y + this.ascending_node.y ),
			"GREEN"
		]);
		
		// Peripasis
		request.push([
			'line',
			to_px( center.x ),
			to_px( center.y ),
			to_px( center.x + this.periapse.x ),
			to_px( center.y + this.periapse.y ),
			'RED'
		]);
		
		// Semi-altura recta
		request.push([
			'line',
			to_px( center.x ),
			to_px( center.y ),
			to_px( center.x + this.semi_latus_rectum.x ),
			to_px( center.y + this.semi_latus_rectum.y ),
			'GREY'
		]);
		
		// Curva de la órbita
		request.push([
			'plot',
			this.curve,
			[ to_px( center.x ), to_px( center.y ), to_px( center.z ) ],
			0,
			'GREY',
			0,
			1
		]);
		
		// Posición simulada
		request.push([
			'line',
			to_px( center.x ),
			to_px( center.y ),
			to_px( center.x + this.r.x ),
			to_px( center.y + this.r.y ),
			'GREY'
		]);
		
		// Velocidad simulada
		request.push([
			'line',
			to_px( center.x + this.r.x ),
			to_px( center.y + this.r.y ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( center.x + this.r.x ) + this.v.x * 1e0,
			to_px( center.y + this.r.y ) + this.v.y * 1e0,
			'MAGENTA'
		]);
	};
	
	// Vista 2
	view2(request){
		
		// Nodo ascendente
		request.push([
			'line',
			to_px( center.y ),
			to_px( center.z ),
			to_px( center.y + this.ascending_node.y ),
			to_px( center.z + this.ascending_node.z ),
			"GREEN"
		]);
		
		// Peripasis
		request.push([
			'line',
			to_px( center.y ),
			to_px( center.z ),
			to_px( center.y + this.periapse.y ),
			to_px( center.z + this.periapse.z ),
			'RED'
		]);
		
		// Semi-altura recta
		request.push([
			'line',
			to_px( center.y ),
			to_px( center.z ),
			to_px( center.y + this.semi_latus_rectum.y ),
			to_px( center.z + this.semi_latus_rectum.z ),
			'GREY'
		]);
		
		// Curva de la órbita
		request.push([
			'plot',
			this.curve,
			[ to_px( center.x ), to_px( center.y ), to_px( center.z ) ],
			0,
			'GREY',
			1,
			2
		]);
		
		// Posición simulada
		request.push([
			'line',
			to_px( center.y ),
			to_px( center.z ),
			to_px( center.y + this.r.y ),
			to_px( center.z + this.r.z ),
			'GREY'
		]);
		
		// Velocidad simulada
		request.push([
			'line',
			to_px( center.y + this.r.y ),
			to_px( center.z + this.r.z ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( center.y + this.r.y ) + this.v.y * 1e0,
			to_px( center.z + this.r.z ) + this.v.z * 1e0,
			'MAGENTA'
		]);
	};
	
	// Variables de la órbita (a partir del satélite que la recorre)
	constructor(h, E, u, v, r, axial_tilt){
		this.set_type(E);
		this.set_line_of_nodes(h);
		this.set_eccentricity(u, v, h, r);
		this.set_p(h, u);
		this.set_a(E, u);
		this.set_e(E);
		this.set_b();
		this.set_rp();
		this.set_i(h);
		this.set_upper_omega(h, axial_tilt);
		this.set_omega_f0(r);
		this.structure();
		this.set_curve_fo(r);
		this.set_T(u);
		this.set_t0(u);
		this.set_ra();
		this.set_delta_angle();
		this.set_vx(u);
	};
};