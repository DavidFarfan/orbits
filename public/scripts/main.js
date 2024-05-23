
//---------ANIMADOR------------
// Lienzo
const canvas = document.getElementById('view');
const main_offscreen = canvas.transferControlToOffscreen();

// Definición
const animator = new Worker("/scripts/animador.js");

// Puesta en marcha
animator.postMessage({ type: 'context', canvas: main_offscreen }, [main_offscreen]);

//-------PARÁMETROS DE LA SIMULACIÓN-----------
// Posición del mouse
var mousePos = { // Posicion inicial del mouse sobre el lienzo
	x: width_p( .5 ),
	y: height_p( .5 )
};

// Diferencial para el control de los satélites
var punctual_changes = false;
var sat = { 
	x: to_km( 0 ),
	y: to_km( 0 ),
	z: to_km( 0 ),
	vx: 0,
	vy: 0,
	vz: 0
};

// Variables de Vista
var view_page = 1; // Número de vista
var c1, c2; // Coordenadas de vista
var request; // Pedido al animador
var info_page = 0; // Página de Información

// Parámetros para la simulación del tiempo
var u_time; // Reloj universal
var u_seconds; // Segundero universal
var l_time = 0; // Reloj local
var l_seconds = '0'; // Segundero local
var s_base_time = 0; // Tiempo sim. base: Se cuenta por syncro: 1/10 de s
var s_time = 0; // Tiempo sim.: Se cuenta por fracción definida: 1/60 de s
var frac = 60; // Fracción de segundo real para el loop
var syncro_time = true; // Permitir syncro con el tiempo real

// Cuerpo central: centro de la cámara
var center_body = null;

// Contador de trayectorias creadas
var vehicles_trajectories = 0;

// Partida y Destino del targeting
var depart = null;
var destin = null;

// Parámetros de escala de la simulación
var s_scale = 1; // Escala de espacio
var t_scale = 1; // Escala de tiempo
var zoom = 0; // Zoom (kilómetros por pixel de lienzo)
var t_sense = 0; // Sentido y magnitud (Segundos simulados por segundo real)
var center = { // Centro del lienzo (kilómetros): variable dep. el tiempo
	x: 0,
	y: 0,
	z: 0
};
var PHI = 0; // Latitud sobre el satélite controlado
var LAMBDA = 0; // Longitud sobre el satélite controlado
var sight_RA = 0; // Ascención recta 
var sight_D = 0; // Declincación 
const origin = { // Coordenadas del origen en la pantalla
	x: width_p( .5 ),
	y: height_p( .5 )
};

// Instrucciones para la simulación de una misión
var time_lapse = 100; // Lapso entre comandos
var commands = []; // Comandos
var automatic = false; // Bandera para uso automático

// Recursos de Horizons system
var ephemeris = null; // Efemérides

//--------UTILIDADES------------
// Ir a un punto concreto del Tiempo
function set_time(t){
	s_base_time = t;
	s_time = s_base_time;
};

// Poner satélite en el centro y controlarlo
function set_center_ctrl(name){
	ctrl_sat.value = name;
	center_body = Satellite.get_sat( name );
	Satellite.get_sat( name ).ctrl_set( true );
};

// Porcentaje del ancho de lienzo
function width_p(p){
	return canvas.width * p;
};

// Porcentaje del alto de lienzo
function height_p(p){
	return canvas.height * p;
};

// Conversión: Pixeles a Kilómetros
function to_km(px){
	return zoom * px;
};

// Conversión: Kilómetros a Pixeles
function to_px(x){
	return x / zoom;
};

// CONVERSIÓN DE SEGUNDOS REALES A SEGUNDOS SIMULADOS
function to_sim_t(t){
	return t_sense * t;
};

// CONVERSIÓN DE SEGUNDOS SIMULADOS A SEGUNDOS REALES
function to_real_t(st){
	return st / t_sense;
};

// Pedir un círculo al animador
function view_circle(o, r, color){
	request.push([
		'circle',
		to_px( o[c1] ),
		to_px( o[c2] ),
		2,
		color
	]);
};

// Pedir un vector escalado al animador
function view_vec(o, vec, color){
	request.push([
		'line', 
		to_px( o[c1] ),
		to_px( o[c2] ),  
		to_px( o[c1] + vec[c1] ),
		to_px( o[c2] + vec[c2] ),
		color
	]);
};

// Pedir un vector no escalado al animador
function view_vec_abs(o, vec, mag, color){
	request.push([
		'line',
		to_px( o[c1] ),
		to_px( o[c2] ),
		
		// La longitud del vector se dibuja sin tener en cuenta la escala
		to_px( o[c1] ) + vec[c1] * pow( 10, mag ),
		to_px( o[c2] ) + vec[c2] * pow( 10, mag ),
		color
	]);
};

// Fijar tiempo de simulación
function apply_time(){
	
	// Fecha exacta
	if(text_time.value == ''){
		
		// Calcular tiempo transcurrido hasta la fecha ingresada desde J2000
		let date_in = new Date(
			select_date.value + ' ' + select_hour.value + ' GMT+00:00'
		);
		let dif_days = ms_to_s( date_in.getTime() - EPOCH_J2000.getTime() );
		s_base_time = dif_days;
		
	// Días desde J2000
	}else{
		s_base_time = eday_to_s( Number( text_time.value ) );
	};
};

// Sumar/Restar tiempo de simulación
function add_time(){
	s_base_time += eday_to_s( Number( text_time.value ) );
};

// Selección del satélite controlado
function select_sat_ctrl(){
	if( Satellite.get_sat( ctrl_sat.value ) != null ){
		set_center_ctrl( ctrl_sat.value );
		
		// Establecer partida y destino del targeting
		destin = depart;
		depart = ctrl_sat.value;
		
		// Ver destino y partida
		depart_label.innerHTML = depart;
		destin_label.innerHTML = destin;
	};
};

