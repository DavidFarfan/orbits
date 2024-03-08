//--------SATÉLITE----------
class Satellite{
	
	// Lista de satélites
	static list = [];
	
	// Satélite controlado
	static ctrl = null;
	
	// Cambio de parámetros
	static moved = false;
	
	// Busqueda de un satélite por su nombre
	static get_sat(name){
		if(name == null){
			return null;
		};
		let idx = -1;
		
		// Iterar lista y comprobar los nombres
		Satellite.list.forEach(function(value, index, array){
			if(value.name == name){
				idx = index;
			};
		});
		if(idx < 0){
			return null
		}else{
			return Satellite.list[idx];
		};
	};
	 
	// Satélite a partir de la órbita
	static sat_from_orbit(name, orbited, R, m, u, a, e, rp, i, omega, upper_omega, rot, dif, f0){
		let sat_at_t0, rotation_set, differential_set;
		
		// Posición inicial del primer satélite
		if(orbited == null){
			
			// Crear un cuerpo "que no orbita ningún otro"
			sat_at_t0 = invariants_from_elements(
				u,
				1e9,
				0,
				1e9,
				deg_to_rad( 45 ),
				deg_to_rad( 0 ),
				deg_to_rad( 0 ),
				deg_to_rad( 0 )
			);
							
			// No es relevante la rotación del primer cuerpo
			rotation_set = {
				T: 0,
				t0: 0,
				tilt: deg_to_rad( 0 )
			},
				
			// No es relevante la traslación del primer cuerpo
			differential_set = {
				da: deg_to_rad( 0 ),
				de: deg_to_rad( 0 ),
				di: deg_to_rad( 0 ),
				dupper_omega: deg_to_rad( 0 ),
				dp: deg_to_rad( 0 )
			}
		
		// Posición inicial de los satélites posteriores
		}else{
			sat_at_t0 = invariants_from_elements(
				Satellite.get_sat(orbited).u,
				a,
				e,
				rp,
				i,
				omega,
				upper_omega,
				f0
			);
			rotation_set = rot;
			differential_set = dif;
		};
		
		// Crear el nuevo satélite con la posición inicial
		let sat = new Satellite(
			name,
			orbited,
			R,
			m,
			u,
			sat_at_t0.r,
			sat_at_t0.v,
			rotation_set,
			differential_set,
			true
		);
	};
	
	// Flight leg
	static flight_leg(){
		
		// Conservar rotación en la nueva fase
		let sat_rot = {
			T: Satellite.ctrl.sidereal_rotation_period,
			t0: Satellite.ctrl.GST0,
			tilt: Satellite.ctrl.orbit.axial_tilt
		};
		
		// Crear un satélite en el punto de simulación
		let phase_no = Satellite.ctrl.phase + 1;
		let vehicle_name = Satellite.ctrl.name + str( phase_no );
		new Satellite(
			vehicle_name, 
			Satellite.ctrl.orbited, 
			Satellite.ctrl.R,
			Satellite.ctrl.m, 
			Satellite.ctrl.u, 
			Satellite.ctrl.orbit.r, 
			Satellite.ctrl.orbit.v, 
			sat_rot,
			{
				da: 0,
				de: 0,
				di: 0,
				dupper_omega: 0,
				dp: 0
			},
			false,
			phase_no
		);
		
		// Ajustar tiempo inicial
		let f0_adj = argument_of_periapse_f(
			Satellite.get_sat( vehicle_name ).orbit.eccentricity,
			Satellite.ctrl.orbit.r,
			Satellite.get_sat( vehicle_name ).orbit.upper_omega,
			Satellite.get_sat( vehicle_name ).orbit.i
		).f;
		Satellite.get_sat( vehicle_name ).orbit.set_t0(null, t_from_f(
										Satellite.get_sat( vehicle_name ).orbit.type,
										f0_adj,
										Satellite.get_sat( vehicle_name ).orbit.e, 
										Satellite.get_sat( vehicle_name ).orbit.a, 
										Satellite.get_sat( vehicle_name ).orbit.T,
										Satellite.get_sat( vehicle_name ).get_gravity()
									) - s_time
		);
		
		// Modificar intervalo de visibilidad
		Satellite.get_sat( vehicle_name ).init_set( Satellite.ctrl.name );
		Satellite.ctrl.end_set( vehicle_name );
		
		// Ceder el control a los nuevos settings
		set_center_ctrl( vehicle_name );
	};
	
