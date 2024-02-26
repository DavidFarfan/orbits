
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
var s_scale = 0; // Escala del espacio (kilómetros por pixel de lienzo)
var t_scale = 0; // Escala del tiempo (Segundos simulados por segundo real)
var center = { // Centro del lienzo (kilómetros): variable dep. el tiempo
	x: 0,
	y: 0,
	z: 0
};
var PHI = 0; // Latitud sobre el satélite controlado
var LAMBDA = 0; // Longitud sobre el satélite controlado
const origin = { // Coordenadas del origen en la pantalla
	x: width_p( .5 ),
	y: height_p( .5 )
};

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
	return s_scale * px;
};

// Converisión: Kilómetros a Pixeles
function to_px(x){
	return x / s_scale;
};

// CONVERSIÓN DE SEGUNDOS REALES A SEGUNDOS SIMULADOS
function to_sim_t(t){
	return t_scale * t;
};

// CONVERSIÓN DE SEGUNDOS SIMULADOS A SEGUNDOS REALES
function to_real_t(st){
	return st / t_scale;
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

//---------LOOP DE SIMULACIÓN------------
function orbitLoop(){
	
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
	Satellite.ctrl_rutine();
	
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
const posx_reduce = document.getElementById("posx_reduce");
posx_reduce.onclick = () => {
	Satellite.moved = -1;
};
const posx_increase = document.getElementById("posx_increase");
posx_increase.onclick = () => {
	Satellite.moved = 1;
};
const posy_reduce = document.getElementById("posy_reduce");
posy_reduce.onclick = () => {
	Satellite.moved = -2;
};
const posy_increase = document.getElementById("posy_increase");
posy_increase.onclick = () => {
	Satellite.moved = 2;
};
const posz_reduce = document.getElementById("posz_reduce");
posz_reduce.onclick = () => {
	Satellite.moved = -3;
};
const posz_increase = document.getElementById("posz_increase");
posz_increase.onclick = () => {
	Satellite.moved = 3;
};
const velx_reduce = document.getElementById("velx_reduce");
velx_reduce.onclick = () => {
	Satellite.moved = -4;
};
const velx_increase = document.getElementById("velx_increase");
velx_increase.onclick = () => {
	Satellite.moved = 4;
};
const vely_reduce = document.getElementById("vely_reduce");
vely_reduce.onclick = () => {
	Satellite.moved = -5;
};
const vely_increase = document.getElementById("vely_increase");
vely_increase.onclick = () => {
	Satellite.moved = 5;
};
const velz_reduce = document.getElementById("velz_reduce");
velz_reduce.onclick = () => {
	Satellite.moved = -6;
};
const velz_increase = document.getElementById("velz_increase");
velz_increase.onclick = () => {
	Satellite.moved = 6;
};
const ctrl_sat = document.getElementById("ctrl_sat");
const ctrl_button = document.getElementById("ctrl_button");
ctrl_button.onclick = () => {
	if( Satellite.get_sat( ctrl_sat.value ) != null ){
		set_center_ctrl( ctrl_sat.value );
		
		// Establecer partida y destino del targeting
		destin =  depart;
		depart = ctrl_sat.value;
		
		// Ver destino y partida
		log( '------ctrl-----' );
		log( 'Destination:' );
		log( destin );
		log( 'Departure' );
		log( depart );
	};
};

// Captura de parámetros del punto sobre la superficie del satélite controlado
const lat_slider = document.getElementById("lat");
lat_slider.oninput = () => {
	PHI = lat_slider.value * .5 * PI * ( 1 / lat_slider.max );
};
const long_slider = document.getElementById("long");
long_slider.oninput = () => {
	LAMBDA = long_slider.value * PI * ( 1 / long_slider.max );
};

// Captura de página de info. de simulación a desplegar
const display_page_button = document.getElementById("page");
display_page_button.onclick = () => {
	info_page = ( info_page + 1 ) % 2;
};

// Captura de tiempo de simulación
const text_time = document.getElementById("text_time");
const select_date = document.getElementById("select_date");
const button_time = document.getElementById("button_time");
button_time.onclick = () => {
	
	// Calcular días transcurridos de la fecha ingresada
	let date_in = new Date( select_date.value + " 12:00:00 GMT+00:00" );
	let dif_days = to_eday( ms_to_s( date_in.getTime() - EPOCH_J2000.getTime() ) );
	
	// Aplicar tiempo simulado 
	// (days from J2000)
	if(text_time.value == ''){
		s_base_time = eday_to_s( dif_days );
		
	// (selected date)
	}else{
		s_base_time = eday_to_s( Number( text_time.value ) );
	};
};
const button_time_add = document.getElementById("button_time_add");
button_time_add.onclick = () => {
	s_base_time += eday_to_s( Number( text_time.value ) );
};

// Captura de parámetros de escala de simulación
const s_scale_slider = document.getElementById("s_scale");
s_scale_slider.value = s_scale_slider.min;
s_scale_slider.oninput = () => {
	s_scale = s_scale_slider.value * center_body.R * 1e-2;
};
const t_scale_slider = document.getElementById("t_scale");
t_scale_slider.value = to_eday( t_scale );
t_scale_slider.oninput = () => {
	
	// Realizar el cambio de escala temporal
	t_scale = EDAY * t_scale_slider.value * 1e-2;
};
const stop_button = document.getElementById("stop_button");
stop_button.onclick = () => {
	
	// Detener el tiempo
	t_scale = 0;
	t_scale_slider.value = 0;
};

// Seleccionar vista con un click en el lienzo
canvas.addEventListener('click', () => {
	view_page = ( view_page + 1 ) % 3 + 1;
}, false);

// Tramo de vuelo
const phase = document.getElementById("phase");
phase.onclick = () => {
	log( 'New phase from: ' + Satellite.ctrl.name );
	
	// Crear un vehículo ditinto que parta de la posición simulada ctrl
	Satellite.flight_leg();
};

// Lanzamiento desde el satélite controlado
const launch_button = document.getElementById("launch");
launch_button.onclick = () => {
	Satellite.launch();
};

// Targeting
let desidred_time = 6 * EDAY;
const targeting_button = document.getElementById("targeting");
targeting_button.onclick = () => {
	if(destin != null & depart != null){
		log("---TARGETING----");
		Satellite.get_sat( destin ).elliptic_targeting(
			Satellite.get_sat( depart ),
			desidred_time
		).pos
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

// Comenzar loop del programa
setInterval( orbitLoop, s_to_ms( 1 / frac ) );