// Selección de parámetros de lanzamiento
function lat_set(){
	PHI = lat_slider.value * .5 * PI * ( 1 / lat_slider.max );
	lat_slider.value = PHI * 2 * ( 1 / PI ) * lat_slider.max;
};
function long_set(){
	LAMBDA = long_slider.value * PI * ( 1 / long_slider.max );
	long_slider.value = LAMBDA * ( 1 / PI ) * long_slider.max;
};
function D_set(){
	sight_D = d_slider.value * .5 * PI * ( 1 / d_slider.max );
	d_slider.value = sight_D * 2 * ( 1 / PI ) * d_slider.max;
};
function RA_set(){
	sight_RA = ra_slider.value * PI * ( 1 / ra_slider.max );
	ra_slider.value = sight_RA * ( 1 / PI ) * ra_slider.max;
};
function slider_lat_set(){
	lat_slider.value = PHI * 2 * ( 1 / PI ) * lat_slider.max;
	PHI = lat_slider.value * .5 * PI * ( 1 / lat_slider.max );
};
function slider_long_set(){
	long_slider.value = LAMBDA * ( 1 / PI ) * long_slider.max;
	LAMBDA = long_slider.value * PI * ( 1 / long_slider.max );
};
function slider_D_set(){
	d_slider.value = sight_D * 2 * ( 1 / PI ) * d_slider.max;
	sight_D = d_slider.value * .5 * PI * ( 1 / d_slider.max );
};
function slider_RA_set(){
	ra_slider.value = sight_RA * ( 1 / PI ) * ra_slider.max;
	sight_RA = ra_slider.value * PI * ( 1 / ra_slider.max );
};

// Cambiar la magnitud de la velocidad inicial del satélite controlado
function set_magnitude(){
	punctual_changes = true;
	Satellite.moved = 8;
};

// Ajustar el centro de un satélite
function adjust_center(){
	if( Satellite.get_sat( adj_center.value ) != null ){
		Satellite.moved = 7;
		Satellite.ctrl_routine( adj_center.value );
	};
};

// Ajustar Posición y Velocidad del satélite controlado
function sub_pos_x(punctual){
	Satellite.moved = -1;
	punctual_changes = punctual;
};
function add_pos_x(punctual){
	Satellite.moved = 1;
	punctual_changes = punctual;
};
function sub_pos_y(punctual){
	Satellite.moved = -2;
	punctual_changes = punctual;
};
function add_pos_y(punctual){
	Satellite.moved = 2;
	punctual_changes = punctual;
};
function sub_pos_z(punctual){
	Satellite.moved = -3;
	punctual_changes = punctual;
};
function add_pos_z(punctual){
	Satellite.moved = 3;
	punctual_changes = punctual;
};
function sub_vel_x(punctual){
	Satellite.moved = -4;
	punctual_changes = punctual;
};
function add_vel_x(punctual){
	Satellite.moved = 4;
	punctual_changes = punctual;
};
function sub_vel_y(punctual){
	Satellite.moved = -5;
	punctual_changes = punctual;
};
function add_vel_y(punctual){
	Satellite.moved = 5;
	punctual_changes = punctual;
};
function sub_vel_z(punctual){
	Satellite.moved = -6;
	punctual_changes = punctual;
};
function add_vel_z(punctual){
	Satellite.moved = 6;
	punctual_changes = punctual;
};

// Implementar vehiculo en un objeto satélite
function implement_vehicle(){
	let v = Vehicle.get_vehicle(vehicle_text.value);
	if(v != null){
		Satellite.ctrl.set_vehicle(v);
	};
};

