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
	static sat_from_orbit(name, orbited, R, u, a, e, rp, i, omega, upper_omega, rot, dif, f0){
		
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
			u,
			sat_at_t0.r,
			sat_at_t0.v,
			rot,
			dif,
			true
		);
	};
	
	// Nombre del satélite
	name_set(name){
		this.name = name;
	};
	
	// Radio del satélite
	R_set(R){
		this.R = R;
	};
	
	// Parámetro gravitatorio al que está sometido
	get_gravity(){
		if(this.orbited == null){
			return this.u;
		}else{
			return Satellite.get_sat( this.orbited ).u;
		};
	};
	
	// Posición del satélite orbitado
	get_orbited_pos(){
		if(this.orbited == null){
			return {
				x: 0,
				y: 0,
				z: 0
			};
		}else{
			return Satellite.get_sat( this.orbited ).orbit.r;
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
	};
	
	// Vista 1
	view1(request){
		
		// Órbita
		let orbited_pos = this.get_orbited_pos();
		let relative_pos = {
			x: center.x + orbited_pos.x,
			y: center.y + orbited_pos.y,
			z: center.z + orbited_pos.z
		};
		this.orbit.view1( request, relative_pos );
		
		// Control
		let color;
		if(this.ctrl){
			color = 'WHITE';
		}else{
			color = 'YELLOW';
		};
		
		// Posición absoluta
		request.push([
			'circle',
			to_px( relative_pos.x + this.pos.x ),
			to_px( relative_pos.y + this.pos.y ),
			1,
			color
		]);
		
		// Vector r
		request.push([
			'line', 
			to_px( relative_pos.x ),
			to_px( relative_pos.y ),  
			to_px( relative_pos.x + this.pos.x ),
			to_px( relative_pos.y + this.pos.y ),
			color
		]);
		
		// Vector v
		request.push([
			'line',
			to_px( relative_pos.x + this.pos.x ),
			to_px( relative_pos.y + this.pos.y ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( relative_pos.x + this.pos.x ) + this.vel.x * 1e0,
			to_px( relative_pos.y + this.pos.y ) + this.vel.y * 1e0,
			color
		]);
		
		// Vector h
		request.push([
			'line',
			to_px( relative_pos.x ),
			to_px( relative_pos.y ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( relative_pos.x ) + this.h_vec.x * 1e-5,
			to_px( relative_pos.y ) + this.h_vec.y * 1e-5,
			"CYAN"
		]);
		
		// Eje de rotación
		request.push([
			'line',
			to_px( relative_pos.x + this.orbit.r.x ),
			to_px( relative_pos.y + this.orbit.r.y ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( relative_pos.x + this.orbit.r.x ) + this.orbit.perturbation.rot_axis.x * 1e-5,
			to_px( relative_pos.y + this.orbit.r.y ) + this.orbit.perturbation.rot_axis.y * 1e-5,
			"CYAN"
		]);
		
		// Nombre
		request.push([ 
			'print', 
			this.name,
			to_px( relative_pos.x + this.orbit.r.x ) - 10, 
			to_px( relative_pos.y + this.orbit.r.y ) + 10,
			color
		]);
	};
	
	// Vista 2
	view2(request){
		
		// Órbita
		let orbited_pos = this.get_orbited_pos();
		let relative_pos = {
			x: center.x + orbited_pos.x,
			y: center.y + orbited_pos.y,
			z: center.z + orbited_pos.z
		};
		this.orbit.view2( request, relative_pos );
		
		// Control
		let color;
		if(this.ctrl){
			color = 'WHITE';
		}else{
			color = 'YELLOW';
		};
		
		// Posición absoluta
		request.push([
			'circle',
			to_px( relative_pos.y + this.pos.y ),
			to_px( relative_pos.z + this.pos.z ),
			1,
			color
		]);
		
		// Vector r
		request.push([
			'line', 
			to_px( relative_pos.y ),
			to_px( relative_pos.z ),  
			to_px( relative_pos.y + this.pos.y ),
			to_px( relative_pos.z + this.pos.z ),
			color
		]);
		
		// Vector v
		request.push([
			'line',
			to_px( relative_pos.y + this.pos.y ),
			to_px( relative_pos.z + this.pos.z ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( relative_pos.y + this.pos.y ) + this.vel.y * 1e0,
			to_px( relative_pos.z + this.pos.z ) + this.vel.z * 1e0,
			color
		]);
		
		// Vector h
		request.push([
			'line',
			to_px( relative_pos.y ),
			to_px( relative_pos.z ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( relative_pos.y ) + this.h_vec.y * 1e-5,
			to_px( relative_pos.z ) + this.h_vec.z * 1e-5,
			"CYAN"
		]);
		
		// Eje de rotación
		request.push([
			'line',
			to_px( relative_pos.y + this.orbit.r.y ),
			to_px( relative_pos.z + this.orbit.r.z ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( relative_pos.y + this.orbit.r.y ) + this.orbit.perturbation.rot_axis.y * 1e-5,
			to_px( relative_pos.z + this.orbit.r.z ) + this.orbit.perturbation.rot_axis.z * 1e-5,
			"CYAN"
		]);
		
		// Nombre 
		request.push([
			'print', 
			this.name,
			to_px( relative_pos.y + this.orbit.r.y ) - 10, 
			to_px( relative_pos.z + this.orbit.r.z ) + 10,
			color
		]);
	};
	
	// Variables del satélite
	constructor(name, orbited, R, u, pos, vel, rot, dif, ctrl){
		this.name_set(name);
		this.orbited = orbited;
		this.R = R;
		this.u = u;
		this.ctrl_set(ctrl);
		this.pos_set(pos);
		this.vel_set(vel);
		this.rotation_set(rot);
		this.physics(dif);
		Satellite.list.push(this);
	};
};