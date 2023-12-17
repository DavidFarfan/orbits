//--------SATÉLITE----------
class Satellite{
	
	// Lista de satélites
	static list = [];
	
	// Satélite controlado
	static ctrl = null;
	
	// Parámetro gravitacional del cuerpo orbitado
	static u = 0;
	
	// Rutina de control manual
	static ctrl_rutine(){
		
		// Cambiar posisición del satélite controlado
		var pos = {
			x: to_km( sat.x ) - center.x,
			y: to_km( sat.y ) - center.y,
			z: to_km( sat.z ) - center.z
		};
		
		// Cambiar velocidad del satélite controlado
		var vel = {
			x: sat.vx,
			y: sat.vy,
			z: sat.vz
		};
		
		// Iniciar una nueva simulación al cambiar las condiciones iniciales
		if(
			pos.x != Satellite.ctrl.pos.x ||
			pos.y != Satellite.ctrl.pos.y ||
			pos.z != Satellite.ctrl.pos.z ||
			vel.x != Satellite.ctrl.vel.x ||
			vel.y != Satellite.ctrl.vel.y ||
			vel.z != Satellite.ctrl.vel.z
		){
			Satellite.ctrl.pos_set(pos);
			Satellite.ctrl.vel_set(vel);
			Satellite.ctrl.physics();
			
			// Reiniciar tiempo de simulación
			ts0 = s_time;
		};
	};
	
	// Satélite a partir de la órbita
	static sat_from_orbit(name, u, a, e, rp, i, omega, upper_omega, rot, f0){
		
		// Construir el satélite en el punto f0
		let sat_at_t0 = invariants_from_elements(
			u,
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
			sat_at_t0.r,
			sat_at_t0.v,
			rot,
			true
		);
	};
	
	// Nombre del satélite
	name_set(name){
		this.name = name;
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
	physics(){
		
		// Ángulo entre r y v
		this.alpha = angle_between( this.pos, this.vel );
		
		// Vector momento angular
		this.h_vec = angular_momentum( this.pos, this.vel );
		
		// Momento angular
		this.h = norm_vec( this.h_vec );
		
		// Energía de órbita
		this.E = orbital_energy( this.v, Satellite.u, this.r );
		
		// Órbita
		this.orbit = new Orbit(
			this.h_vec,
			this.E,
			Satellite.u,
			this.vel,
			this.pos,
			this.axial_tilt
		);
	};
	
	// Rotación simulada
	rotate(ts){
		
		// Ascensión recta del meridiano cero
		this.GST = GST(
			this.sidereal_rotation_period,
			ts,
			this.GST0
		);
	};
	
	// Simmulación
	sim( ts, u ){
		
		// Acción
		this.orbit.set_sim( ts, u ); // Traslación
		this.rotate(ts); // Rotación
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
	constructor(name, pos, vel, rot, ctrl){
		this.name_set(name);
		this.ctrl_set(ctrl);
		this.pos_set(pos);
		this.vel_set(vel);
		this.rotation_set(rot);
		this.physics();
		Satellite.list.push(this);
	};
};