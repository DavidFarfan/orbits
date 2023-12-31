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
	if(u_seconds != l_seconds){
		
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
	
	// Centrar la cámara en el satélite orbitado
	let center_body = Satellite.get_sat( Satellite.ctrl.orbited );
	if(Satellite.ctrl.orbit.r != undefined){
		center = { 
			x: to_km( width_p( .5 ) ) - center_body.orbit.r.x,
			y: to_km( width_p( .5 ) ) - center_body.orbit.r.y,
			z: to_km( width_p( .5 ) ) - center_body.orbit.r.z
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

//------I/O-------------

// Recibir confirmación del animador
animator.addEventListener("message", (msg) => {
  //log( msg.data );
});

// Recibir efemérides de Horizons
self.onmessage = (e) => {
	switch (e.data.type) {
		case 'ephemeris':
			ephemeris = e.data.eph;
			break;
		case 'elements':
			elem_curve = curve(
				(f) => {
					return f * 1e-2;
				},
				(f) => {
					return e.data.eph[f][4] * 1e-5;
				},
				(f) => {
					return 0;
				},
				0,
				e.data.eph.length - 1,
				1
			);
			
			// Curva en formato transferible
			for(var k=0; k<elem_curve.length; k++){
				elem_curve[k] = [
					elem_curve[k].c1,
					elem_curve[k].c2,
					elem_curve[k].c3
				];
			};
			
			// Curva aproximada
			let mean_de = 0;
			let mean_di = 0;
			let mean_dOM = 0;
			let mean_dw = 0;
			let mean_da = 0;
			for(var i=1; i<e.data.eph.length; i++){
				mean_de += e.data.eph[i][0] - e.data.eph[i-1][0];
				mean_di += e.data.eph[i][1] - e.data.eph[i-1][1];
				mean_dOM += e.data.eph[i][2] - e.data.eph[i-1][2];
				mean_dw += e.data.eph[i][3] - e.data.eph[i-1][3];
				mean_da += e.data.eph[i][4] - e.data.eph[i-1][4];
			};
			mean_de /= e.data.eph.length;
			mean_di /= e.data.eph.length;
			mean_dOM /= e.data.eph.length;
			mean_dw /= e.data.eph.length;
			mean_da /= e.data.eph.length;
			let date_2 = new Date( 'December 12, 2500 12:00:00 GMT+00:00' );
			let date_1 = new Date( 'January 01, 2000 12:00:00 GMT+00:00' );
			let date_0 = new Date( 'January 01, 1600 12:00:00 GMT+00:00' );
			let dif1 = to_century( ms_to_s( date_2.getTime() - date_0.getTime() ) );
			let dif1_mo = to_eday( ms_to_s( date_2.getTime() - date_0.getTime() ) ) / 30;
			let dif0 = to_century( ms_to_s( date_1.getTime() - date_0.getTime() ) );
			let e0 = e.data.eph[0][0];
			let i0 = e.data.eph[0][1];
			let OM0 = e.data.eph[0][2];
			let w0 = e.data.eph[0][3];
			let a0 = e.data.eph[0][4];
			log( 'e0 = ' + str( e0 ) );
			log( 'i0 = ' + str( i0 ) );
			log( 'OM0 = ' + str( OM0 ) );
			log( 'w0 = ' + str( w0 ) );
			log( 'a0 = ' + str( a0 ) );
			log( 'whole dt (Cy) = ' + str( dif1 ) );
			log( 'epoch dt (Cy) = ' + str( dif0 ) );
			log( 'mean de/day = ' + str( mean_de ) );
			log( 'mean di/day = ' + str( mean_di ) );
			log( 'mean dOM/day = ' + str( mean_dOM ) );
			log( 'mean dw/day = ' + str( mean_dw ) );
			log( 'mean da/day = ' + str( mean_da ) );
			let conv_factor = JULIAN_CENTURY / EDAY;
			let de_cy = conv_factor * mean_de;
			let di_cy = conv_factor * mean_di;
			let dOM_cy = conv_factor * mean_dOM;
			let dw_cy = conv_factor * mean_dw;
			let da_cy = conv_factor * mean_da;
			log( 'mean de/Cy = ' + str( de_cy ) );
			log( 'mean di/Cy = ' + str( di_cy ) );
			log( 'mean dOM/Cy = ' + str( dOM_cy ) );
			log( 'mean dw/Cy = ' + str( dw_cy ) );
			log( 'mean da/Cy = ' + str( da_cy ) );
			log( 'e2000 = ' + str( e0 + dif0 * de_cy ) );
			log( 'i2000 = ' + str( i0 + dif0 * di_cy ) );
			log( 'OM2000 = ' + str( OM0 + dif0 * dOM_cy ) );
			log( 'w2000 = ' + str( w0 + dif0 * dw_cy ) );
			log( 'a2000 = ' + str( a0 + dif0 * da_cy ) );
			elem_curve_approx = curve(
				(f) => {
					return f * 1e-2;
				},
				(f) => {
					return ( e.data.eph[0][4] + f * mean_dw ) * 1e-5;
				},
				(f) => {
					return 0;
				},
				0,
				e.data.eph.length - 1,
				1
			);
			
			// Curva en formato transferible
			for(var k=0; k<elem_curve_approx.length; k++){
				elem_curve_approx[k] = [
					elem_curve_approx[k].c1,
					elem_curve_approx[k].c2,
					elem_curve_approx[k].c3
				];
			};
			break;
	};
};

// Efemérides cartesianas
function cartesian_horizons_ephem(data){
	
	// Construir lista de vectores cartesianos
	let vectors = [];
	let aux1 = data.split( '$$SOE' )[1].split( '$$EOE' )[0].split( 'TDB' ).splice( 1 );
	aux1.forEach(function(value, index, array){
		let rough_values = value.split( '=' ).splice( 1, 6 );
		let vector = [];
		rough_values.forEach(function(value2, index2, array2){
			let rough_value = value2.split( 'E' );
			vector.push(
				Number(
					rough_value[0] + 'e' + rough_value[1].substr( 0, 3 )
				)
			);
		});
		vectors.push( vector );
	});
	return vectors;
};

// Efemérides en forma de elementos orbitales
function elements_horizons_ephem(data){
	
	// Construir lista de capturas instanténeas de elementos orbitales
	let vectors = [];
	let aux1 = data.split( '$$SOE' )[1].split( '$$EOE' )[0].split( 'TDB' ).splice( 1 );
	aux1.forEach(function(value, index, array){
		let rough_values = value.split( '=' );
		let vector = [];
		
		// e
		let rough_e = rough_values[1].split( 'E' );
		vector.push(
			Number(
				rough_e[0] + 'e' + rough_e[1].substr( 0, 3 )
			)
		);
		
		// i
		let rough_i = rough_values[3].split( 'E' );
		vector.push(
			Number(
				rough_i[0] + 'e' + rough_i[1].substr( 0, 3 )
			)
		);
		
		// OM
		let rough_upper_omega = rough_values[4].split( 'E' );
		vector.push(
			Number(
				rough_upper_omega[0] + 'e' + rough_upper_omega[1].substr( 0, 3 )
			)
		);
		
		// w
		let rough_omega = rough_values[5].split( 'E' );
		vector.push(
			Number(
				rough_omega[0] + 'e' + rough_omega[1].substr( 0, 3 )
			)
		);
		
		// a
		let rough_a = rough_values[10].split( 'E' );
		vector.push(
			Number(
				rough_a[0] + 'e' + rough_a[1].substr( 0, 3 )
			)
		);
		vectors.push( vector );
	});
	self.postMessage({ type: 'elements', eph: vectors });
};

// Comunicación con Horizons system
$(document).ready((data, status) => {
	
	// Efemérides (SE J2000)
	$.get(
		"https://ssd.jpl.nasa.gov/api/horizons.api?format=text" + "&COMMAND='" + HORIZONS_MARS + "'&OBJ_DATA='YES'&MAKE_EPHEM='YES'&EPHEM_TYPE='VECTORS'&CENTER='500@10'&START_TIME='1800-01-01 12:00'&STOP_TIME='1800-07-01 12:00'&STEP_SIZE='1mo'",
		(data, status) => {
			log(data);
			let formated_data = cartesian_horizons_ephem( data );
			//self.postMessage({ type: 'ephemeris', eph: formated_data });
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
canvas.addEventListener('mousemove', evt => {
	mousePos = getMousePos(canvas, evt);
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
	
	// Realizar el cambio de escala
	t_scale = EDAY * t_scale_slider.value;
};
const stop_button = document.getElementById("stop_button");
stop_button.onclick = () => {
	
	// Detener el tiempo
	t_scale = 0;
	t_scale_slider.value = 0;
};

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
	sat.vx = velx_slider.value * .1;
	Satellite.moved = true;
};
const vely_slider = document.getElementById("vely");
vely_slider.oninput = () => {
	sat.vy = vely_slider.value * .1;
	Satellite.moved = true;
};
const velz_slider = document.getElementById("velz");
velz_slider.oninput = () => {
	sat.vz = velz_slider.value * .1;
	Satellite.moved = true;
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

// Captura de página de info. de simulación a desplegar
const display_page_button = document.getElementById("page");
display_page_button.onclick = () => {
	info = ( info + 1 ) % 2;
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

// Reiniciar el programa con un click
canvas.addEventListener('click', () => {
	view = ( view + 1 ) % 3 + 1;
}, false);

//------OBJETOS A SIMULAR--------------

// Sol (SE J2000)
Satellite.sat_from_orbit(
	'sun',
	null,
	SUN_U,
	1e-10,
	0,
	1e-10,
	0,
	0,
	0,
	{
		T: 0,
		t0: 0,
		tilt: 0
	},
	{
		da: 0,
		de: 0,
		di: 0,
		dupper_omega: 0,
		dp: 0
	},
	0
);

// Ceres (SE J2000, no perturbations)
Satellite.sat_from_orbit(
	'ceres',
	'sun',
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

// Comenzar loop del programa
setInterval(orbitLoop, s_to_ms( 1 / frac ) );