	// Rutina de control manual
	static ctrl_routine(adj_center){
		
		// Verificar entrada del usuario
		if(Satellite.moved == 0){
			return;
		};  
		
		// Preparar nuevas condiciones iniciales del satélite
		var pos = {
			x: Satellite.ctrl.pos.x,
			y: Satellite.ctrl.pos.y,
			z: Satellite.ctrl.pos.z,
		};
		var vel = {
			x: Satellite.ctrl.vel.x,
			y: Satellite.ctrl.vel.y,
			z: Satellite.ctrl.vel.z,
		};
		
		// Cambiar posisición/velocidad del satélite controlado
		if(punctual_changes){
			switch( abs( Satellite.moved ) ){
				case 1:
					pos.x = pos_x_punctual.value * ER;
					break;
				case 2:
					pos.y = pos_y_punctual.value * ER;
					break;
				case 3:
					pos.z = pos_z_punctual.value * ER;
					break;
				case 4:
					vel.x = vel_x_punctual.value * 1;
					break;
				case 5:
					vel.y = vel_y_punctual.value * 1;
					break;
				case 6:
					vel.z = vel_z_punctual.value * 1;
					break;
				case 8:
					vel.x = magnitude_punctual.value * 1 * Satellite.ctrl.vel.x / norm_vec( Satellite.ctrl.vel );
					vel.y = magnitude_punctual.value * 1 * Satellite.ctrl.vel.y / norm_vec( Satellite.ctrl.vel );
					vel.z = magnitude_punctual.value * 1 * Satellite.ctrl.vel.z / norm_vec( Satellite.ctrl.vel );
					break;
				default:
					break;
			};
			punctual_changes = false;
		}else{
			switch(Satellite.moved){
				case -1:
					pos.x -= sat.x;
					break;
				case 1:
					pos.x += sat.x;
					break;
				case -2:
					pos.y -= sat.y;
					break;
				case 2:
					pos.y += sat.y;
					break;
				case -3:
					pos.z -= sat.z;
					break;
				case 3:
					pos.z += sat.z;
					break;
				case -4:
					vel.x -= sat.vx;
					break;
				case 4:
					vel.x += sat.vx;
					break;
				case -5:
					vel.y -= sat.vy;
					break;
				case 5:
					vel.y += sat.vy;
					break;
				case -6:
					vel.z -= sat.vz;
					break;
				case 6:
					vel.z += sat.vz;
					break;
				default:
					break;
			};
		};
		Satellite.moved = 0;
		
		// Conservar rotación
		let sat_rot = {
			T: Satellite.ctrl.sidereal_rotation_period,
			t0: Satellite.ctrl.GST0,
			tilt: Satellite.ctrl.orbit.axial_tilt
		};
		
		// Conservar perturbaciones
		let sat_dif = {
			da: Satellite.ctrl.orbit.da_dt,
			de: Satellite.ctrl.orbit.de_dt,
			di: Satellite.ctrl.orbit.di_dt,
			dupper_omega: Satellite.ctrl.orbit.dupper_omega_dt,
			dp: Satellite.ctrl.orbit.dp_dt
		};
		
		// Conservar nombre
		let sat_name = Satellite.ctrl.name;
		
		// Saltar al epoch
		set_time( Satellite.ctrl.orbit.epoch );
		
		// Ajuste de centro
		let center_name = Satellite.ctrl.orbited;
		if(adj_center != null){
			center_name = adj_center;
			
			// Coordenadas absolutas de los objetos 
			let absolute_pos_center = Satellite.get_sat( adj_center ).get_absolute_r();
			let absolute_pos_sat = Satellite.ctrl.get_absolute_r();
			
			// Coordenadas ajustadas al centro seleccionado
			pos = sum_vec(
				absolute_pos_sat,
				prod_by_sc( -1, absolute_pos_center )
			);
			
			// Velocidades absolutas de los objetos 
			let absolute_vel_center = Satellite.get_sat( adj_center ).get_absolute_v();
			let absolute_vel_sat = Satellite.ctrl.get_absolute_v();
			
			// Velocidades ajustadas al centro seleccionado
			vel = sum_vec(
				absolute_vel_sat,
				prod_by_sc( -1, absolute_vel_center )
			);
		};
		
		// Implementar los nuevos settings
		new Satellite(
			sat_name,
			center_name,
			Satellite.ctrl.R,
			Satellite.ctrl.m,
			Satellite.ctrl.u,
			pos,
			vel,
			sat_rot,
			sat_dif,
			false,
			Satellite.ctrl.phase
		);
		
		// Ajustar posición inicial en la órbita
		let f0_adj = argument_of_periapse_f(
			Satellite.get_sat( sat_name ).orbit.eccentricity,
			pos,
			Satellite.get_sat( sat_name ).orbit.upper_omega,
			Satellite.get_sat( sat_name ).orbit.i
		).f;
		Satellite.get_sat( sat_name ).orbit.set_t0(null, t_from_f(
										Satellite.get_sat( sat_name ).orbit.type,
										f0_adj,
										Satellite.get_sat( sat_name ).orbit.e, 
										Satellite.get_sat( sat_name ).orbit.a, 
										Satellite.get_sat( sat_name ).orbit.T,
										Satellite.get_sat( sat_name ).get_gravity()
									) - s_time
		);
		
		// Conservar intervalo de vida
		Satellite.get_sat( sat_name ).init = Satellite.ctrl.init;
		Satellite.get_sat( sat_name ).end = Satellite.ctrl.end;
		Satellite.get_sat( sat_name ).prev_sat = Satellite.ctrl.prev_sat;
		Satellite.get_sat( sat_name ).prev_v = Satellite.ctrl.prev_v;
		Satellite.get_sat( sat_name ).delta_v_calculation();
		Satellite.get_sat( sat_name ).next_sat = Satellite.ctrl.next_sat;
		
		// Matar los settings actuales
		Satellite.ctrl.name_set('dead');
		Satellite.ctrl.set_live();
		
		// Ceder el control a los nuevos settings
		set_center_ctrl( sat_name );
	};
	
