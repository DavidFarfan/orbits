//--------SATÉLITE----------
class Satellite{
	
	// Lista de satélites
	static list = [];
	
	// Satélite controlado
	static ctrl = null;
	
	// Cambio de parámetros
	static moved = false;
	
	// Satélite particular
	static get_sat(name){
		if(name == null){
			return null;
		};
		let idx = -1;
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
	
	// Rutina de control manual
	static ctrl_rutine(){
		
		// Verificar cambios de parámetros
		if(!Satellite.moved){
			return;
		};  
		
		// Cambiar posisición del satélite controlado
		var pos = {
			x: to_km( sat.x ),
			y: to_km( sat.y ),
			z: to_km( sat.z )
		};
		
		// Cambiar velocidad del satélite controlado
		var vel = {
			x: sat.vx,
			y: sat.vy,
			z: sat.vz
		};
		
		// Nueva órbita
		Satellite.ctrl.pos_set(pos);
		Satellite.ctrl.vel_set(vel);
		Satellite.ctrl.rotation_set({
			T: Satellite.ctrl.sidereal_rotation_period,
			t0: Satellite.ctrl.GST0,
			tilt: Satellite.ctrl.axial_tilt
		});
		Satellite.ctrl.physics({
			da: Satellite.ctrl.orbit.da_dt,
			de: Satellite.ctrl.orbit.de_dt,
			di: Satellite.ctrl.orbit.di_dt,
			dupper_omega: Satellite.ctrl.orbit.dupper_omega_dt,
			dp: Satellite.ctrl.orbit.dp_dt
		});
		
		// Reiniciar tiempo de simulación
		s_base_time = 0;
		
		// Esperar un nuevo cambio de parámetros
		Satellite.moved = false;
	};
	
	// Satélite a partir de la órbita
	static sat_from_orbit(name, orbited, R, m, u, a, e, rp, i, omega, upper_omega, rot, dif, f0){
		
		// Caso base
		if(orbited == null){
			
			// Crear un cuerpo "inmóvil"
			let sat_at_t0 = invariants_from_elements(
				u,
				1e9,
				0,
				1e9,
				0,
				0,
				0,
				0
			);
			let sat = new Satellite(
				name,
				null,
				R,
				m,
				u,
				sat_at_t0.r,
				sat_at_t0.v,
				{
					T: 0,
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
				true
			);
			return;
		};
		
		// Construir el satélite en el punto f0
		let sat_at_t0 = invariants_from_elements(
			Satellite.get_sat(orbited).u,
			a,
			e,
			rp,
			i,
			omega,
			upper_omega,
			f0
		);
		
		let sat = new Satellite(
			name,
			orbited,
			R,
			m,
			u,
			rotation_axis(sat_at_t0.r, Satellite.get_sat(orbited).axial_tilt, upper_omega),
			rotation_axis(sat_at_t0.v, Satellite.get_sat(orbited).axial_tilt, upper_omega),
			rot,
			dif,
			true
		);
	};
	
	// Elliptic targeting
	elliptic_targeting(sat, des_time){
		
		// Calculate future position
		log("---TGT----");
		log( sat );
		log( this );
		log("---r0----");
		log( sat.orbit.r );
		log( this.orbit.r );
		log("---t0----");
		log( sat.orbit.t );
		log( this.orbit.t );
		log("---f0----");
		log( sat.orbit.f );
		log( this.orbit.f );
		let comp = this.orbit.fictional_pos(
				des_time,
				this.orbit.t,
				this.orbit.f,
				this.get_gravity()
		);
		this.target = {
			r: comp.pos.r,
			v: comp.pos.v
		};
		
		// Feasibility
		log("---Chord, Semi perimeter----");
		let cs = chord_semi_perimeter( sat.orbit.r, this.target.r );
		log( cs );
		log("---t---");
		let mint = ell_min_flight_t( sat.orbit.r, this.target.r, sat.get_gravity() );
		let maxt = dt_from_a( sat.orbit.r, this.target.r, cs.semi_perimeter / 2, sat.get_gravity() );
		log( 'min t: ' + str( to_eday( mint ) ) );
		log( 'des t: ' + str( to_eday( des_time ) ) );
		log( 'max t: ' + str( to_eday( maxt ) ) );
		log("---a---");
		let min_a = a_from_dt( sat.orbit.r, this.target.r, mint, sat.get_gravity() );
		let des_a = a_from_dt( sat.orbit.r, this.target.r, des_time, sat.get_gravity() );
		let max_a = a_from_dt( sat.orbit.r, this.target.r, maxt, sat.get_gravity() );
		log( 'min a: ' + str( min_a.a ) );
		log( 'des a: ' + str( des_a.a ) );
		log( 'max a: ' + str( max_a.a ) + " = s/2 = " + str( cs.semi_perimeter / 2 ) );
		let orbit_curve = new Orbit(
			angular_momentum( sat.orbit.r, des_a.v ),
			orbital_energy( norm_vec( des_a.v ), sat.get_gravity(), norm_vec( sat.orbit.r ) ),
			sat.get_gravity(),
			des_a.v,
			sat.orbit.r,
			sat.axial_tilt,
			{	// La órbita ficticia no necesita los diferenciales, realmente.
				da: 0,
				de: 0,
				di: 0,
				dupper_omega: 0,
				dp: 0
			}
		);
		let f0_for_target_orbit = argument_of_periapse_f(
			orbit_curve.eccentricity,
			sat.orbit.r,
			orbit_curve.upper_omega,
			orbit_curve.i
		).f;
		orbit_curve.set_t0(null, t_from_f(
									orbit_curve.type,
									f0_for_target_orbit,
									orbit_curve.e, 
									orbit_curve.a, 
									orbit_curve.T
								) - s_time
		);
		this.orbit_to_me = {
			sat: sat,
			orbit: orbit_curve
		};
		log('trajectory');
		log(this.orbit_to_me);
		return comp;
	};
	
	// Nombre del satélite
	name_set(name){
		this.name = name;
	};
	
	// Radio del satélite
	R_set(R){
		this.R = R;
	};
	
	// Masa del satélite
	m_set(m){
		this.m = m;
	};
	
	// Parámetro gravitatorio al que está sometido
	get_gravity(){
		if(this.orbited == null){
			return this.u;
		}else{
			return Satellite.get_sat( this.orbited ).u;
		};
	};
	
	// Posicion de impresión
	get_print_pos(){
		let pos = this.get_absolute_pos();
		return {
			x: pos.x - center.x,
			y: pos.y - center.y,
			z: pos.z - center.z
		};
	};
	
	// Posición absoluta del satélite orbitado
	get_absolute_pos(rel){
		
		// Posición del satélite orbitado
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
				relative = {
					x: orbited_pos.x + relative.x,
					y: orbited_pos.y + relative.y,
					z: orbited_pos.z + relative.z
				};
			};
			return Satellite.get_sat( this.orbited ).get_absolute_pos( relative );
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
		
		// Oblicuidad de la órbita
		this.axial_tilt = rot.tilt;
	};
	
	// Magnitudes físicas
	physics(dif){
		
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
			this.axial_tilt,
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
		
		// Acción
		this.orbit.sim( this.get_gravity() ); // Traslación
		this.rotate(); // Rotación
		
		if(this.orbit_to_me != undefined){
			this.orbit_to_me.orbit.sim( this.orbit_to_me.sat.get_gravity() );
		};
		
		this.rsoi = r_soi( this, Satellite.get_sat( this.orbited ) )
	};
	
	// Vista 1
	view1(request){
		
		// Órbita
		let print_pos = this.get_print_pos();
		this.orbit.view1( request, print_pos );
		
		// Control
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
			to_px( print_pos.x + this.orbit.r.x ),
			to_px( print_pos.y + this.orbit.r.y ),
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
			to_px( print_pos.x + this.orbit.r.x ),
			to_px( print_pos.y + this.orbit.r.y ),
			draw_rsoi,
			'RED'
		]);
		