// Impulso continuo (segundos)
function constant_burn(index, b_time, parts, add){
	
	// Variables de la maniobra
	let dt = b_time / parts; 						// Tiempo entre cada punto (s)
	let dv = 0; 									// Delta V puntual (m/s)
	let dp = Satellite.ctrl.vehicle.last_stage.mp;	// Propelente consumido (kg)
	let a_rray = [];								// Suma de maniobras puntuales
	let m_t = 0;									// Tiempo real de maniobra puntual (s)
	let m_t_days = 0;								// Conversión a días
	let e_T = Satellite.ctrl.vehicle.last_stage.get_current_engines()[1].T;
	let e_I = Satellite.ctrl.vehicle.last_stage.get_current_engines()[1].I;
	let e_n = Satellite.ctrl.vehicle.last_stage.get_current_engines()[0];
	let mass = Satellite.ctrl.vehicle.total_mass;	// Masa del vehículo antes de la maniobra (kg)
	let vel = norm_vec(Satellite.ctrl.orbit.v);		// Velocidad antes de la maniobra (m/s)
	let pos_steem = Satellite.ctrl.orbit.r;			// Posición vectorial estimada
	let vel_steem = Satellite.ctrl.orbit.v;			// Velocidad vectorial estimada
	let orbit_steem = Satellite.ctrl.orbit;			// Órbita estimada
	let available_prop = 							// propelente disponible 
		Satellite.ctrl.vehicle.last_stage.mp0
		- Satellite.ctrl.vehicle.last_stage.mp;
	
	// Maniobras puntuales
	for(var i=0; i<parts; i++){
		
		// Masa antes de la maniobra puntual (kg)
		mass -= dp;
		available_prop -= dp;
		
		// Terminar si el propelente no alcanza
		if(available_prop < 0){
			break;
		};
		
		// Delta V requerido, intervalo constante y masa variable (propelente)
		dv = dv_from_time(
			e_I,
			mass,
			dt,
			e_n,
			e_T
		);
		
		// Velocidad a impartir en el punto actual (km/s)
		if(add){
			vel += dv;
		}else{
			vel -= dv;
		};
		
		// Terminar si |v| < 0
		if(vel < 0){
			break;
		};
		
		// Propelente a consumir
		dp = maneuver_mp(mass, dv, e_I);
		
		// Tiempo estimado de la maniobra puntual	
		m_t = burn_time(
			dp,
			mass_flow( e_T, e_I ),
			e_n
		);
		m_t_days = m_t / ( 60 * 60 * 24 );
		
		// Adición de los comandos
		a_rray.push(['phase']);
		a_rray.push(['mag', str( vel )]);
		a_rray.push(['addtime', str( m_t_days )]);
		
		// órbita de la maniobra puntual
		vel_steem = prod_by_sc( vel, normalize_vec( vel_steem ) );
		orbit_steem = new Orbit(
			angular_momentum( pos_steem, vel_steem ),
			orbital_energy(
				norm_vec( vel_steem ),
				Satellite.ctrl.get_gravity(),
				norm_vec( pos_steem )
			),
			Satellite.ctrl.get_gravity(),
			vel_steem,
			pos_steem,
			orbit_steem.axial_tilt,
			{
				da: 0,
				de: 0,
				di: 0,
				dupper_omega: 0,
				dp: 0
			}
		);
		
		// Ajustar tiempo inicial
		let f0_adj = argument_of_periapse_f(
			orbit_steem.eccentricity,
			pos_steem,
			orbit_steem.upper_omega,
			orbit_steem.i
		).f;
		orbit_steem.set_t0(null, t_from_f(
										orbit_steem.type,
										f0_adj,
										orbit_steem.e, 
										orbit_steem.a, 
										orbit_steem.T,
										Satellite.ctrl.get_gravity()
									) - s_time
		);
		orbit_steem.sim( Satellite.ctrl.get_gravity() );
		
		// Velocidad final estimada de la maniobra puntual
		fic_pos = orbit_steem.fictional_pos(
			s_time + m_t,
			orbit_steem.t0,
			orbit_steem.f0,
			Satellite.ctrl.get_gravity()
		).pos;
		vel = norm_vec( fic_pos.v );
	};
	
	// Poner la suma de maniobras puntuales en la lista de espera
	commands = commands.slice().splice(0, index + 1)
		.concat(a_rray)
		.concat(commands.slice().splice(index + 1, commands.length));
	log(commands);
};

// Comandos de uso automático
function comDate(date, hour){
	select_date.value = date;
	select_hour.value = hour;
	apply_time();
	orbitLoop(true);
};
function comAddTime(days){
	text_time.value = days;
	add_time();
	orbitLoop(true);
};
function comCtrl(sat){
	ctrl_sat.value = sat;
	select_sat_ctrl();
	orbitLoop(true);
};
function comPhi(degrees){
	PHI = deg_to_rad( degrees );
	slider_lat_set();
	orbitLoop(true);
};
function comLambda(degrees){
	LAMBDA = deg_to_rad( degrees );
	slider_long_set();
	orbitLoop(true);
};
function comRA(degrees){
	sight_RA = deg_to_rad( degrees );
	slider_RA_set();
	orbitLoop(true);
};
function comD(degrees){
	sight_D = deg_to_rad( degrees );
	slider_D_set();
	orbitLoop(true);
};
function comLaunch(){
	Satellite.launch();
	orbitLoop(true);
};
function comVelMag(km_s){
	magnitude_punctual.value = km_s;
	set_magnitude();
	orbitLoop(true);
};
function comPhase(){
	Satellite.flight_leg();
	orbitLoop(true);
};
function comVelXMag(km_s){
	vel_x_punctual.value = km_s;
	add_vel_x();
	orbitLoop(true);
};
function comVelYMag(km_s){
	vel_y_punctual.value = km_s;
	add_vel_y();
	orbitLoop(true);
};
function comVelZMag(km_s){
	vel_z_punctual.value = km_s;
	add_vel_z();
	orbitLoop(true);
};
function comCenter(sat){
	adj_center.value = sat;
	adjust_center();
	orbitLoop(true);
};
function comClonePhase(){
	Satellite.clone_phase();
	Satellite.flight_leg();
	orbitLoop(true);
};
function comEnd(){
	Satellite.end_flight();
	orbitLoop(true);
};
function comMerge(){
	Satellite.merge_sats();
	orbitLoop(true);
};
function comVehicle(v){
	vehicle_text.value = v;
	implement_vehicle();
	orbitLoop(true);
};
function comJettison(){
	Satellite.ctrl.jettison();
	orbitLoop(true);
};
function comSeparate(n){
	Satellite.ctrl.separate_stages(n);
	orbitLoop(true);
};
function comConstBurn(index, b_time, parts, add){
	constant_burn(index, b_time, parts, add);
	orbitLoop(true);
};
function commandResolve(cmd, index){
	log('cmd: ' + cmd[0]);
	switch(cmd[0]){
		case 'date':
			comDate(cmd[1], cmd[2]);
			break;
		case 'addtime':
			comAddTime(cmd[1]);
			break;
		case 'ctrl':
			comCtrl(cmd[1]);
			break;
		case 'phi':
			comPhi(cmd[1]);
			break;
		case 'lambda':
			comLambda(cmd[1]);
			break;
		case 'ra':
			comRA(cmd[1]);
			break;
		case 'd':
			comD(cmd[1]);
			break;
		case 'launch':
			comLaunch();
			break;
		case 'mag':
			comVelMag(cmd[1]);
			break;
		case 'phase':
			comPhase();
			break;
		case 'mag_x':
			comVelXMag(cmd[1]);
			break;
		case 'mag_y':
			comVelYMag(cmd[1]);
			break;
		case 'mag_z':
			comVelZMag(cmd[1]);
			break;
		case 'center':
			comCenter(cmd[1]);
			break;
		case 'clone':
			comClonePhase();
			break;
		case 'merge':
			comMerge();
			break;
		case 'vehicle':
			comVehicle(cmd[1]);
			break;
		case 'jettison':
			comJettison();
			break;
		case 'separate':
			comSeparate(cmd[1]);
			break;
		case 'c_burn':
			comConstBurn(index, cmd[1], cmd[2], cmd[3]);
			break;
		case 'end':
			comEnd();
			break;
	};
};