	// Deshacerse de un satélite
	static kill(){
		
		// Referenciar el Satélite orbitado
		let pass_name = Satellite.ctrl.orbited;
		
		// Matar los settings actuales
		Satellite.ctrl.kill_sat();
		
		// Ceder el control al satélite orbitado
		set_center_ctrl( pass_name );
	};
	
	// Lanzamineto de un vehiculo desde superficie planetaria
	static launch(){
		
		// Velocidad inicial
		let vl = Satellite.ctrl.launch_trajectory(
			sight_RA,
			sight_D,
			6
		);
		
		// Nombre del vehículo 
		let vehicle_name = 'v' + str( vehicles_trajectories );
		vehicles_trajectories ++;
		
		// Crear el vehículo
		new Satellite(
			vehicle_name, 
			Satellite.ctrl.name, 
			1e-1,
			1e-1,
			1e-1,
			vl.pos, 
			vl.vel, 
			{
				T: E_SIDEREAL_ROTATION_PERIOD,
				t0: 0,
				tilt: 0
			},
			{
				da: 0,
				de: 0,
				di: 0,
				dupper_omega: 0,
				dp: 0
			},
			false
		);
		
		// Ajustar posición inicial en la órbita
		let f0_for_launch_orbit = argument_of_periapse_f(
			Satellite.get_sat( vehicle_name ).orbit.eccentricity,
			vl.pos,
			Satellite.get_sat( vehicle_name ).orbit.upper_omega,
			Satellite.get_sat( vehicle_name ).orbit.i
		).f;
		Satellite.get_sat( vehicle_name ).orbit.set_t0(null, t_from_f(
										Satellite.get_sat( vehicle_name ).orbit.type,
										f0_for_launch_orbit,
										Satellite.get_sat( vehicle_name ).orbit.e, 
										Satellite.get_sat( vehicle_name ).orbit.a, 
										Satellite.get_sat( vehicle_name ).orbit.T,
										Satellite.get_sat( vehicle_name ).get_gravity()
									) - s_time
		);
		
		// Ceder el control al vehículo
		set_center_ctrl( vehicle_name );
	};
	
