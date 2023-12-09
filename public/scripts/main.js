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
Satellite.u = sun_u; // Astro orbitado

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
var frac = 60; // Fracción de segundo para el loop

// Parámetros de escala de la simulación
const s_scale = 3.5 * sunr; // Escala del espacio (kilómetros por pixel de lienzo)
const t_scale = 100.0 * eday; // Escala del tiempo (Segundos simulados por segundo real)
var center = { // Punto de referencia (kilómetros)
	x: to_km( width_p( .5 ) ),
	y: to_km( height_p( .5 ) ),
	z: to_km( height_p( .5 ) )
};
var PHI = deg_to_rad( 35.6 ); // Latitud sobre el satélite
var LAMBDA = deg_to_rad( 139.6 ); // Longitud sobre el satélite

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
	u_seconds = u_time.substr(-4).charAt(0);
	
	// Hacer un ajuste cada segundo
	if(u_seconds != l_seconds){
		
		// El reloj local se sincroniza con el reloj universal
		l_time++;
		
		// El tiempo simulado se sincroniza con el reloj local
		s_time = to_sim_t( l_time );
		
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
		value.rotate(ts); // Rotación
		value.orbit.set_sim( ts, Satellite.u ); // Traslación
	});
	
	//------------DIBUJO EN PANTALLA-----------
	switch(view){
		case 1:
			view1(animator1);
			break;
		case 2:
			view2(animator1);
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

// Reiniciar el programa con un click
canvas1.addEventListener('click', () => {
	view = ( view + 1 ) % 3 + 1;
}, false);

//------OBJETOS A SIMULAR--------------

// Venus
Satellite.sat_from_orbit(
	'venus',
	sun_u,
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
	sun_u,
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
	sun_u,
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
);

// Tierra (SE J2000)
Satellite.sat_from_orbit(
	'earth',
	sun_u,
	e_a,
	0.0167,
	147.095e6,
	8.7266462599716478846184538424431e-7,
	1.9933026650579555328527279826012,
	6.0866500632978122028543868744063,
	{
		T: e_sidereal_rotation_period,
		t0: 0,
		tilt: e_axial_tilt
	},
	0
);

// Comenzar loop del programa
setInterval(orbitLoop, s_to_ms( 1 / frac ) );