// Rutina de simulación de misión
function trip(index){
	if(index >= commands.length){
		return;
	}else{
		setTimeout( () => {
			if(index == null){
				automatic = true;
				index = 0;
			};
			if(automatic){
				commandResolve(commands[index], index);
				automatic = false;
				trip(index + 1);
			}else{
				trip(index);
			};
		}, time_lapse);
	};
};

//---------LOOP DE SIMULACIÓN------------
function orbitLoop(auto){
	
	//------------CONTEO DEL TIEMPO------------
	
	// Agregar la unidad mínima de tiempo simulado
	s_time += to_sim_t( 1 / frac );
	
	// Verificar el segundero del reloj universal
	u_time = Date.now().toString();
	u_seconds = u_time.substr(-3).charAt(0);
	
	// Hacer un ajuste cada décima de segundo
	if(syncro_time && u_seconds != l_seconds){
		
		// Conteo del reloj local
		l_time += .1;
		
		// Equivalente del reloj local en tiempo sim.
		s_base_time += to_sim_t( .1 );
		
		// Syncro de sim. con el tiempo real
		s_time = s_base_time;
		
		// Esperar otra décima de segundo
		l_seconds = u_seconds;
	};
	
	//------------VARIABLES DEPENDIENTES DE LA ESCALA---------
	sat = { // Ajustar diferencial de distancia para el control de satélites.
		x: to_km( 1 ),
		y: to_km( 1 ),
		z: to_km( 1 ),
		vx: 1e-1,
		vy: 1e-1,
		vz: 1e-1
	};
	
	//------------SIMULACIÓN------------
	// Control manual
	Satellite.ctrl_routine();
	Satellite.phase_control();
	
	// Simular movimiento de los satélites
	Satellite.list.forEach(function(value, index, array){
		value.sim();
	});
	
	// Centrar la cámara en la sim. del cuerpo central
	if(center_body != null){
		let orbited_pos = center_body.get_absolute_r();
		if(orbited_pos != null){
			center = {
				x: orbited_pos.x - to_km( width_p( .5 ) ),
				y: orbited_pos.y - to_km( width_p( .5 ) ),
				z: orbited_pos.z - to_km( width_p( .5 ) )
			};
		};
	};
	
	// Gráficos
	View.show();
	
	// Uso automático
	if(auto){
		setTimeout(() => { 
			automatic = true;
		}, time_lapse);
	};
};

//------I/O-------------

// Recibir confirmación del animador (dev)
animator.addEventListener("message", (msg) => {
	//...
});

// Captura de posición del mouse
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
	var root = document.documentElement;
	
	// Posición relativa del mouse
    var mouseX = evt.clientX - rect.left - root.scrollLeft;
    var mouseY = evt.clientY - rect.top - root.scrollTop;
    return {
      x: mouseX,
      y: mouseY
    };
};
canvas.addEventListener('mousemove', evt => {
	mousePos = getMousePos(canvas, evt);
}, false);