	// Control de fases
	static phase_control(){
		if(Satellite.ctrl.antelife()){
			set_center_ctrl( Satellite.ctrl.prev_sat );
			return;
		};
		if(Satellite.ctrl.poslife()){
			set_center_ctrl( Satellite.ctrl.next_sat );
			return;
		};
	};
	
	// Matarse
	kill_sat(){
		
		// Dejar la fase anterior con validez permanente
		if(this.prev_sat != null){
			Satellite.get_sat( this.prev_sat ).end_set();
		};
		
		// Desaparecer
		this.name_set('dead');
		this.set_live();
	};
	
	// Antevida
	antelife(){
		if(this.init != null){
			return s_time < this.init;
		};
		return false;
	};
	
	// Posvida
	poslife(){
		if(this.end != null){
			return s_time > this.end;
		};
		return false;
	};
	
	// Verificar intervalo de vida
	phase_valid(){
		if(this.antelife() || this.poslife()){
			return false;
		};
		return true;
	};
	
	// Trayectoria y punto de lanzamiento
	launch_trajectory(ra, d, vel_mag){
		
		// Dirección del lanzamiento
		let dir_rot = launch_dir(
			ra,
			d,
			LAMBDA,
			PHI,
			this.GST,
			this.R,
			vel_mag
		);
		
		//  Ajustar al plano ecuatorial
		let tilt = this.orbit.axial_tilt;
		if(this.orbit.perturbation.negative_inclination){
			tilt *= -1;
		};
		dir_rot.pos = rotation_axis(
			dir_rot.pos,
			tilt,
			this.orbit.perturbation.upper_omega
		);
		dir_rot.vel = rotation_axis(
			dir_rot.vel,
			tilt,
			this.orbit.perturbation.upper_omega
		);
		return dir_rot;
	};
	
	// Elliptic targeting
	elliptic_targeting(sat, des_time){
		
		// Coordenadas absolutas de los objetos 
		let absolute_pos_center = Satellite.get_sat( this.orbited ).get_absolute_r();
		let absolute_pos_sat = sat.get_absolute_r();
		let absolute_pos_target = this.get_absolute_r();
		
		// Coordenadas ajustadas al centro del target
		let sat_dist = sum_vec(
			absolute_pos_sat,
			prod_by_sc( -1, absolute_pos_center )
		);
		let target_dist = sum_vec(
			absolute_pos_target,
			prod_by_sc( -1, absolute_pos_center )
		);
		
		// Target en el tiempo deseado de colisión
		let future_vecs = this.orbit.fictional_pos(
			s_time + des_time,
			this.orbit.t0,
			this.orbit.f0,
			this.get_gravity()
		);
		this.target = {
			r: future_vecs.pos.r,
			v: future_vecs.pos.v
		};
		
		// Feasibility
		let cs = chord_semi_perimeter( sat_dist, this.target.r );
		let mint = ell_min_flight_t( sat_dist, this.target.r, this.get_gravity() );
		let maxt = dt_from_a( sat_dist, this.target.r, cs.semi_perimeter / 2, this.get_gravity() );
		let min_a = a_from_dt( sat_dist, this.target.r, mint, this.get_gravity() );
		let des_a = a_from_dt( sat_dist, this.target.r, des_time, this.get_gravity() );
		let max_a = a_from_dt( sat_dist, this.target.r, maxt, this.get_gravity() ); 
		let orbit_curve = new Orbit(
			angular_momentum( sat_dist, des_a.v ),
			orbital_energy( norm_vec( des_a.v ), this.get_gravity(), norm_vec( sat_dist ) ),
			this.get_gravity(),
			des_a.v,
			sat_dist,
			sat.axial_tilt,
			{	// La órbita ficticia no necesita los diferenciales, realmente.
				da: 0,
				de: 0,
				di: 0,
				dupper_omega: 0,
				dp: 0
			}
		);
		
		// f inicial
		let f0_for_target_orbit = argument_of_periapse_f(
			orbit_curve.eccentricity,
			sat_dist,
			orbit_curve.upper_omega,
			orbit_curve.i
		).f;
		
		// Tiempo inicial
		let t_init = t_from_f(
			orbit_curve.type,
			f0_for_target_orbit,
			orbit_curve.e, 
			orbit_curve.a, 
			orbit_curve.T,
			this.get_gravity()
		);
		let t_adj = t_init - s_time;
		orbit_curve.set_t0( null, t_adj ); 
		
		// Transfer orbit se dibuja alrededor del cuerpo orbitado por target
		this.orbit_to_me = {
			sat: this,
			orbit: orbit_curve
		};
		return {
			v: des_a.v,
			a: [ min_a.a, des_a.a, max_a.a ],
			t: [ mint, des_time, maxt ]
		};
	};
	
