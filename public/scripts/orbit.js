//--------ÓRBITA------------
class Orbit{
	
	// Crear órbita ficticia desde sus elementos
	static fictional_orbit(u, a, e, i, omega, upper_omega, f0, tilt){
		
		// Corrección del eje de rot. para órbitas ficticias que alcanzan i<0
		let adjust = false;
		if(i<0){
			adjust = true;
		};
		
		// Invariantes
		let inv = invariants_from_elements(
			u,
			a,
			e, 
			periapse_from_semi_major_axis( a, e ),
			i,
			omega,
			upper_omega,
			f0
		);
		
		// Órbita ficticia
		let f_orbit = new Orbit(
			angular_momentum( inv.r, inv.v ),
			orbital_energy( norm_vec( inv.v ), u, norm_vec( inv.r ) ),
			u,
			inv.v,
			inv.r,
			tilt,
			{	// La órbita ficticia no necesita los diferenciales, realmente.
				da: this.da_dt,
				de: this.de_dt,
				di: this.di_dt,
				dupper_omega: this.dupper_omega_dt,
				dp: this.dp_dt
			},
			adjust
		);
		return f_orbit;
	};
	
	// Orbit type
	set_type(E){
		if(E > 0){
			this.type = 'hyperbolic';
		}else if(E == 0){
			this.type = 'parabolic';
		}else{
			this.type = 'elliptic';
		};
	};
	
	// Líne of nodes
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
	set_a(E, u, da){
		this.a = semi_major_axis( E, u );
		this.da_dt = da;
	};
	
	// Eccentricity
	set_e(E, de){
		this.e = eccentricity( E, this.p, this.a );
		this.de_dt = de;
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
	set_i(h, di){
		this.i = inclination( h );
		if(this.i < PI / 2){
			this.sense = 'prograde';
		}else{
			this.sense = 'retrograde';
		};
		this.di_dt = di;
	};
	
	// Longitude of the ascending node
	set_upper_omega(h, axial_tilt, du, adjust_rot){
		this.upper_omega = longitude_ascending_node( this.n );
		this.axial_tilt = axial_tilt;
		
		// Corrección para órbitas ficticias que alcanzan i<0
		if(adjust_rot){
			this.axial_tilt *= -1;
			this.negative_inclination = true;
		};
		this.rot_axis = rotation_axis(
			h,
			this.axial_tilt,
			this.upper_omega
		);
		this.dupper_omega_dt = du;
	};
	
	// Argument of periapse and initial true anomaly
	set_omega_f0(r, dp){
		let angles = argument_of_periapse_f(
			this.eccentricity,
			r,
			this.upper_omega,
			this.i
		);
		this.omega = angles.omega;
		this.f0 = angles.f;
		this.dp_dt = dp;
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
	
	// outgoing angle
	set_fo(){
		this.fo = outgoing_angle( this.e );
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
	
	// Simulation routine
	set_sim(u){
		
		// Tiempo de órbita y diferenciales
		this.t = s_time + this.t0;
		let dt = to_century( s_time );
		this.da = this.da_dt * dt;
		this.de = this.de_dt * dt;
		this.di = this.di_dt * dt;
		this.dupper_omega = this.dupper_omega_dt * dt;
		this.domega = this.dp_dt * dt - this.dupper_omega;
		
		// Perturbación
		this.perturbation = Orbit.fictional_orbit(
			u,
			this.a + this.da,
			this.e + this.de,
			this.i + this.di,
			this.omega + this.domega,
			this.upper_omega + this.dupper_omega,
			this.f0,
			this.axial_tilt
		);
		
		// Posición y velocidad en el tiempo
		let sim = r_v_vecs(
			this.perturbation.type,
			this.t,
			this.perturbation.a,
			this.perturbation.e,
			u,
			this.perturbation.p,
			this.perturbation.fo,
			this.perturbation.T,
			this.perturbation.i,
			this.perturbation.omega,
			this.perturbation.upper_omega
		);
		
		// Simulación
		this.M = sim.M;
		this.E = sim.E;
		this.H = sim.H;
		this.f = sim.f;
		this.r = sim.r;
		this.v = sim.v;
		
		// Curva
		this.set_curve( this.r, this.perturbation );
	};
	
	// Simulation curve
	set_curve(r, fictional){
		if(fictional.type != 'elliptic'){
			
			// Descartar la trayectoria ficticia
			this.plot_inf_lim = - fictional.fo + 1e-2;
			this.plot_sup_lim = fictional.fo - 1e-2;
		}else{
			this.plot_inf_lim = 0;
			this.plot_sup_lim = 2 * PI;
		};
		
		// Curva en el plano orbital
		this.curve = cartesian_from_polar_curve(curve(
			(f) => {
				return to_px(r_from_f(
					fictional.p,
					fictional.e,
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
				fictional.i,
				fictional.omega,
				fictional.upper_omega
			);
			this.curve[k] = [
				space_point.x,
				space_point.y,
				space_point.z
			];
		};
	};
	
	// Vista 1
	view1(request){
		
		// Nodo ascendente
		request.push([
			'line',
			to_px( center.x ),
			to_px( center.y ),
			to_px( center.x + this.perturbation.ascending_node.x ),
			to_px( center.y + this.perturbation.ascending_node.y ),
			"GREEN"
		]);
		
		// Peripasis
		request.push([
			'line',
			to_px( center.x ),
			to_px( center.y ),
			to_px( center.x + this.perturbation.periapse.x ),
			to_px( center.y + this.perturbation.periapse.y ),
			'RED'
		]);
		
		// Semi-altura recta
		request.push([
			'line',
			to_px( center.x ),
			to_px( center.y ),
			to_px( center.x + this.perturbation.semi_latus_rectum.x ),
			to_px( center.y + this.perturbation.semi_latus_rectum.y ),
			'BLUE'
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
			to_px( center.y + this.perturbation.ascending_node.y ),
			to_px( center.z + this.perturbation.ascending_node.z ),
			"GREEN"
		]);
		
		// Peripasis
		request.push([
			'line',
			to_px( center.y ),
			to_px( center.z ),
			to_px( center.y + this.perturbation.periapse.y ),
			to_px( center.z + this.perturbation.periapse.z ),
			'RED'
		]);
		
		// Semi-altura recta
		request.push([
			'line',
			to_px( center.y ),
			to_px( center.z ),
			to_px( center.y + this.perturbation.semi_latus_rectum.y ),
			to_px( center.z + this.perturbation.semi_latus_rectum.z ),
			'BLUE'
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
	constructor(h, E, u, v, r, axial_tilt, dif, adjust_rot){
		this.set_type(E);
		this.set_line_of_nodes(h);
		this.set_eccentricity(u, v, h, r);
		this.set_p(h, u);
		this.set_a(E, u, dif.da);
		this.set_e(E, dif.de);
		this.set_b();
		this.set_rp();
		this.set_i(h, dif.di);
		this.set_upper_omega(h, axial_tilt, dif.dupper_omega, adjust_rot);
		this.set_omega_f0(r, dif.dp);
		this.structure();
		this.set_fo(r);
		this.set_T(u);
		this.set_t0(u);
		this.set_ra();
		this.set_delta_angle();
		this.set_vx(u);
	};
};