// CONTROL DEL SATÉLITE
const pos_x_punctual = document.getElementById("pos_x_punctual");
pos_x_punctual.addEventListener("keydown", event => {
	if(event.key == "ArrowDown"){
		event.preventDefault();
		sub_pos_x();
	}else if(event.key == "ArrowUp"){
		event.preventDefault();
		add_pos_x();
	}else if(event.key == "Enter" && pos_x_punctual.value != ''){
		event.preventDefault();
		add_pos_x(true);
	}else if(event.key == "-"){
		event.preventDefault();
		if(pos_x_punctual.value[0] == '-'){
			pos_x_punctual.value = pos_x_punctual.value.substring( 1 );
		}else{
			pos_x_punctual.value = '-' + pos_x_punctual.value;
		};
	};
});
const pos_y_punctual = document.getElementById("pos_y_punctual");
pos_y_punctual.addEventListener("keydown", event => {
	if(event.key == "ArrowDown"){
		event.preventDefault();
		sub_pos_y();
	}else if(event.key == "ArrowUp"){
		event.preventDefault();
		add_pos_y();
	}else if(event.key == "Enter" && pos_y_punctual.value != ''){
		event.preventDefault();
		add_pos_y(true);
	}else if(event.key == "-"){
		event.preventDefault();
		if(pos_y_punctual.value[0] == '-'){
			pos_y_punctual.value = pos_y_punctual.value.substring( 1 );
		}else{
			pos_y_punctual.value = '-' + pos_y_punctual.value;
		};
	};
});
const pos_z_punctual = document.getElementById("pos_z_punctual");
pos_z_punctual.addEventListener("keydown", event => {
	if(event.key == "ArrowDown"){
		event.preventDefault();
		sub_pos_z();
	}else if(event.key == "ArrowUp"){
		event.preventDefault();
		add_pos_z();
	}else if(event.key == "Enter" && pos_z_punctual.value != ''){
		event.preventDefault();
		add_pos_z(true);
	}else if(event.key == "-"){
		event.preventDefault();
		if(pos_z_punctual.value[0] == '-'){
			pos_z_punctual.value = pos_z_punctual.value.substring( 1 );
		}else{
			pos_z_punctual.value = '-' + pos_z_punctual.value;
		};
	};
});
const vel_x_punctual = document.getElementById("vel_x_punctual");
vel_x_punctual.addEventListener("keydown", event => {
	if(event.key == "ArrowDown"){
		event.preventDefault();
		sub_vel_x();
	}else if(event.key == "ArrowUp"){
		event.preventDefault();
		add_vel_x();
	}else if(event.key == "Enter" && vel_x_punctual.value != ''){
		event.preventDefault();
		add_vel_x(true);
	}else if(event.key == "-"){
		event.preventDefault();
		if(vel_x_punctual.value[0] == '-'){
			vel_x_punctual.value = vel_x_punctual.value.substring( 1 );
		}else{
			vel_x_punctual.value = '-' + vel_x_punctual.value;
		};
	};
});
const vel_y_punctual = document.getElementById("vel_y_punctual");
vel_y_punctual.addEventListener("keydown", event => {
	if(event.key == "ArrowDown"){
		event.preventDefault();
		sub_vel_y();
	}else if(event.key == "ArrowUp"){
		event.preventDefault();
		add_vel_y();
	}else if(event.key == "Enter" && vel_y_punctual.value != ''){
		event.preventDefault();
		add_vel_y(true);
	}else if(event.key == "-"){
		event.preventDefault();
		if(vel_y_punctual.value[0] == '-'){
			vel_y_punctual.value = vel_y_punctual.value.substring( 1 );
		}else{
			vel_y_punctual.value = '-' + vel_y_punctual.value;
		};
	};
});
const vel_z_punctual = document.getElementById("vel_z_punctual");
vel_z_punctual.addEventListener("keydown", event => {
	if(event.key == "ArrowDown"){
		event.preventDefault();
		sub_vel_z();
	}else if(event.key == "ArrowUp"){
		event.preventDefault();
		add_vel_z();
	}else if(event.key == "Enter" && vel_z_punctual.value != ''){
		event.preventDefault();
		add_vel_z(true);
	}else if(event.key == "-"){
		event.preventDefault();
		if(vel_z_punctual.value[0] == '-'){
			vel_z_punctual.value = vel_z_punctual.value.substring( 1 );
		}else{
			vel_z_punctual.value = '-' + vel_z_punctual.value;
		};
	};
});
const magnitude_punctual = document.getElementById("magnitude_punctual");
magnitude_punctual.addEventListener("keydown", () => {
	if(event.key == "Enter" && magnitude_punctual.value != ''){
		set_magnitude();
	}else if(event.key == "-"){
		event.preventDefault();
		if(magnitude_punctual.value[0] == '-'){
			magnitude_punctual.value = magnitude_punctual.value.substring( 1 );
		}else{
			magnitude_punctual.value = '-' + magnitude_punctual.value;
		};
	};
});
const ctrl_sat = document.getElementById("ctrl_sat");
ctrl_sat.addEventListener("keydown", () => {
  if(event.key == "Enter"){
	  select_sat_ctrl();
  };
});
const adj_center = document.getElementById("adj_center");
adj_center.addEventListener("keydown", () => {
  if(event.key == "Enter"){
	  adjust_center();
  };
});
const depart_label = document.getElementById("depart_label");
const destin_label = document.getElementById("destin_label");
const adjust_button = document.getElementById("adjust_button");
const delete_btn = document.getElementById("delete");
delete_btn.onclick = () => {
	Satellite.kill();
};

// Captura de parámetros del punto sobre la superficie del satélite controlado
const lat_punctual = document.getElementById("lat_punctual");
lat_punctual.addEventListener("keydown", event => {
	if(event.key == "Enter"){
		PHI = deg_to_rad( lat_punctual.value );
		slider_lat_set();
	}else if(event.key == "-"){
		event.preventDefault();
		if(lat_punctual.value[0] == '-'){
			lat_punctual.value = lat_punctual.value.substring( 1 );
		}else{
			lat_punctual.value = '-' + lat_punctual.value;
		};
	};
});
const long_punctual = document.getElementById("long_punctual");
long_punctual.addEventListener("keydown", event => {
	if(event.key == "Enter"){
		LAMBDA = deg_to_rad( long_punctual.value );
		slider_long_set();
	}else if(event.key == "-"){
		event.preventDefault();
		if(long_punctual.value[0] == '-'){
			long_punctual.value = long_punctual.value.substring( 1 );
		}else{
			long_punctual.value = '-' + long_punctual.value;
		};
	};
});
const ra_punctual = document.getElementById("ra_punctual");
ra_punctual.addEventListener("keydown", event => {
	if(event.key == "Enter"){
		sight_RA = deg_to_rad( ra_punctual.value );
		slider_RA_set();
	}else if(event.key == "-"){
		event.preventDefault();
		if(ra_punctual.value[0] == '-'){
			ra_punctual.value = ra_punctual.value.substring( 1 );
		}else{
			ra_punctual.value = '-' + ra_punctual.value;
		};
	};
});
const d_punctual = document.getElementById("d_punctual");
d_punctual.addEventListener("keydown", event => {
	if(event.key == "Enter"){
		sight_D = deg_to_rad( d_punctual.value );
		slider_D_set();
	}else if(event.key == "-"){
		event.preventDefault();
		if(d_punctual.value[0] == '-'){
			d_punctual.value = d_punctual.value.substring( 1 );
		}else{
			d_punctual.value = '-' + d_punctual.value;
		};
	};
});
const lat_slider = document.getElementById("lat");
lat_slider.oninput = () => {
	lat_set();
};
const long_slider = document.getElementById("long");
long_slider.oninput = () => {
	long_set(); 
};
const d_slider = document.getElementById("d");
d_slider.oninput = () => {
	D_set();
};
const ra_slider = document.getElementById("ra");
ra_slider.oninput = () => {
	RA_set();
};