	// Nombre del satélite
	name_set(name){
		this.name = name;
	};
	
	// Cuerpo orbitado
	orbited_set(name){
		
		// Hacer constar la condición del primer satélite
		if(name == null){
			this.first = true;
		};
		this.orbited = name;
	};
	
	// Mostrar/Ocultar
	set_live(){
		this.alive = !this.alive;
	};
	
	// Radio del satélite
	R_set(R){
		this.R = R;
	};
	
	// Masa del satélite
	m_set(m){
		this.m = m;
	};
	
	// Delta v
	delta_v_calculation(){
		if(this.prev_v == null){
			this.delta_v = null;
			return;
		};
		this.delta_v = sum_vec(
			this.prev_v,
			prod_by_sc( -1, this.vel ),
		);
	};
	
	// Intervalo de vida
	init_set(name){
		
		// Deshacer 
		if(name == null){
			this.init = null;
			this.prev_sat = null;
			this.prev_v = null;
			delta_v_calculation();
			return;
		};
		
		// Hacer
		this.init = s_time;
		this.prev_sat = name;
		this.prev_v = Satellite.get_sat( this.prev_sat ).orbit.v;
		this.delta_v_calculation();
	};
	end_set(name){
		
		// Deshacer 
		if(name == null){
			this.end = null;
			this.next_sat = null;
			return;
		};
		
		// Hacer
		this.end = s_time;
		this.next_sat = name;
	};
	
	// Número de fase
	phase_set(p){
		if(p==null){
			this.phase = 0;
		}else{
			this.phase = p;
		};
	};
	
	// Parámetro gravitatorio al que está sometido
	get_gravity(){
		if(this.orbited == null){
			return this.u;
		}else{
			return Satellite.get_sat( this.orbited ).u;
		};
	};
	
	// Velocidad absoluta del satélite
	get_absolute_v(print){
		
		// Sumar el radio propio al cómputo recursivo hasta el Sol
		let orbited_vel = this.get_absolute_vel( null, print );
		return {
			x: this.orbit.v.x + orbited_vel.x,
			y: this.orbit.v.y + orbited_vel.y,
			z: this.orbit.v.z + orbited_vel.z
		};
	};
	
	// Posición absoluta actual del satélite
	get_absolute_r(print){
		
		// Sumar la pos abs. de la sim. propia a la del cuerpo orbitado
		let orbited_pos = this.get_absolute_pos( null, print );
		let my_pos = null;
		if(orbited_pos != undefined && this.orbit.r != undefined){
			my_pos = {
				x: this.orbit.r.x + orbited_pos.x,
				y: this.orbit.r.y + orbited_pos.y,
				z: this.orbit.r.z + orbited_pos.z
			};
		};
		
		// Imprimir el resultado de ser necesario
		if(print){
			log( my_pos );			
		};
		return my_pos;
	};
	
	// Distancia entre sim. del satélite y sim. del cuerpo orbitado
	get_print_pos(){
		let pos = this.get_absolute_pos();
		return {
			x: pos.x - center.x,
			y: pos.y - center.y,
			z: pos.z - center.z
		};
	};
	
