
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
var time_lapse = 500; // Lapso entre comandos
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

// Converisión: Pixeles a Kilómetros
function to_km(px){
	return zoom * px;
};

// Converisión: Kilómetros a Pixeles
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
	
	// Calcular días transcurridos de la fecha ingresada
	let date_in = new Date( select_date.value + " 12:00:00 GMT+00:00" );
	let dif_days = to_eday( ms_to_s( date_in.getTime() - EPOCH_J2000.getTime() ) );
	
	// Fecha exacta
	if(text_time.value == ''){
		s_base_time = eday_to_s( dif_days );
		
	// Días desde J2000
	}else{
		s_base_time = eday_to_s( Number( text_time.value ) );
	};
};

// Adelantar tiempo de simulación
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
function sub_pos_x(){
	Satellite.moved = -1;
	punctual_changes = pos_x_punctual.value != '';
};
function add_pos_x(){
	Satellite.moved = 1;
	punctual_changes = pos_x_punctual.value != '';
};
function sub_pos_y(){
	Satellite.moved = -2;
	punctual_changes = pos_y_punctual.value != '';
};
function add_pos_y(){
	Satellite.moved = 2;
	punctual_changes = pos_y_punctual.value != '';
};
function sub_pos_z(){
	Satellite.moved = -3;
	punctual_changes = pos_z_punctual.value != '';
};
function add_pos_z(){
	Satellite.moved = 3;
	punctual_changes = pos_z_punctual.value != '';
};
function sub_vel_x(){
	Satellite.moved = -4;
	punctual_changes = vel_x_punctual.value != '';
};
function add_vel_x(){
	Satellite.moved = 4;
	punctual_changes = vel_x_punctual.value != '';
};
function sub_vel_y(){
	Satellite.moved = -5;
	punctual_changes = vel_y_punctual.value != '';
};
function add_vel_y(){
	Satellite.moved = 5;
	punctual_changes = vel_y_punctual.value != '';
};
function sub_vel_z(){
	Satellite.moved = -6;
	punctual_changes = vel_z_punctual.value != '';
};
function add_vel_z(){
	Satellite.moved = 6;
	punctual_changes = vel_z_punctual.value != '';
};