		// Vector prueba
		if(this.name == center_body.name){
			let apos = this.get_absolute_pos();
			request.push([
				'line', 
				to_px( -center.x ),
				to_px( -center.y ),  
				to_px( -center.x + apos.x ),
				to_px( -center.y + apos.y ),
				'WHITE'
			]);
		};
		
		// Target (Future Position)
		if(this.target != undefined && this.orbit_to_me != undefined){
			
			let target_r = this.target.r;
			let target_v = this.target.v;
			this.orbit_to_me.orbit.view1(
				request,
				this.orbit_to_me.sat.get_print_pos()
			);
			
			// Vector r
			request.push([
				'line', 
				to_px( print_pos.x ),
				to_px( print_pos.y ),  
				to_px( print_pos.x + target_r.x ),
				to_px( print_pos.y + target_r.y ),
				'CYAN'
			]);
			
			// Vector v
			request.push([
				'line',
				to_px( print_pos.x + target_r.x ),
				to_px( print_pos.y + target_r.y ),
				
				// La longitud del vector se dibuja sin tener en cuenta la escala
				to_px( print_pos.x + target_r.x ) + target_v.x * 1e0,
				to_px( print_pos.y + target_r.y ) + target_v.y * 1e0,
				'CYAN'
			]);
		};
		
		// Vector r
		request.push([
			'line', 
			to_px( print_pos.x ),
			to_px( print_pos.y ),  
			to_px( print_pos.x + this.pos.x ),
			to_px( print_pos.y + this.pos.y ),
			color
		]);
		
