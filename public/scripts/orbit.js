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
				da: 0,
				de: 0,
				di: 0,
				dupper_omega: 0,
				dp: 0
			},
			adjust
		);
		if(i<0){
			f_orbit.negative_inclination = true;
		}else{
			f_orbit.negative_inclination = false;
		};
		return f_orbit;
	};
	
	// Epoch
	epoch_set(){
		this.epoch = s_time;
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
		};
		
		// Inclinación respecto a la eclíptica J2000
		let normal_eclliptic = prod_by_sc( norm_vec( h ), {x:0, y:0, z:1} );
		this.rot_axis = rotation_axis(
			normal_eclliptic,
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
	set_t0(u, t){
		if(t == null){
			this.t0 = t_from_f( this.type, this.f0, this.e, this.a, this.T );
		}else{
			this.t0 = t;
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
	
	// Posicion ficticia que corresponde al tiempo simulado
	fictional_pos(fic_time, t0, f0, u){
		
		// Tiempo particular de órbita y diferenciales
		let fic_t = fic_time + t0;
		let dt = to_century( fic_time );
		let fic_da = this.da_dt * dt;
		let fic_de = this.de_dt * dt;
		let fic_di = this.di_dt * dt;
		let fic_dupper_omega = this.dupper_omega_dt * dt;
		let fic_domega = this.dp_dt * dt - fic_dupper_omega;
		
		// Perturbación
		let fic_perturbation = Orbit.fictional_orbit(
			u,
			this.a + fic_da,
			this.e + fic_de,
			this.i + fic_di,
			this.omega + fic_domega,
			this.upper_omega + fic_dupper_omega,
			f0,
			this.axial_tilt
		);
		
		// Posición y velocidad en el tiempo calculados sobre la perturbación
		let sim_set = r_v_vecs(
			fic_perturbation.type,
			fic_t,
			fic_perturbation.a,
			fic_perturbation.e,
			u,
			fic_perturbation.p,
			fic_perturbation.fo,
			fic_perturbation.T,
			fic_perturbation.i,
			fic_perturbation.omega,
			fic_perturbation.upper_omega,
		);
		return {
			t: fic_t,
			perturbation: fic_perturbation,
			pos: sim_set
		};
	};
	
	// Simulation routine
	sim(u){
		let fic_pos = this.fictional_pos(
			s_time,
			this.t0,
			this.f0,
			u
		);
		
		// Tiempo de órbita
		this.t = fic_pos.t;
		
		// Perturbación
		this.perturbation = fic_pos.perturbation;
		
		// Punto de Simulación
		this.M = fic_pos.pos.M;
		this.E = fic_pos.pos.E;
		this.H = fic_pos.pos.H;
		this.f = fic_pos.pos.f;
		this.r = fic_pos.pos.r;
		this.v = fic_pos.pos.v;
		
		// Curva
		this.set_curve( this.r, this.perturbation );
	};
	
	// Simulation curve
	set_curve(r, fictional){
		if(fictional.type != 'elliptic'){
			
			// Graficar solo aquello que tiene sentido físico
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
		
		// Curva en el espacio en formato transferible (alrededor del sat. orbitado)
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
	
	// Vista
	view(orbited_pos, print_elem){
		
		// Elementos orbitales
		if(print_elem){
			
			// Nodo ascendente
			if(asc_node_checkbox.checked){
				view_vec( orbited_pos, this.perturbation.ascending_node, 'GREEN' );
			};
			
			// Peripasis
			if(periapse_checkbox.checked){
				view_vec( orbited_pos, this.perturbation.periapse, 'RED' );
			};
			
			// Semi-altura recta
			if(semi_lat_checkbox.checked){
				view_vec( orbited_pos, this.perturbation.semi_latus_rectum, 'BLUE' );
			};
		};
		
		// Curva de la órbita
		request.push([
			'plot',
			this.curve,
			[ to_px( orbited_pos.x ), to_px( orbited_pos.y ), to_px( orbited_pos.z ) ],
			0,
			'GREY',
			view_page - 1,
			view_page
		]);
		
		// Posición simulada
		view_vec( orbited_pos, this.r, 'GREY' );
		
		// Velocidad simulada
		view_vec_abs( sum_vec( orbited_pos, this.r ), this.v, 0, 'MAGENTA' );
	};
	
	// Variables de la órbita (a partir del satélite que la recorre)
	constructor(h, E, u, v, r, axial_tilt, dif, adjust_rot){	
		this.epoch_set();
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