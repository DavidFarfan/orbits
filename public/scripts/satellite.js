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
	static sat_from_orbit(name, orbited, u, a, e, rp, i, omega, upper_omega, rot, dif, f0){
		
		// Construir el satélite en el punto f0
		let GM = 1;
		if(orbited != null){
			GM = Satellite.get_sat(orbited).u;
		};
		let sat_at_t0 = invariants_from_elements(
			GM,
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
	
	// Parámetro gravitatorio al que está sometido
	get_gravity(){
		if(this.orbited == null){
			return 1;
		}else{
			return Satellite.get_sat( this.orbited ).u;
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
	
	// Posición absoluta
	pos_get(){
		return {
			x: center.x + this.pos.x,
			y: center.y + this.pos.y,
			z: center.z + this.pos.z
		};
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
		this.orbit.set_sim( this.get_gravity() ); // Traslación
		this.rotate(); // Rotación
	};
	
	// Vista 1
	view1(request){
		
		// Órbita
		this.orbit.view1(request);
		
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
			to_px( this.pos_get().x ),
			to_px( this.pos_get().y ),
			1,
			color
		]);
		
		// Vector r
		request.push([
			'line', 
			to_px( center.x ),
			to_px( center.y ),  
			to_px( this.pos_get().x ),
			to_px( this.pos_get().y ),
			color
		]);
		
		// Vector v
		request.push([
			'line',
			to_px( this.pos_get().x ),
			to_px( this.pos_get().y ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( this.pos_get().x ) + this.vel.x * 1e0,
			to_px( this.pos_get().y ) + this.vel.y * 1e0,
			color
		]);
		
		// Vector h
		request.push([
			'line',
			to_px( center.x ),
			to_px( center.y ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( center.x ) + this.h_vec.x * 1e-5,
			to_px( center.y ) + this.h_vec.y * 1e-5,
			"CYAN"
		]);
		
		// Eje de rotación
		request.push([
			'line',
			to_px( center.x + this.orbit.r.x ),
			to_px( center.y + this.orbit.r.y ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( center.x + this.orbit.r.x ) + this.orbit.perturbation.rot_axis.x * 1e-5,
			to_px( center.y + this.orbit.r.y ) + this.orbit.perturbation.rot_axis.y * 1e-5,
			"CYAN"
		]);
		
		// Nombre
		request.push([ 
			'print', 
			this.name,
			to_px( center.x + this.orbit.r.x ) - 10, 
			to_px( center.y + this.orbit.r.y ) + 10,
			color
		]);
	};
	
	// Vista 2
	view2(request){
		
		// Órbita
		this.orbit.view2(request);
		
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
			to_px( this.pos_get().y ),
			to_px( this.pos_get().z ),
			1,
			color
		]);
		
		// Vector r
		request.push([
			'line', 
			to_px( center.y ),
			to_px( center.z ),  
			to_px( this.pos_get().y ),
			to_px( this.pos_get().z ),
			color
		]);
		
		// Vector v
		request.push([
			'line',
			to_px( this.pos_get().y ),
			to_px( this.pos_get().z ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( this.pos_get().y ) + this.vel.y * 1e0,
			to_px( this.pos_get().z ) + this.vel.z * 1e0,
			color
		]);
		
		// Vector h
		request.push([
			'line',
			to_px( center.y ),
			to_px( center.z ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( center.y ) + this.h_vec.y * 1e-5,
			to_px( center.z ) + this.h_vec.z * 1e-5,
			"CYAN"
		]);
		
		// Eje de rotación
		request.push([
			'line',
			to_px( center.y + this.orbit.r.y ),
			to_px( center.z + this.orbit.r.z ),
			
			// La longitud del vector se dibuja sin tener en cuenta la escala
			to_px( center.y + this.orbit.r.y ) + this.orbit.perturbation.rot_axis.y * 1e-5,
			to_px( center.z + this.orbit.r.z ) + this.orbit.perturbation.rot_axis.z * 1e-5,
			"CYAN"
		]);
		
		// Nombre 
		request.push([
			'print', 
			this.name,
			to_px( center.y + this.orbit.r.y ) - 10, 
			to_px( center.z + this.orbit.r.z ) + 10,
			color
		]);
	};
	
	// Variables del satélite
	constructor(name, orbited, u, pos, vel, rot, dif, ctrl){
		this.name_set(name);
		this.orbited = orbited;
		this.u = u;
		this.ctrl_set(ctrl);
		this.pos_set(pos);
		this.vel_set(vel);
		this.rotation_set(rot);
		this.physics(dif);
		Satellite.list.push(this);
	};
};