// Captura de página de info. de simulación a desplegar
const display_page_button = document.getElementById("page");
display_page_button.onclick = () => {
	info_page = ( info_page + 1 ) % 3;
};

// Captura de tiempo de simulación
const text_time = document.getElementById("text_time");
const select_label = document.getElementById("select_label");
const select_date = document.getElementById("select_date");
const label_hour = document.getElementById("label_hour");
const select_hour = document.getElementById("select_hour");
const label_time_add = document.getElementById("label_time_add");
const label_time_add_2 = document.getElementById("label_time_add_2");
text_time.addEventListener("keydown", event => {
	if(event.key == "Enter"){
		if(label_time_add_2.innerHTML[0] == 'A'){
			add_time();
		}else if(label_time_add_2.innerHTML[0] == 'S'){
			apply_time();
		};
	}else if(event.key == "-"){
		event.preventDefault();
		if(text_time.value[0] == '-'){
			text_time.value = text_time.value.substring( 1 );
		}else{
			text_time.value = '-' + text_time.value;
		};
	}else if(event.key == "ArrowDown"){
		event.preventDefault();
		label_time_add.innerHTML = 'Past J2000';
		text_time.value = "";
		select_date.style.visibility = 'visible';
		select_label.style.visibility = 'visible';
		select_hour.style.visibility = 'visible';
		label_hour.style.visibility = 'visible';
		label_time_add_2.innerHTML = 'Specific Time:';
	}else if(event.key == "ArrowUp"){
		event.preventDefault();
		label_time_add.innerHTML = 'From Now';
		text_time.value = "";
		select_date.style.visibility = 'hidden';
		select_label.style.visibility = 'hidden';
		select_hour.style.visibility = 'hidden';
		label_hour.style.visibility = 'hidden';
		label_time_add_2.innerHTML = 'Add/Sub Time';
	};
});

// Captura de parámetros de escala de simulación
const s_scale_slider = document.getElementById("s_scale");
s_scale_slider.value = s_scale_slider.min;
s_scale_slider.oninput = () => {
	s_scale = s_scale_slider.value * 2e-2;
	zoom = zoom_slider.value * center_body.R * pow( 10, s_scale );
};
const t_scale_slider = document.getElementById("t_scale");
t_scale_slider.value = t_scale_slider.min;
t_scale_slider.oninput = () => {
	t_scale = t_scale_slider.value * 2e-2;
	t_sense = EDAY * t_sense_slider.value * pow( 10, t_scale );
};
const zoom_slider = document.getElementById("zoom");
zoom_slider.value = zoom_slider.min;
zoom_slider.oninput = () => {
	zoom = zoom_slider.value * center_body.R * pow( 10, s_scale );
};
const t_sense_slider = document.getElementById("t_sense");
t_sense_slider.value = to_eday( t_sense );
t_sense_slider.oninput = () => {
	t_sense = EDAY * t_sense_slider.value * pow( 10, t_scale );
};
const stop_button = document.getElementById("stop_button");
stop_button.onclick = () => {
	
	// Detener el tiempo
	t_sense = 0;
	t_sense_slider.value = 0;
};

// Seleccionar vista con un click en el lienzo
canvas.addEventListener('click', () => {
	view_page = ( view_page + 1 ) % 3 + 1;
}, false);

// Tramo de vuelo
const phase = document.getElementById("phase");
phase.onclick = () => {
	
	// Pasar settings a otro satélite
	Satellite.flight_leg();
};

// Desacoplamiento
const undock = document.getElementById("undock");
undock.onclick = () => {
	
	// Copiar settings en otro satélite
	Satellite.clone_phase();
};

// Acoplamiento
const dock = document.getElementById("dock");
dock.onclick = () => {
	
	// Unir dos satélites en uno
	Satellite.merge_sats();
};

// Fin del vuelo
const end_sat = document.getElementById("end_sat");
end_sat.onclick = () => {
	
	// Terminar vuelo
	Satellite.end_flight();
};

// Lanzamiento desde el satélite controlado
const launch_button = document.getElementById("launch");
launch_button.onclick = () => {
	Satellite.launch();
};

// Vectores fundamentales de la órbita
const asc_node_checkbox = document.getElementById("asc_node_checkbox");
const periapse_checkbox = document.getElementById("periapse_checkbox");
const semi_lat_checkbox = document.getElementById("semi_lat_checkbox");
const momentum_checkbox = document.getElementById("momentum_checkbox");
const rotation_checkbox = document.getElementById("rotation_checkbox");

// Otra información de la órbita
const epoch_checkbox = document.getElementById("epoch_checkbox");
const orbit_dim_checkbox = document.getElementById("orbit_dim_checkbox");

// Targeting
const flight_time = document.getElementById("flight_time");
const vel_vec_x_label = document.getElementById("vel_vec_x_label");
const vel_vec_y_label = document.getElementById("vel_vec_y_label");
const vel_vec_z_label = document.getElementById("vel_vec_z_label");
const t_min_label = document.getElementById("t_min_label");
const t_des_label = document.getElementById("t_des_label");
const t_max_label = document.getElementById("t_max_label");
flight_time.addEventListener("keydown", event => {
	if(event.key == "Enter"){
		event.preventDefault();
		if(destin != null & depart != null){
			let targeting_data = Satellite.get_sat( destin ).elliptic_targeting(
				Satellite.get_sat( depart ),
				flight_time.value * EDAY
			);
			
			// Ver info. del targeting
			vel_vec_x_label.innerHTML = significant( targeting_data.v.x, 10 );
			vel_vec_y_label.innerHTML = significant( targeting_data.v.y, 10 );
			vel_vec_z_label.innerHTML = significant( targeting_data.v.z, 10 );
			t_min_label.innerHTML = significant( to_eday( targeting_data.t[0] ), 10 );
			t_des_label.innerHTML = significant( to_eday( targeting_data.t[1] ), 10 );
			t_max_label.innerHTML = significant( to_eday( targeting_data.t[2] ), 10 );
		};
	}else if(event.key == "-"){
		event.preventDefault();
		if(flight_time.value[0] == '-'){
			flight_time.value = flight_time.value.substring( 1 );
		}else{
			flight_time.value = '-' + flight_time.value;
		};
	};
});

