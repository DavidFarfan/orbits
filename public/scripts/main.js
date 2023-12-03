//---------ANIMADORES------------

// Lienzos
const canvas1 = document.getElementById('view1');
const canvas2 = document.getElementById('view2');

// Animadores
const animator1 = new Worker("/scripts/animador.js");
const animator2 = new Worker("/scripts/animador.js");
const main_offscreen_1 = canvas1.transferControlToOffscreen();
const main_offscreen_2 = canvas2.transferControlToOffscreen();

// Puesta en marcha de los animadores
animator1.postMessage({ type: 'context', canvas: main_offscreen_1 }, [main_offscreen_1]);
animator2.postMessage({ type: 'context', canvas: main_offscreen_2 }, [main_offscreen_2]);

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
const s_scale = .6 * sunr; // Escala del espacio (kilómetros por pixel de lienzo)
const t_scale = 10.0 * eday; // Escala del tiempo (Segundos simulados por segundo real)
const center = { // Punto de referencia (kilómetros)
	x: to_km( width_p( .5 ) ),
	y: to_km( height_p( .5 ) ),
	z: to_km( height_p( .5 ) )
}

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
	Satellite.ctrl_rutine();
	
	//------------SIMULACIÓN------------
	
	// Simular todas las trayectorias
	Satellite.list.forEach(function(value, index, array){
		value.orbit.set_sim( ts, Satellite.u );
	});
	
	//------------DIBUJO EN PANTALLA-----------
	view1(animator1);
	view2(animator2);
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
canvas2.addEventListener('mousemove', evt => {
	mousePos2 = getMousePos(canvas2, evt);
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

// Reiniciar el programa con un click
canvas1.addEventListener('click', () => {
	location.reload();
}, false);
canvas2.addEventListener('click', () => {
	location.reload();
}, false);

//------OBJETOS A SIMULAR--------------

// Satélite ctrl
sat_ctrl = new Satellite(
	'sat',
	{x: 0, y: 0, z: 0},
	{x: 0, y: 0, z: 0},
	true
);

// Comenzar loop del programa
setInterval(orbitLoop, s_to_ms( 1 / frac ) );