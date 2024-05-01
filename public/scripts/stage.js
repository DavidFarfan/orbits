//---------ETAPA DE VEHICULO------------------------------------
class Stage{
	
	// Lista de etapas de vehículo
	static catalogue = {
		S_IC: [
			'S_IC',
			130000,
			2150000,
			[
				Engine.get_engine('F1'),
				Engine.get_engine('F1'),
				Engine.get_engine('F1'),
				Engine.get_engine('F1'),
				Engine.get_engine('F1')
			]
		],
		S_II: [
			'S_II',
			37000,
			443000,
			[
				Engine.get_engine('J2'),
				Engine.get_engine('J2'),
				Engine.get_engine('J2'),
				Engine.get_engine('J2'),
				Engine.get_engine('J2')
			]
		],
		S_IVB: [
			'S_IVB',
			14000,
			109000,
			[
				Engine.get_engine('J2')
			]
		],
		SM: [
			'SM',
			6110,
			18410,
			[
				Engine.get_engine('AJ10_137')
			]
		],
		LMD: [
			'LMD',
			1933,
			8567,
			[
				Engine.get_engine('DPS')
			]
		],
		LMA: [
			'LMA',
			2347,
			2353,
			[
				Engine.get_engine('APS')
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
	
	// Use
	use_it(){
		this.use = true;
	};
	unuse_it(){
		this.use = false;
	};
	
	// Características de la etapa
	constructor(name, me0, mp0, engines){
		this.name = name;
		this.set_empty_mass(me0);
		this.set_prop_mass(mp0);
		this.set_engines(engines);
		this.use_it();
	};
};

//---------VEHICULO------------------------------------
class Vehicle{
	
	// Características del vehículo
	constructor(){
	};
};