// Dirección del apsis
const apsis = document.getElementById("apsis");
const apsis_vec_x_label = document.getElementById("apsis_vec_x_label");
const apsis_vec_y_label = document.getElementById("apsis_vec_y_label");
const apsis_vec_z_label = document.getElementById("apsis_vec_z_label");
apsis.onclick = () => {
	let apsis_data = normalize_vec(cof_cross_prod(
		Satellite.ctrl.orbit.r,
		Satellite.ctrl.h_vec,
	));
		
	// Ver dirección del apsis
	apsis_vec_x_label.innerHTML = significant( apsis_data.x, 10 );
	apsis_vec_y_label.innerHTML = significant( apsis_data.y, 10 );
	apsis_vec_z_label.innerHTML = significant( apsis_data.z, 10 );
};

// Aplicar componentes de velocidad del apsis
const apply_apsis = document.getElementById("apply_apsis");
apply_apsis.onclick = () => {
	vel_x_punctual.value = apsis_vec_x_label.innerHTML;
	vel_y_punctual.value = apsis_vec_y_label.innerHTML;
	vel_z_punctual.value = apsis_vec_z_label.innerHTML;
};

// Aplicar componentes de velocidad del targeting
const apply_vel = document.getElementById("apply_vel");
apply_vel.onclick = () => {
	vel_x_punctual.value = vel_vec_x_label.innerHTML;
	vel_y_punctual.value = vel_vec_y_label.innerHTML;
	vel_z_punctual.value = vel_vec_z_label.innerHTML;
};

// Saltar al epoch
const epoch_button = document.getElementById("epoch_button");
epoch_button.onclick = () => {
	set_time( Satellite.ctrl.orbit.epoch );
};

// implementación de un vehículo
const vehicle_text = document.getElementById("vehicle_text");
vehicle_text.addEventListener("keydown", event => {
	if(event.key == "Enter"){
		event.preventDefault();
		implement_vehicle();
	};
});
const jettison_button = document.getElementById("jettison");
jettison_button.onclick = () => {
	Satellite.ctrl.jettison();
};

//-------PROGRAMA PRINCIPAL-----------

// OBJETOS A SIMULAR
// Sol (Cuerpo inicial)
Satellite.sat_from_orbit(
	'sun',
	null,
	SUNR,
	SUNMASS,
	SUN_U
);

// Tierra (SE J2000)
Satellite.sat_from_orbit(
	'earth',
	'sun',
	ER,
	EMASS,
	E_U,
	E_INITIAL_SEMI_MAJOR_AXIS,
	E_INITIAL_ECCENTRICITY,
	E_INITIAL_PERIAPSE,
	E_INITIAL_INCLINATION,
	E_INITIAL_ARGUMENT_OF_PERIHELION,
	E_INITIAL_LONGITUDE_OF_ASCENDING_NODE,
	{
		T: E_SIDEREAL_ROTATION_PERIOD,
		t0: E_INITIAL_GST,
		tilt: E_AXIAL_TILT
	},
	{
		da: E_DIFF_SEMI_MAJOR_AXIS,
		de: E_DIFF_ECCENTRICITY,
		di: E_DIFF_INCLINATION,
		dupper_omega: E_DIFF_LONGITUDE_OF_ASCENDING_NODE,
		dp: E_DIFF_LONGITUDE_OF_PERIAPSE
	},
	E_INITIAL_TRUE_ANOMALY
);

// Luna (SE J2000)
Satellite.sat_from_orbit(
	'moon',
	'earth',
	MOONR,
	MOONMASS,
	MOON_U,
	MOON_INITIAL_SEMI_MAJOR_AXIS,
	MOON_INITIAL_ECCENTRICITY,
	MOON_INITIAL_PERIAPSE,
	MOON_INITIAL_INCLINATION,
	MOON_INITIAL_ARGUMENT_OF_PERIGEE,
	MOON_INITIAL_LONGITUDE_OF_ASCENDING_NODE,
	{
		T: MOON_SIDEREAL_ROTATION_PERIOD,
		t0: MOON_INITIAL_GST,
		tilt: MOON_AXIAL_TILT
	},
	{
		da: MOON_DIFF_SEMI_MAJOR_AXIS,
		de: MOON_DIFF_ECCENTRICITY,
		di: MOON_DIFF_INCLINATION,
		dupper_omega: MOON_DIFF_LONGITUDE_OF_ASCENDING_NODE,
		dp: MOON_DIFF_LONGITUDE_OF_PERIAPSE
	},
	MOON_INITIAL_TRUE_ANOMALY
);

// Ceres (SE J2000, no perturbations)
Satellite.sat_from_orbit(
	'ceres',
	'sun',
	CR,
	CMASS,
	C_U,
	C_INITIAL_SEMI_MAJOR_AXIS,
	C_INITIAL_ECCENTRICITY,
	C_INITIAL_PERIAPSE,
	C_INITIAL_INCLINATION,
	C_INITIAL_ARGUMENT_OF_PERIHELION,
	C_INITIAL_LONGITUDE_OF_ASCENDING_NODE,
	{
		T: C_SIDEREAL_ROTATION_PERIOD,
		t0: C_INITIAL_GST,
		tilt: C_AXIAL_TILT
	},
	{
		da: C_DIFF_SEMI_MAJOR_AXIS,
		de: C_DIFF_ECCENTRICITY,
		di: C_DIFF_INCLINATION,
		dupper_omega: C_DIFF_LONGITUDE_OF_ASCENDING_NODE,
		dp: C_DIFF_LONGITUDE_OF_PERIAPSE
	},
	C_INITIAL_TRUE_ANOMALY
);

