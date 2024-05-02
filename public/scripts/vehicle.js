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
	
	// Copia del motor
	copy(){
		return new Engine(
			this.name,
			this.I,
			this.T
		);
	};
	
	// Características del motor
	constructor(name, I, T){
		this.name = name;
		this.set_specific_impulse(I);
		this.set_thrust(T);
	};
};

//---------ETAPA DE VEHICULO------------------------------------
class Stage{
	
	// Lista de etapas de vehículo
	static catalogue = {
		S_IC: [
			'S_IC',
			130000,
			2150000,
			[
				[ 5, Engine.get_engine('F1') ]
			]
		],
		S_II: [
			'S_II',
			37000,
			443000,
			[
				[ 5, Engine.get_engine('J2') ]
			]
		],
		S_IVB: [
			'S_IVB',
			14000,
			109000,
			[
				[ 1, Engine.get_engine('J2') ]
			]
		],
		SM: [
			'SM',
			6110,
			18410,
			[
				[ 1, Engine.get_engine('AJ10_137') ]
			]
		],
		LMD: [
			'LMD',
			1933,
			8567,
			[
				[ 1, Engine.get_engine('DPS') ]
			]
		],
		LMA: [
			'LMA',
			2347,
			2353,
			[
				[ 1, Engine.get_engine('APS') ]
			]
		],
		CM: [
			'CM',
			5560,
			0,
			[]
		]
	};
	
	// Ejemplar de una etapa de vehículo
	static get_stage(name){
		return new Stage(
			Stage.catalogue[name][0],
			Stage.catalogue[name][1],
			Stage.catalogue[name][2],
			Stage.catalogue[name][3]
		);
	};
	
	// Empty Mass (kg)
	set_empty_mass(me0){
		this.me0 = me0;
		this.me = me0;
	};
	
	// Propellant Mass (kg)
	set_prop_mass(mp0){
		this.mp0 = mp0;
		this.mp = mp0;
	};
	
	// Engines
	set_engines(engines){
		this.engines = engines;
	};
	
	// Set de motores en uso
	use_set(n){
		this.engine_set = n;
	};
	
	// Copia de la etapa
	copy(){
		let copy_stage = new Stage(
			this.name,
			this.me0,
			this.mp0,
			[]
		);
		
		// Copiar masas actuales
		copy_stage.me = this.me;
		copy_stage.mp = this.mp;
		
		// Copiar cada set de motores
		let copy_stage_engines = [];
		for(let i=0; i<this.engines.length; i++){
			copy_stage_engines.push(
				[ this.engines[i][0], this.engines[i][1].copy() ]
			);
		};
		
		// Agregar sets de motores
		copy_stage.set_engines( copy_stage_engines );
		
		// Seguir usando el mismo set de motores
		copy_stage.use_set( this.engine_set );
		return copy_stage;
	};
	
	// Características de la etapa
	constructor(name, me0, mp0, engines){
		this.name = name;
		this.set_empty_mass(me0);
		this.set_prop_mass(mp0);
		this.set_engines(engines);
		this.use_set(0);
	};
};

//---------VEHICULO------------------------------------
class Vehicle{
	
	// Lista de vehículos
	static catalogue = {
		SATURN_V: [
			'SATURN_V',
			[
				Stage.get_stage('CM'),
				Stage.get_stage('SM'),
				Stage.get_stage('LMA'),
				Stage.get_stage('LMD'),
				Stage.get_stage('S_IVB'),
				Stage.get_stage('S_II'),
				Stage.get_stage('S_IC')
			]
		]
	};
	
	// Ejemplar de un vehiculo
	static get_vehicle(name){
		return new Vehicle(
			Vehicle.catalogue[name][0],
			Vehicle.catalogue[name][1]
		);
	};
	
	// Stages
	set_stages(stages){
		this.stages = stages;
	};
	
	// Maneuver
	burn(dv){
		log( 'vehicle:' );
		log( this );
		
		// Masa total
		this.total_mass = 0;
		for(let i=0; i<this.stages.length; i++){
			this.total_mass += this.stages[i].me + this.stages[i].mp;
		}; 
		
		// Extracción y modificación de la etapa de propulsión
		let last_stage = this.stages.pop();
		log( 'stage:' );
		log( last_stage );
		
		// Delta v
		log('dv = ' + str( norm_vec( dv ) ) );
		
		// Retorno de la etapa de propulsión al vehículo
		this.stages.push( last_stage );
	};
	
	// Separation
	separate_stage(dv){
		let last_stage = this.stages.pop();
		log( 'stage separated:' );
		log( last_stage );
		this.burn(dv);
	};
	
	// Copia del vehículo
	copy(){
		let copy_vehicle = new Vehicle(
			this.name,
			[]
		);
		
		// Copiar cada etapa
		let copy_vehicle_stages = [];
		for(let i=0; i<this.stages.length; i++){
			copy_vehicle_stages.push( this.stages[i].copy() );
		};
		
		// Agregar etapas
		copy_vehicle.set_stages( copy_vehicle_stages );
		return copy_vehicle;
	};
	
	// Características del vehículo
	constructor(name, stages){
		this.name = name;
		this.set_stages(stages);
		this.total_mass = 0;
	};
};