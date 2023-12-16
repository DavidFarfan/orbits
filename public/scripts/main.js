//---------ANIMADOR------------

// Lienzo
const canvas1 = document.getElementById('view1');
var view = 1;

// Animador
const animator1 = new Worker("/scripts/animador.js");
const main_offscreen_1 = canvas1.transferControlToOffscreen();

// Puesta en marcha del animador
animator1.postMessage({ type: 'context', canvas: main_offscreen_1 }, [main_offscreen_1]);

//-------PARÁMETROS DE LA SIMULACIÓN-----------

// Parámetros básicos
Satellite.u = SUN_U; // Astro orbitado

// Parámetros para el control manual
var mousePos1 = { // Posicion del mouse sobre el lienzo 1
	x: width_p( .5 ),
	y: height_p( .5 )
};
var mousePos2 = { // Posicion del mouse sobre el lienzo 2
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
var s_time = 0; // Tiempo absoluto simulado
var ts0 = 0; // Tiempo inicial de la simulación
var ts = 0; // Tiempo actual de la simulación
var carried_time = 0; // Tiempo acarreado desde el último cambio de escala
var carried_seconds = 0; // Segundos del tiempo acarreado
var frac = 60; // Fracción de segundo real para el loop

// Parámetros de escala de la simulación
var s_scale = 3.5 * SUNR; // Escala del espacio (kilómetros por pixel de lienzo)
var t_scale = 0; // Escala del tiempo (Segundos simulados por segundo real)
var center = { // Punto de referencia (kilómetros)
	x: to_km( width_p( .5 ) ),
	y: to_km( height_p( .5 ) ),
	z: to_km( height_p( .5 ) )
};
var PHI = 0; // Latitud sobre el satélite
var LAMBDA = 0; // Longitud sobre el satélite

// Recursos de Horizons system
var ephemeris = null; // Efemérides

//--------UNIDADES DE SIMULACIÓN------------

// PORCENTAJE DE ANCHO DEL LIENZO
function width_p(p){
	return canvas1.width * p;
};

// PORCENTAJE DE ALTO DEL LIENZO
function height_p(p){
	return canvas1.height * p;
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
	
	// Agregar la fracción de tiempo simulado que corresponde
	s_time += to_sim_t( 1 / frac );
	
	// Verificar el segundero del reloj universal
	u_time = Date.now().toString();
	u_seconds = u_time.substr(-3).charAt(0);
	
	// Hacer un ajuste cada décima de segundo
	if(u_seconds != l_seconds){
		
		// El reloj local se sincroniza con el reloj universal
		l_time += .1;
		
		// El tiempo simulado se sincroniza con el reloj local
		s_time = carried_time + ( l_time - carried_seconds ) * to_sim_t( 1 );
		
		// El segundero local sincroniza con el segundero universal
		l_seconds = u_seconds;
	};
	
	// Calcular tiempo actual de simulación
	ts = s_time - ts0;
	
	//------------CONTROL MANUAL---------
	//Satellite.ctrl_rutine();
	
	//------------SIMULACIÓN------------
	
	// Centrar en el recorrido simulado del satélite controlado
	if(Satellite.ctrl.orbit.r != undefined){
		center = {
			x: to_km( width_p( .5 ) ) - Satellite.ctrl.orbit.r.x,
			y: to_km( width_p( .5 ) ) - Satellite.ctrl.orbit.r.y,
			z: to_km( width_p( .5 ) ) - Satellite.ctrl.orbit.r.z
		};
	};
	
	// Simular movimiento de los satélites
	Satellite.list.forEach(function(value, index, array){
		value.sim( ts, Satellite.u );
	});
	
	//------------SELECCIÓN DE VISTA-----------
	switch(view){
		case 1:
			view1(animator1, ephemeris);
			break;
		case 2:
			view2(animator1, ephemeris);
			break;
		case 3:
			view3(
				animator1, 
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

//------I/O-------------

// Recibir confirmación del animador
animator1.addEventListener("message", (msg) => {
  log( msg.data );
});

// Recibir efemérides de la NASA
self.onmessage = (e) => {
	switch (e.data.type) {
		case 'ephemeris':
			ephemeris = e.data.eph;
			break;
	};
};

// Comunicación con Horizons system
$(document).ready((data, status) => {
	
	// Efemérides cartesianas de la tierra (01-01-2000 a 01-01-2001)
	$.get(
		"https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND='399'&OBJ_DATA='NO'&MAKE_EPHEM='YES'&EPHEM_TYPE='VECTORS'&CENTER='500@10'&START_TIME='2000-01-01 12:00'&STOP_TIME='2000-12-01 12:00'&STEP_SIZE='1mo'",
		(data, status) => {
			log( data );
			let aux1 = data.split( 'TDB' ).slice( 4, 16 );
			let aux2 = [];
			let vectors = [];
			aux1.forEach(function(value, index, array){
				aux2.push( value.split( '=' ).slice( 1, 7 ) );
			});
			aux2.forEach(function(value, index, array){
				let vector = [];
				value.forEach(function(value2, index2, array2){
					vector.push(Number(
						value2.split('E')[0] + 'e' + value2.split('E')[1].substr( 0, 3 )
					));
				});
				vectors.push( vector );
			});
			self.postMessage({ type: 'ephemeris', eph: vectors });
		}
	);
	
	// Efemérides (elementos orbitales) de la tierra (01-01-2000)
	$.get(
		"https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND='399'&OBJ_DATA='YES'&MAKE_EPHEM='YES'&EPHEM_TYPE='ELEMENTS'&CENTER='500@10'&START_TIME='2000-01-01 12:00'&STOP_TIME='2000-02-01 12:00'&STEP_SIZE='40d'",
		(data, status) => {
			//log( data );
		}
	);
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
canvas1.addEventListener('mousemove', evt => {
	mousePos1 = getMousePos(canvas1, evt);
}, false);

// Captura de parámetros de escala de simulación
const s_scale_slider = document.getElementById("s_scale");
s_scale_slider.value = 10 * s_scale / SUNR;
s_scale_slider.oninput = () => {
	s_scale = SUNR * s_scale_slider.value * .1;
};
const t_scale_slider = document.getElementById("t_scale");
t_scale_slider.value = to_eday( t_scale );
t_scale_slider.oninput = () => {
	
	// Registrar el tiempo acumulado antes de realizar el cambio de escala
	carried_time = ts;
	
	// Registrar la marca del reloj local antes de realizar el cambio de escala
	carried_seconds = l_time;
	
	// Realizar el cambio de escala
	t_scale = EDAY * t_scale_slider.value;
};

// Captura de parámetros del satélite controlado
const posx_slider = document.getElementById("posx");
posx_slider.max = width_p( 1 );
posx_slider.value = width_p( .5 );
sat.x = posx_slider.value;
posx_slider.oninput = () => {
	sat.x = posx_slider.value;
};
const posy_slider = document.getElementById("posy");
posy_slider.max = width_p( 1 );
posy_slider.value = width_p( .5 );
sat.y = posy_slider.value;
posy_slider.oninput = () => {
	sat.y = posy_slider.value;
};
const posz_slider = document.getElementById("posz");
posz_slider.max = width_p( 1 );
posz_slider.value = width_p( .5 );
sat.z = posz_slider.value;
posz_slider.oninput = () => {
	sat.z = posz_slider.max - posz_slider.value;
};
const velx_slider = document.getElementById("velx");
velx_slider.oninput = () => {
	sat.vx = velx_slider.value * .1;
};
const vely_slider = document.getElementById("vely");
vely_slider.oninput = () => {
	sat.vy = vely_slider.value * .1;
};
const velz_slider = document.getElementById("velz");
velz_slider.oninput = () => {
	sat.vz = -velz_slider.value * .1;
};

// Captura de parámetros del punto sobre la superficie del satélite controlado
const lat_slider = document.getElementById("lat");
lat_slider.oninput = () => {
	PHI = lat_slider.value * PI / ( 2 * 500 );
};
const long_slider = document.getElementById("long");
long_slider.oninput = () => {
	LAMBDA = long_slider.value * PI / 500;
};

// Captura control del tiempo
const time_text = document.getElementById("time_txt");
const time_input = document.getElementById("time_button");
time_input.value = 'set time_0';
time_input.onclick = () => {
	ts0 = -Number( time_text.value );
};
const time__add_input = document.getElementById("time_add_button");
time__add_input.value = 'add time_0';
time__add_input.onclick = () => {
	ts0 += -Number( time_text.value );
};

// Reiniciar el programa con un click
canvas1.addEventListener('click', () => {
	view = ( view + 1 ) % 3 + 1;
}, false);

//------OBJETOS A SIMULAR--------------

/*/ Venus
Satellite.sat_from_orbit(
	'venus',
	SUN_U,
	108.210e6,
	0.00677323,
	107.480e6,
	0.05924886665037670558078622288696,
	0.95790650666456784499879844137729,
	1.3383305132010906804591668547434,
	{
		T: v_sidereal_rotation_period,
		t0: 0,
		tilt: v_axial_tilt
	},
	0
);

// Marte
Satellite.sat_from_orbit(
	'mars',
	SUN_U,
	227.956e6,
	0.0935,
	206.650e6,
	0.03225368457685521058154980540167,
	5.0003683069637542378863740517199,
	0.86530876133170948702694279713143,
	{
		T: m_sidereal_rotation_period,
		t0: 0,
		tilt: m_axial_tilt
	},
	0
);

// Ceres
Satellite.sat_from_orbit(
	'ceres',
	SUN_U,
	2.77 * AU,
	0.0785,
	2.55 * AU,
	0.18500490071139893515391122145979,
	1.2845623294678265686158364056076,
	1.3962634015954636615389526147909,
	{
		T: c_sidereal_rotation_period,
		t0: 0,
		tilt: c_axial_tilt
	},
	0
);*/

// Tierra (SE J2000)
Satellite.sat_from_orbit(
	'earth',
	SUN_U,
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
	E_INITIAL_TRUE_ANOMALY
);

// Comenzar loop del programa
setInterval(orbitLoop, s_to_ms( 1 / frac ) );