// Venus (SE J2000)
Satellite.sat_from_orbit(
	'venus',
	'sun',
	VR,
	VMASS,
	V_U,
	V_INITIAL_SEMI_MAJOR_AXIS,
	V_INITIAL_ECCENTRICITY,
	V_INITIAL_PERIAPSE,
	V_INITIAL_INCLINATION,
	V_INITIAL_ARGUMENT_OF_PERIHELION,
	V_INITIAL_LONGITUDE_OF_ASCENDING_NODE,
	{
		T: V_SIDEREAL_ROTATION_PERIOD,
		t0: V_INITIAL_GST,
		tilt: V_AXIAL_TILT
	},
	{
		da: V_DIFF_SEMI_MAJOR_AXIS,
		de: V_DIFF_ECCENTRICITY,
		di: V_DIFF_INCLINATION,
		dupper_omega: V_DIFF_LONGITUDE_OF_ASCENDING_NODE,
		dp: V_DIFF_LONGITUDE_OF_PERIAPSE
	},
	V_INITIAL_TRUE_ANOMALY
);

// Mars (SE J2000)
Satellite.sat_from_orbit(
	'mars',
	'sun',
	MR,
	MMASS,
	M_U,
	M_INITIAL_SEMI_MAJOR_AXIS,
	M_INITIAL_ECCENTRICITY,
	M_INITIAL_PERIAPSE,
	M_INITIAL_INCLINATION,
	M_INITIAL_ARGUMENT_OF_PERIHELION,
	M_INITIAL_LONGITUDE_OF_ASCENDING_NODE,
	{
		T: M_SIDEREAL_ROTATION_PERIOD,
		t0: M_INITIAL_GST,
		tilt: M_AXIAL_TILT
	},
	{
		da: M_DIFF_SEMI_MAJOR_AXIS,
		de: M_DIFF_ECCENTRICITY,
		di: M_DIFF_INCLINATION,
		dupper_omega: M_DIFF_LONGITUDE_OF_ASCENDING_NODE,
		dp: M_DIFF_LONGITUDE_OF_PERIAPSE
	},
	M_INITIAL_TRUE_ANOMALY
);

// Asignar y controlar el satélite central
set_center_ctrl('sun');
s_scale = s_scale_slider.value * 2e-2;
zoom = zoom_slider.value * center_body.R * pow( 10, s_scale );

// Comenzar loop del programa
setInterval( orbitLoop, s_to_ms( 1 / frac ) );

// Comandos de misión simulada
commands = [
	/*
	['date', '1969-07-16', '13:32:05'],
	['ctrl', 'earth'],
	['phi', 28.5],
	['lambda', -80.5],
	['ra', 73],
	['d', 88],
	['launch'],
	['vehicle', 'SATURN_V'],
	['mag', '.1297'],
	['addtime', '0.00015'],
	['phase'],
	['mag', '2.9'],
	['addtime', '0.001655'],
	['phase'],
	['jettison'],
	['mag', '6.81'],
	['addtime', '0.0047'],
	['phase'],
	['jettison'],
	['mag_x', '-0.5229073288'],
	['mag_y', '0.8420810382'],
	['mag_z', '0.1321644829'],
	['mag', '-7.8'],
	['addtime', '0.098993'],
	['phase'],
	['mag', '10.95'],
	['addtime', '0.073'],
	['phase'],
	['vehicle', 'CSM_LM'],
	['addtime', '0.9361'],
	['phase'],
	['mag_x', '1.429985306'],
	['mag_y', '-0.1897926819'],
	['mag_z', '-0.005974913849'],
	['mag', '1.45876'],
	['addtime', '1.52978'],
	['phase'],
	['center', 'moon'],
	['addtime', '0.52083'],
	['phase'],
	['mag_x', '-0.2534614864'],
	['mag_y', '-0.9626328598'],
	['mag_z', '-0.09536903086'],
	['mag', '1.6704'],
	['addtime', '0.17870'],
	['phase'],
	['mag', '1.63'],
	['addtime', '0.82700'],
	['clone'],
	['separate', 2],
	['ctrl', 'v012345678910'],
	['vehicle', 'LM'],
	['addtime', '0.08240'],
	['phase'],
	['mag', '1.607'],
	['addtime', '0.02823'],
	['c_burn', 420, 20, false],
	['end'],
	['addtime', '0.9068'],
	['phi', 0.5],
	['lambda', 23.47],
	['ra', 88],
	['d', 88],
	['launch'],
	['vehicle', 'LM'],
	['jettison'],
	['c_burn', 94, 20, true],
	['addtime', '0.00124'],
	['phase'],
	['mag', '1.688'],
	['addtime', '0.03868'],
	['phase'],
	['mag_x', '0.6758985884'],
	['mag_y', '-0.7355881534'],
	['mag_z', '-0.04551007323'],
	['mag', '1.638'],
	['addtime', '0.06077'],
	['phase'],
	['mag_x', '1.204147339'],
	['mag_y', '1.111137938'],
	['mag_z', '0.05455444136'],
	['addtime', '0.036'],
	['ctrl', 'v012345678911'],
	['ctrl', 'v11234567891011121314151617181920212223'],
	['merge'],
	*/
];
trip();