// Comandos de uso automático
function comDate(date){
	select_date.value = date;
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
function commandResolve(cmd){
	log(cmd[1]);
	switch(cmd[0]){
		case 'date':
			comDate(cmd[1]);
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
				commandResolve(commands[index]);
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
const pos_y_punctual = document.getElementById("pos_y_punctual");
const pos_z_punctual = document.getElementById("pos_z_punctual");
const vel_x_punctual = document.getElementById("vel_x_punctual");
const vel_y_punctual = document.getElementById("vel_y_punctual");
const vel_z_punctual = document.getElementById("vel_z_punctual");
const posx_reduce = document.getElementById("posx_reduce");
posx_reduce.onclick = () => {
	sub_pos_x();
};
const posx_increase = document.getElementById("posx_increase");
posx_increase.onclick = () => {
	add_pos_x();
};
const posy_reduce = document.getElementById("posy_reduce");
posy_reduce.onclick = () => {
	sub_pos_y();
}; 
const posy_increase = document.getElementById("posy_increase");
posy_increase.onclick = () => {
	add_pos_y();
};
const posz_reduce = document.getElementById("posz_reduce");
posz_reduce.onclick = () => {
	sub_pos_z();
};
const posz_increase = document.getElementById("posz_increase");
posz_increase.onclick = () => {
	add_pos_z();
};
const velx_reduce = document.getElementById("velx_reduce");
velx_reduce.onclick = () => {
	sub_vel_x();
};
const velx_increase = document.getElementById("velx_increase");
velx_increase.onclick = () => {
	add_vel_x();
};
const vely_reduce = document.getElementById("vely_reduce");
vely_reduce.onclick = () => {
	sub_vel_y();
};
const vely_increase = document.getElementById("vely_increase");
vely_increase.onclick = () => {
	add_vel_y();
};
const velz_reduce = document.getElementById("velz_reduce");
velz_reduce.onclick = () => {
	sub_vel_z();
};
const velz_increase = document.getElementById("velz_increase");
velz_increase.onclick = () => {
	add_vel_z();
};
const magnitude_punctual = document.getElementById("magnitude_punctual");
const magnitude_button = document.getElementById("magnitude_button");
magnitude_button.onclick = () => {
	set_magnitude();
};

const ctrl_sat = document.getElementById("ctrl_sat");
const ctrl_button = document.getElementById("ctrl_button");
const depart_label = document.getElementById("depart_label");
const destin_label = document.getElementById("destin_label");
ctrl_button.onclick = () => {
	select_sat_ctrl();
};
const adj_center = document.getElementById("adj_center");
const adjust_button = document.getElementById("adjust_button");
adjust_button.onclick = () => {
	adjust_center();
};
const delete_btn = document.getElementById("delete");
delete_btn.onclick = () => {
	Satellite.kill();
};

// Captura de parámetros del punto sobre la superficie del satélite controlado
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
	Satellite.ctrl.landing_coordinates();
	info_page = ( info_page + 1 ) % 2;
};

// Captura de tiempo de simulación
const text_time = document.getElementById("text_time");
const select_date = document.getElementById("select_date");
const button_time = document.getElementById("button_time");
button_time.onclick = () => {
	apply_time();
};

const button_time_add = document.getElementById("button_time_add");
button_time_add.onclick = () => {
	add_time();
};

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

// Targeting
const flight_time = document.getElementById("flight_time");
const targeting_button = document.getElementById("targeting");
const vel_vec_x_label = document.getElementById("vel_vec_x_label");
const vel_vec_y_label = document.getElementById("vel_vec_y_label");
const vel_vec_z_label = document.getElementById("vel_vec_z_label");
const a_min_label = document.getElementById("a_min_label");
const a_des_label = document.getElementById("a_des_label");
const a_max_label = document.getElementById("a_max_label");
const t_min_label = document.getElementById("t_min_label");
const t_des_label = document.getElementById("t_des_label");
const t_max_label = document.getElementById("t_max_label");
targeting_button.onclick = () => {
	if(destin != null & depart != null){
		let targeting_data = Satellite.get_sat( destin ).elliptic_targeting(
			Satellite.get_sat( depart ),
			flight_time.value * EDAY
		);
		
		// Ver info. del targeting
		vel_vec_x_label.innerHTML = significant( targeting_data.v.x, 10 );
		vel_vec_y_label.innerHTML = significant( targeting_data.v.y, 10 );
		vel_vec_z_label.innerHTML = significant( targeting_data.v.z, 10 );
		a_min_label.innerHTML = significant( targeting_data.a[0], 3 );
		a_des_label.innerHTML = significant( targeting_data.a[1], 3 );
		a_max_label.innerHTML = significant( targeting_data.a[2], 3 );
		t_min_label.innerHTML = significant( to_eday( targeting_data.t[0] ), 3 );
		t_des_label.innerHTML = significant( to_eday( targeting_data.t[1] ), 3 );
		t_max_label.innerHTML = significant( to_eday( targeting_data.t[2] ), 3 );
	};
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
	['date', '1969-07-16'],
	['addtime', '0.0637'],
	['ctrl', 'earth'],
	['phi', 28.5],
	['lambda', -80.5],
	['ra', -108],
	['d', 88],
	['launch'],
	['mag', '1.5'],
	['addtime', '0.001797'],
	['phase'],
	['mag', '4.4'],
	['addtime', '0.0009935'],
	['phase'],
	['mag_x', '-6.648940270'],
	['mag_y', '3.561158574'],
	['mag_z', '0.7578818935'],
	['addtime', '0.00138'],
	['phase'],
	['mag_x', '-7.314951100501277'],
	['mag_y', '2.637584335669657'],
	['mag_z', '0.6037253092682756'],
	['addtime', '0.08082'],
	['phase'],
	['mag_x', '0.8079985273'],
	['mag_y', '-10.92071'],
	['mag_z', '0.2612537019'],
	['addtime', '2.29'],
	['phase'],
	['center', 'moon'],
	['addtime', '0.661'],
	['phase'],
	['mag', '1.504'],
	['addtime', '0.312'],
	['phase'],
	['mag', '1.628'],
	['addtime', '.9'],
	['clone'],
	['addtime', '0.05'],
	['phase'],
	['mag', '1.6055'],
	['addtime', '0.032'],
	['phase'],
	['mag', '.6'],
	['addtime', '0.002'],
	['phase'],
	['mag', '1e-2'],
	['addtime', '0.0003'],
	['end'],
	['addtime', '0.826'],
	['phi', -3.833],
	['lambda', 23.27],
	['ra', 88],
	['d', 80],
	['launch'],
	['mag', '0.245'],
	['addtime', '0.0017452'],
	['phase'],
	['mag', '1.688'],
	['addtime', '0.038'],
	['phase'],
	['mag', '1.637'],
	['addtime', '0.1'],
	['phase'],
	['mag_x', '-1.012320220'],
	['mag_y', '-1.216002404'],
	['mag_z', '-0.4381437895'],
	['addtime', '0.036'],
	['ctrl', 'v012345678'],
	['ctrl', 'v1123'],
	['merge'],
	['addtime', '0.28'],
	['phase'],
	['mag', '2.58'],
	['addtime', '0.58'],
	['phase'],
	['center', 'earth'],
	['addtime', '2.2648'],
	['phase'],
	['mag', '1e-2'],
	['addtime', '0.00102'],
	['end']
];
trip();