		// Vector v
		request.push([
			'line',
			to_px( print_pos.x + this.pos.x ),
			to_px( print_pos.y + this.pos.y ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( print_pos.x + this.pos.x ) + this.vel.x * 1e0,
			to_px( print_pos.y + this.pos.y ) + this.vel.y * 1e0,
			color
		]);
		
		// Vector h
		request.push([
			'line',
			to_px( print_pos.x ),
			to_px( print_pos.y ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( print_pos.x ) + this.h_vec.x * 1e-5,
			to_px( print_pos.y ) + this.h_vec.y * 1e-5,
			"CYAN"
		]);
		
		// Eje de rotación
		request.push([
			'line',
			to_px( print_pos.x + this.orbit.r.x ),
			to_px( print_pos.y + this.orbit.r.y ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( print_pos.x + this.orbit.r.x ) + this.orbit.perturbation.rot_axis.x * 1e-5,
			to_px( print_pos.y + this.orbit.r.y ) + this.orbit.perturbation.rot_axis.y * 1e-5,
			"CYAN"
		]);
		
		// Nombre
		request.push([ 
			'print', 
			this.name,
			to_px( print_pos.x + this.orbit.r.x ) - 10, 
			to_px( print_pos.y + this.orbit.r.y ) + 10,
			color
		]);
	};
	
	// Vista 2
	view2(request){
		
		// Órbita
		let print_pos = this.get_print_pos();
		this.orbit.view2( request, print_pos );
		
		// Control
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
			to_px( print_pos.y + this.orbit.r.y ),
			to_px( print_pos.z + this.orbit.r.z ),
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
			to_px( print_pos.y + this.orbit.r.y ),
			to_px( print_pos.z + this.orbit.r.z ),
			draw_rsoi,
			'RED'
		]);
		
		// Vector prueba
		if(this.name == center_body.name){
			let apos = this.get_absolute_pos();
			request.push([
				'line', 
				to_px( -center.y ),
				to_px( -center.z ),  
				to_px( -center.y + apos.y ),
				to_px( -center.z + apos.z ),
				'WHITE'
			]);
		};
		
		// Target (Future Position)
		if(this.target != undefined && this.orbit_to_me != undefined){
			
			let target_r = this.target.r;
			let target_v = this.target.v;
			this.orbit_to_me.orbit.view2(
				request,
				this.orbit_to_me.sat.get_print_pos()
			);
			
			// Vector r
			request.push([
				'line', 
				to_px( print_pos.y ),
				to_px( print_pos.z ),  
				to_px( print_pos.y + target_r.y ),
				to_px( print_pos.z + target_r.z ),
				'CYAN'
			]);
			
			// Vector v
			request.push([
				'line',
				to_px( print_pos.y + target_r.y ),
				to_px( print_pos.z + target_r.z ),
				
				// La longitud del vector se dibuja sin tener en cuenta la escala
				to_px( print_pos.y + target_r.y ) + target_v.y * 1e0,
				to_px( print_pos.z + target_r.z ) + target_v.z * 1e0,
				'CYAN'
			]);
		};
		
		// Vector r
		request.push([
			'line', 
			to_px( print_pos.y ),
			to_px( print_pos.z ),  
			to_px( print_pos.y + this.pos.y ),
			to_px( print_pos.z + this.pos.z ),
			color
		]);
		
		// Vector v
		request.push([
			'line',
			to_px( print_pos.y + this.pos.y ),
			to_px( print_pos.z + this.pos.z ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( print_pos.y + this.pos.y ) + this.vel.y * 1e0,
			to_px( print_pos.z + this.pos.z ) + this.vel.z * 1e0,
			color
		]);
		
		// Vector h
		request.push([
			'line',
			to_px( print_pos.y ),
			to_px( print_pos.z ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( print_pos.y ) + this.h_vec.y * 1e-5,
			to_px( print_pos.z ) + this.h_vec.z * 1e-5,
			"CYAN"
		]);
		
		// Eje de rotación
		request.push([
			'line',
			to_px( print_pos.y + this.orbit.r.y ),
			to_px( print_pos.z + this.orbit.r.z ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( print_pos.y + this.orbit.r.y ) + this.orbit.perturbation.rot_axis.y * 1e-5,
			to_px( print_pos.z + this.orbit.r.z ) + this.orbit.perturbation.rot_axis.z * 1e-5,
			"CYAN"
		]);
		
		// Nombre 
		request.push([
			'print', 
			this.name,
			to_px( print_pos.y + this.orbit.r.y ) - 10, 
			to_px( print_pos.z + this.orbit.r.z ) + 10,
			color
		]);
	};
	
	// Variables del satélite
	constructor(name, orbited, R, m, u, pos, vel, rot, dif, ctrl){
		this.name_set(name);
		this.orbited = orbited;
		this.R_set(R);
		this.m_set(m);
		this.u = u;
		this.ctrl_set(ctrl);
		this.pos_set(pos);
		this.vel_set(vel);
		this.rotation_set(rot);
		this.physics(dif);
		Satellite.list.push(this);
	};
};