	// Posición absoluta actual de la sim. del cuerpo orbitado
	get_absolute_pos(rel, print){
		
		// Recorrer recursivamente hasta el Sol
		if(this.orbited == null){
			if(rel == null){
				return {
					x: 0,
					y: 0,
					z: 0
				};
			}else{
				return rel;
			};
		}else{
			var relative;
			if(rel == null){
				relative = {
					x: 0,
					y: 0,
					z: 0
				};
			}else{
				relative = rel;
			};
			var orbited_pos = Satellite.get_sat( this.orbited ).orbit.r;
			if(orbited_pos != undefined){
				
				// Imprimir el paso de ser necesario
				if(print){
					log('orbitado: ' + this.orbited );
					log(orbited_pos);
				};
				
				// Sumar la posición sim. del cuerpo orbitado en cada paso
				relative = {
					x: orbited_pos.x + relative.x,
					y: orbited_pos.y + relative.y,
					z: orbited_pos.z + relative.z
				};
			};
			return Satellite.get_sat( this.orbited ).get_absolute_pos( relative, print );
		};
	};
	
	// Velocidad absoluta del satélite orbitado
	get_absolute_vel(rel, print){
		
		// Recorrer recursivamente hasta el Sol
		if(this.orbited == null){
			if(rel == null){
				return {
					x: 0,
					y: 0,
					z: 0
				};
			}else{
				return rel;
			};
		}else{
			var relative;
			if(rel == null){
				relative = {
					x: 0,
					y: 0,
					z: 0
				};
			}else{
				relative = rel;
			};
			var orbited_vel = Satellite.get_sat( this.orbited ).orbit.v;
			if(orbited_vel != undefined){
				if(print){
					log('orbitado: ' + this.orbited );
					log(orbited_vel);
				};
				relative = {
					x: orbited_vel.x + relative.x,
					y: orbited_vel.y + relative.y,
					z: orbited_vel.z + relative.z
				};
			};
			return Satellite.get_sat( this.orbited ).get_absolute_vel( relative, print );
		};
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
	
	// Rotación
	rotation_set(rot){
		
		// Periodo de rotación sideral
		this.sidereal_rotation_period = rot.T;
		
		// Ascensión recta incial del meridiano cero
		this.GST0 = rot.t0;
	};
	
	// Magnitudes físicas
	physics(dif, rot){
		
		// Vector momento angular
		this.h_vec = angular_momentum( this.pos, this.vel );
		
		// Momento angular
		this.h = norm_vec( this.h_vec );
		
		// Energía de órbita
		this.E = orbital_energy( this.v, this.get_gravity(), this.r );
		
		// Órbita
		this.orbit = new Orbit(
			this.h_vec,
			this.E,
			this.get_gravity(),
			this.vel,
			this.pos,
			rot.tilt,
			dif
		);
	};
	
	// Rotación simulada
	rotate(){
		
		// Ascensión recta del meridiano cero
		this.GST = GST(
			this.sidereal_rotation_period,
			s_time,
			this.GST0
		);
	};
	
	// Simmulación
	sim(){
		
		// Matar el satélite si no tiene cuerpo central
		if(!this.first && Satellite.get_sat( this.orbited ) == null){
			this.kill_sat();
		};
		
		// Ignorar satélite si está muerto
		if(this.name == 'dead' ){
			return;
		};
		
		// Traslación
		this.orbit.sim( this.get_gravity() );
		
		// Esfera de influencia
		if(this.orbited != null){
			this.rsoi = r_soi(
				this.orbit.perturbation.a,
				this.m,
				Satellite.get_sat( this.orbited ).m
			);
		};
		
		// Rotación
		this.rotate(); 
		
		// Orbita de transferencia
		if(this.orbit_to_me != undefined){
			this.orbit_to_me.orbit.sim( this.orbit_to_me.sat.get_gravity() );
		};
	};
	
	// Vista
	view(){
		
		// Verificar intervalo de vida
		if(!this.phase_valid()){
			return;
		};
		
		// Ocultar satélite
		if(!this.alive){
			return;
		};
		
		// Órbita
		let print_pos = this.get_print_pos();
		this.orbit.view( print_pos, true );
		
		// Color inicativo del Control
		let color;
		if(this.ctrl){
			color = 'WHITE';
		}else{
			color = 'YELLOW';
		};
		
		// Radio
		let draw_radius = to_px( this.R );
		if(draw_radius < 1){
			draw_radius = 1;
		};
		request.push([
			'circle',
			to_px( print_pos[c1] + this.orbit.r[c1] ),
			to_px( print_pos[c2] + this.orbit.r[c2] ),
			draw_radius,
			'CYAN'
		]);
		
		// SOI
		let draw_rsoi = to_px( this.rsoi );
		if(draw_rsoi < 1){
			draw_rsoi = 1;
		};
		request.push([
			'circle',
			to_px( print_pos[c1] + this.orbit.r[c1] ),
			to_px( print_pos[c2] + this.orbit.r[c2] ),
			draw_rsoi,
			'RED'
		]);
		
		// Vector r
		view_vec( print_pos, this.pos, color );
		
		// Vector v
		view_vec_abs( sum_vec( print_pos, this.pos ), this.vel, 0, color );
		
		// Vector h
		view_vec_abs( print_pos, this.h_vec, -2, 'CYAN' );
		
		// Eje de rotación
		view_vec_abs(
			sum_vec( print_pos, this.orbit.r ),
			this.orbit.perturbation.rot_axis,
			-2,
			'PURPLE'
		);
		
		// Nombre
		request.push([ 
			'print', 
			this.name,
			to_px( print_pos[c1] + this.orbit.r[c1] ) - 10, 
			to_px( print_pos[c2] + this.orbit.r[c2] ) + 10,
			color
		]);
		
		// Target (Future Position)
		if(this.target != undefined && this.orbit_to_me != undefined){
			
			// Órbita de transferencia
			this.orbit_to_me.orbit.view( this.orbit_to_me.sat.get_print_pos() );
			
			// Vector r futuro
			view_vec( print_pos, this.target.r, 'CYAN' );
			
			// Vector v futuro
			view_vec_abs( sum_vec( print_pos, this.target.r ), this.target.v, 0, 'CYAN' );
		};
		
		// Lanzamiento
		let dir_rot = this.launch_trajectory(
			sight_RA,
			sight_D,
			this.R
		);
		
		// Visualizar lanzamiento
		let launch_pos = sum_vec( sum_vec( print_pos, this.orbit.r ), dir_rot.pos );
		view_vec( launch_pos, dir_rot.vel, 'RED' );
		request.push([ 
			'print', 
			'negative_inclination: ' + str(
				this.orbit.perturbation.negative_inclination
			), 
			to_px( print_pos[c1] + this.orbit.r[c1] ) - 10, 
			to_px( print_pos[c2] + this.orbit.r[c2] ) + 60,
			color
		]);
		request.push([ 
			'print', 
			'dir rot x: ' + str( dir_rot.vel.x ), 
			to_px( print_pos[c1] + this.orbit.r[c1] ) - 10, 
			to_px( print_pos[c2] + this.orbit.r[c2] ) + 50,
			color
		]);
		request.push([ 
			'print', 
			'dir rot y: ' + str( dir_rot.vel.y ), 
			to_px( print_pos[c1] + this.orbit.r[c1] ) - 10, 
			to_px( print_pos[c2] + this.orbit.r[c2] ) + 40,
			color
		]);
		request.push([ 
			'print', 
			'dir rot z: ' + str( dir_rot.vel.z ), 
			to_px( print_pos[c1] + this.orbit.r[c1] ) - 10, 
			to_px( print_pos[c2] + this.orbit.r[c2] ) + 30,
			color
		]);
		request.push([ 
			'print', 
			this.GST,
			to_px( print_pos[c1] + this.orbit.r[c1] ) - 10, 
			to_px( print_pos[c2] + this.orbit.r[c2] ) + 20,
			color
		]);
	};
	
	// Variables del satélite
	constructor(name, orbited, R, m, u, pos, vel, rot, dif, ctrl, p){
		this.set_live();
		this.name_set(name);
		this.orbited_set(orbited);
		this.R_set(R);
		this.m_set(m);
		this.u = u;
		this.phase_set(p);
		this.ctrl_set(ctrl);
		this.pos_set(pos);
		this.vel_set(vel);
		this.rotation_set(rot);
		this.physics(dif, rot);
		Satellite.list.push(this);
	};
};