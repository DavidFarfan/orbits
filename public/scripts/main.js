//---------ANIMADOR------------

// Lienzo
const canvas = document.getElementById('view');

// Vista
var view = 1;

// P{agina de Información
var info = 0;

// Animador
const animator = new Worker("/scripts/animador.js");
const main_offscreen = canvas.transferControlToOffscreen();

// Puesta en marcha del animador
animator.postMessage({ type: 'context', canvas: main_offscreen }, [main_offscreen]);

// Gráfica de elementos orbitales (Dev)
var elem_curve = [];
var elem_curve_approx = [];

//-------PARÁMETROS DE LA SIMULACIÓN-----------

// Parámetros para el control manual
var mousePos = { // Posicion del mouse sobre el lienzo 1
	x: width_p( .5 ),
	y: height_p( .5 )
};
var sat = { // Condiciones iniciales del satélite controlado 
	x: 0,
	y: 0,
	z: 0,
	vx: 0,
	vy: 0,
	vz: 0
};

// Parámetros para la simulación del tiempo
var u_time; // Reloj universal
var u_seconds; // Segundero universal
var l_time = 0; // Reloj local
var l_seconds = '0'; // Segundero local
var s_base_time = 0; // Tiempo simulado base
var s_time = 0; // Tiempo simulado
var frac = 60; // Fracción de segundo real para el loop
var syncro_time = true; // Sincronización al tiempo real

// Cuerpo cetral
var center_body = null;

// Parámetros de escala de la simulación
var s_scale = 1e7; // Escala del espacio (kilómetros por pixel de lienzo)
var t_scale = 0; // Escala del tiempo (Segundos simulados por segundo real)
var center = { // Centro del lienzo (kilómetros)
	x: 0,
	y: 0,
	z: 0
};
var PHI = 0; // Latitud sobre el satélite controlado
var LAMBDA = 0; // Longitud sobre el satélite controlado

// Recursos de Horizons system
var ephemeris = null; // Efemérides

//--------UNIDADES DE SIMULACIÓN------------

// PORCENTAJE DE ANCHO DEL LIENZO
function width_p(p){
	return canvas.width * p;
};

// PORCENTAJE DE ALTO DEL LIENZO
function height_p(p){
	return canvas.height * p;
};

// CONVERSIÓN DE PIXELES A KILÓMETROS
function to_km(px){
	return s_scale * px;
};

// CONVERSIÓN DE KILÓMETROS A PIXELES
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
		
		// El reloj local se sincroniza con el reloj universal
		l_time += .1;
		
		// Agregar el equivalente de tiempo simulado que corresponde
		s_base_time += to_sim_t( .1 );
		
		// Corregir el tiempo que usa la simulación de órbitas
		s_time = s_base_time;
		
		// El segundero local sincroniza con el segundero universal
		l_seconds = u_seconds;
	};
	
	//------------CONTROL MANUAL---------
	Satellite.ctrl_rutine();
	
	//------------SIMULACIÓN------------
	
	// Centrar la cámara en la simulación del cuerpo central
	if(center_body != null){
		let orbited_pos = center_body.get_absolute_pos();
		if(center_body.orbit.r != undefined){
			center = {
				x: -to_km( width_p( .5 ) ) + orbited_pos.x + center_body.orbit.r.x,
				y: -to_km( width_p( .5 ) ) + orbited_pos.y + center_body.orbit.r.y,
				z: -to_km( width_p( .5 ) ) + orbited_pos.z + center_body.orbit.r.z
			};
		};
	};
	
	// Simular movimiento de los satélites
	Satellite.list.forEach(function(value, index, array){
		value.sim();
	});
	
	//------------SELECCIÓN DE VISTA-----------
	switch(view){
		case 1:
			View1.show(animator);
			break;
		case 2:
			View2.show(animator);
			break;
		case 3:
			View3.show(
				animator, 
				{
					x: width_p( .5 ),
					y: height_p( .5 )
				},
				PHI,
				LAMBDA
			);
			break;
	};
};

//------OBJETOS A SIMULAR--------------

// Sol (Cuerpo inicial)
Satellite.sat_from_orbit(
	'sun',
	null,
	SUNR,
	SUNMASS,
	SUN_U
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

center_body = Satellite.get_sat('earth');
Satellite.get_sat('earth').ctrl_set( true );

//------I/O-------------

// Recibir confirmación del animador
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

// Captura de parámetros del satélite controlado
const posx_slider = document.getElementById("posx");
posx_slider.oninput = () => {
	sat.x = posx_slider.value;
	Satellite.moved = true;
};
const posy_slider = document.getElementById("posy");
posy_slider.oninput = () => {
	sat.y = posy_slider.value;
	Satellite.moved = true;
};
const posz_slider = document.getElementById("posz");
posz_slider.oninput = () => {
	sat.z = posz_slider.value;
	Satellite.moved = true;
};
const velx_slider = document.getElementById("velx");
velx_slider.oninput = () => {
	sat.vx = velx_slider.value * ( 1e2 / velx_slider.max );
	Satellite.moved = true;
};
const vely_slider = document.getElementById("vely");
vely_slider.oninput = () => {
	sat.vy = vely_slider.value * ( 1e2 / vely_slider.max );
	Satellite.moved = true;
};
const velz_slider = document.getElementById("velz");
velz_slider.oninput = () => {
	sat.vz = velz_slider.value * ( 1e2 / velz_slider.max );
	Satellite.moved = true;
};

// Captura de parámetros del punto sobre la superficie del satélite controlado
const lat_slider = document.getElementById("lat");
lat_slider.oninput = () => {
	PHI = lat_slider.value * PI * ( 1 / lat_slider.max );
};
const long_slider = document.getElementById("long");
long_slider.oninput = () => {
	LAMBDA = long_slider.value * 2 * PI * ( 1 / long_slider.max );
};

// Captura de página de info. de simulación a desplegar
const display_page_button = document.getElementById("page");
display_page_button.onclick = () => {
	info = ( info + 1 ) % 2;
};

// Targeting
const targeting_button = document.getElementById("targeting");
targeting_button.onclick = () => {
	log("---COMPUTATIONS----");
	log(
		Satellite.get_sat("moon").elliptic_targeting(
			Satellite.get_sat("earth"),
			50 * EDAY
		).pos
	);
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
	// (days from epoch)
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
	s_scale = s_scale_slider.value * center_body.R * 1e0;
};
const t_scale_slider = document.getElementById("t_scale");
t_scale_slider.value = to_eday( t_scale );
t_scale_slider.oninput = () => {
	
	// Realizar el cambio de escala temporal
	t_scale = EDAY * t_scale_slider.value * 1e0;
};
const stop_button = document.getElementById("stop_button");
stop_button.onclick = () => {
	
	// Detener el tiempo
	t_scale = 0;
	t_scale_slider.value = 0;
};

// Seleccionar vista con un click en el lienzo
canvas.addEventListener('click', () => {
	view = ( view + 1 ) % 3 + 1;
}, false);

// Comenzar loop del programa
setInterval(orbitLoop, s_to_ms( 1 / frac ) );