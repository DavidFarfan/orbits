//---------MOTOR------------------------------------
class Engine{
	
	// Lista de motores
	static catalogue = {
		F1: ['F1', 263, 6770],
		J2: ['J2', 421, 880],
		AJ10_137: ['AJ10_137', 314, 91],
		DPS: ['DPS', 311, 47],
		APS: ['APS', 311, 16]
	};
	
	// Ejemplar de un tipo de motor
	static get_engine(name){
		return new Engine(
			Engine.catalogue[name][0],
			Engine.catalogue[name][1],
			Engine.catalogue[name][2]
		);
	};
	
	// Specific Impulse (s)
	set_specific_impulse(I){
		this.I = I;
	};
	
	// Thrust (kN)
	set_thrust(T){
		this.T = T;
	};
	
	// Use
	use_it(){
		this.use = true;
	};
	unuse_it(){
		this.use = false;
	};
	
	// Características del motor
	constructor(name, I, T){
		this.name = name;
		this.set_specific_impulse(I);
		this.set_thrust(T);
		this.use_it();
	};
};