
//------CONSTANTES--------

// Números
const PI = Math.PI; // Pi
const EULER = Math.E; // Euler
const AU = 1.495978707e8; // Unidad astronómica (km)
const JULIAN_CENTURY = 3.15576e9; // Siglo juliano (s)

// Horizons Nomenclature
const HORIZONS_EARTH = '399'; // Earth center
const HORIZONS_SUN = '10'; // Sun center
const HORIZONS_MOON = '301'; // Moon center
const HORIZONS_VENUS = '299'; // Venus center
const HORIZONS_MARS = '499'; // Mars center
const HORIZONS_CERES ='A801 AA'; // Ceres center

// Sistemas de coordenadas
const EPOCH_J2000 = new Date('January 01, 2000 12:00:00 GMT+00:00');

// Parámetros del Sol
const SUN_U = 1.3271283864171489e+11; // Parámetro gravitacional (km^3/s^2)
const SUNR = 696000.0; // Radio (km)
const SUNMASS = 1988500 * 1e24; // Masa (kg)

// Parámetros de La Tierra
const E_U = 398600.435436; // Parámetro gravitacional (km^3/s^2)
const ER = 6371.01; // Radio volumétrico medio (km)
const EDAY = 86400.002; // Día solar medio (s)
const EMASS = 5.9722 * 1e24; // Masa (kg)
const E_INITIAL_SEMI_MAJOR_AXIS = 1.00000261 * AU; // Semi-eje mayor J2000 (km)
const E_INITIAL_ECCENTRICITY = 0.01671123; // Excentricidad J2000
const E_INITIAL_PERIAPSE = periapse_from_semi_major_axis( // Periapsis J2000 (km)
	E_INITIAL_SEMI_MAJOR_AXIS,
	E_INITIAL_ECCENTRICITY
);
const E_INITIAL_INCLINATION = deg_to_rad( 0.00001531 ); // Inclinación J2000 (rad)
const E_INITIAL_LONGITUDE_OF_ASCENDING_NODE = deg_to_rad( 180 - 5.11260389 ); // RAAN  J2000 (rad)
const E_INITIAL_LONGITUDE_OF_PERIHELION = deg_to_rad( 102.93005885 ); // Longitud de perihelio J2000 (rad)
const E_INITIAL_ARGUMENT_OF_PERIHELION = E_INITIAL_LONGITUDE_OF_PERIHELION // Argumento de perihelio J2000 (rad)
	 - E_INITIAL_LONGITUDE_OF_ASCENDING_NODE;
const E_AXIAL_TILT = deg_to_rad( 23.4392911 ); // Oblicuidad de la órbita (rad)
const E_SIDEREAL_ROTATION_PERIOD = h_to_s( 23.9344695944 ); // Periodo rot. sideral (s)
const E_INITIAL_TRUE_ANOMALY = M_from_t( // f J2000.0 (rad)
	period( E_INITIAL_SEMI_MAJOR_AXIS, SUN_U ),
	-225000 // Ángulo obtenido empíricamente (s)
);
const E_INITIAL_GST = rad_to_s(M_from_t( // GST J2000.0, i.e 12:00 aprox. (s)
	E_SIDEREAL_ROTATION_PERIOD,
	25427 // Segundos desde FPOA en J2000, obtenido empíricamente (s)
));
const E_DIFF_SEMI_MAJOR_AXIS = -0.00000003 * AU; // Cambio del Semi-eje mayor J2000 (km/Cy)
const E_DIFF_ECCENTRICITY = -0.00003661; // Cambio de la Excentricidad J2000 (1/Cy)
const E_DIFF_INCLINATION = deg_to_rad( 0.01337178 ); // Cambio de la Inclinación J2000 (rad/Cy)
const E_DIFF_LONGITUDE_OF_ASCENDING_NODE = deg_to_rad( -0.24123856 ); // Cambio de la RAAN J2000 (rad/Cy)
const E_DIFF_LONGITUDE_OF_PERIAPSE = deg_to_rad( 0.31795260 ); // Cambio de la longitud de perihelio J2000 (rad/Cy)

// Parámetros de Venus
const V_U = 324858.592; // Parámetro gravitacional (km^3/s^2)
const VR = 6051.84; // Radio volumétrico medio (km)
const VMASS = 4.8673 * 1e24; // Masa (kg)
const V_INITIAL_SEMI_MAJOR_AXIS = 0.72332102 * AU; // Semi-eje mayor J2000 (km)
const V_INITIAL_ECCENTRICITY = 0.00676399; // Excentricidad J2000
const V_INITIAL_PERIAPSE = periapse_from_semi_major_axis( // Periapsis J2000 (km)
	V_INITIAL_SEMI_MAJOR_AXIS,
	V_INITIAL_ECCENTRICITY
);
const V_INITIAL_INCLINATION = deg_to_rad( 3.39777545 ); // Inclinación J2000 (rad)
const V_INITIAL_LONGITUDE_OF_ASCENDING_NODE = deg_to_rad( 76.67261496 ); // RAAN  J2000 (rad)
const V_INITIAL_LONGITUDE_OF_PERIHELION = deg_to_rad( 131.76755713 ); // Longitud de perihelio J2000 (rad)
const V_INITIAL_ARGUMENT_OF_PERIHELION = V_INITIAL_LONGITUDE_OF_PERIHELION // Argumento de perihelio J2000 (rad)
	 - V_INITIAL_LONGITUDE_OF_ASCENDING_NODE;
const V_AXIAL_TILT = deg_to_rad( 177.36 ); // Oblicuidad de la órbita (rad)
const V_SIDEREAL_ROTATION_PERIOD = h_to_s( 243.018484 * EDAY ); // Periodo rot. sideral (s)
const V_INITIAL_TRUE_ANOMALY = M_from_t( // f J2000.0 (rad)
	period( V_INITIAL_SEMI_MAJOR_AXIS, SUN_U ),
	2743200 // Ángulo obtenido empíricamente (s)
);
const V_INITIAL_GST = rad_to_s(M_from_t( // GST J2000.0, i.e 12:00 aprox. (s)
	V_SIDEREAL_ROTATION_PERIOD,
	0 // Segundos desde FPOA en J2000, obtenido empíricamente (s)
));
const V_DIFF_SEMI_MAJOR_AXIS = -0.00000026 * AU; // Cambio del Semi-eje mayor J2000 (km/Cy)
const V_DIFF_ECCENTRICITY = -0.00005107; // Cambio de la Excentricidad J2000 (1/Cy)
const V_DIFF_INCLINATION = deg_to_rad( 0.00043494 ); // Cambio de la Inclinación J2000 (rad/Cy)
const V_DIFF_LONGITUDE_OF_ASCENDING_NODE = deg_to_rad( -0.27274174 ); // Cambio de la RAAN J2000 (rad/Cy)
const V_DIFF_LONGITUDE_OF_PERIAPSE = deg_to_rad( 0.05679648 ); // Cambio de la longitud de perihelio J2000 (rad/Cy)

// Parámetros de Marte
const M_U = 42828.375214; // Parámetro gravitacional (km^3/s^2)
const MR = 3389.92; // Radio volumétrico medio (km)
const MMASS = 0.64169 * 1e24; // Masa (kg)
const M_INITIAL_SEMI_MAJOR_AXIS = 1.52371243 * AU; // Semi-eje mayor J2000 (km)
const M_INITIAL_ECCENTRICITY = 0.09336511; // Excentricidad J2000
const M_INITIAL_PERIAPSE = periapse_from_semi_major_axis( // Periapsis J2000 (km)
	M_INITIAL_SEMI_MAJOR_AXIS,
	M_INITIAL_ECCENTRICITY
);
const M_INITIAL_INCLINATION = deg_to_rad( 1.85181869 ); // Inclinación J2000 (rad)
const M_INITIAL_LONGITUDE_OF_ASCENDING_NODE = deg_to_rad( 49.71320984 ); // RAAN  J2000 (rad)
const M_INITIAL_LONGITUDE_OF_PERIHELION = deg_to_rad( 336.08255216 ); // Longitud de perihelio J2000 (rad)
const M_INITIAL_ARGUMENT_OF_PERIHELION = M_INITIAL_LONGITUDE_OF_PERIHELION // Argumento de perihelio J2000 (rad)
	 - M_INITIAL_LONGITUDE_OF_ASCENDING_NODE;
const M_AXIAL_TILT = deg_to_rad( 25.19 ); // Oblicuidad de la órbita (rad)
const M_SIDEREAL_ROTATION_PERIOD = h_to_s( 24.622962 ); // Periodo rot. sideral (s)
const M_INITIAL_TRUE_ANOMALY = M_from_t( // f J2000.0 (rad)
	period( M_INITIAL_SEMI_MAJOR_AXIS, SUN_U ),
	63203329.22 // Ángulo obtenido empíricamente (s)
);
const M_INITIAL_GST = rad_to_s(M_from_t( // GST J2000.0, i.e 12:00 aprox. (s)
	M_SIDEREAL_ROTATION_PERIOD,
	0 // Segundos desde FPOA en J2000, obtenido empíricamente (s)
));
const M_DIFF_SEMI_MAJOR_AXIS = 0.00000097 * AU; // Cambio del Semi-eje mayor J2000 (km/Cy)
const M_DIFF_ECCENTRICITY = 0.00009149; // Cambio de la Excentricidad J2000 (1/Cy)
const M_DIFF_INCLINATION = deg_to_rad( -0.00724757 ); // Cambio de la Inclinación J2000 (rad/Cy)
const M_DIFF_LONGITUDE_OF_ASCENDING_NODE = deg_to_rad( -0.26852431 ); // Cambio de la RAAN J2000 (rad/Cy)
const M_DIFF_LONGITUDE_OF_PERIAPSE = deg_to_rad( 0.45223625 ); // Cambio de la longitud de perihelio J2000 (rad/Cy)

// Parámetros de Ceres
const C_U = 62.6284; // Parámetro gravitacional (km^3/s^2)
const CR = 469.7; // Radio volumétrico medio (km)
const CMASS = 9.38392 * 1e20; // Masa (kg)
const C_INITIAL_SEMI_MAJOR_AXIS = 413867951.4842377; // Semi-eje mayor J2000 (km)
const C_INITIAL_ECCENTRICITY = 0.07870920149752186; // Excentricidad J2000
const C_INITIAL_PERIAPSE = periapse_from_semi_major_axis( // Periapsis J2000 (km)
	C_INITIAL_SEMI_MAJOR_AXIS,
	C_INITIAL_ECCENTRICITY
);
const C_INITIAL_INCLINATION = deg_to_rad( 10.66837618716704 ); // Inclinación J2000 (rad)
const C_INITIAL_LONGITUDE_OF_ASCENDING_NODE = deg_to_rad( 86.50121756637978 ); // RAAN  J2000 (rad)
const C_INITIAL_LONGITUDE_OF_PERIHELION = deg_to_rad( 58.09210314065005
	+ C_INITIAL_LONGITUDE_OF_ASCENDING_NODE ); // Longitud de perihelio J2000 (rad)
const C_INITIAL_ARGUMENT_OF_PERIHELION = C_INITIAL_LONGITUDE_OF_PERIHELION // Argumento de perihelio J2000 (rad)
	 - C_INITIAL_LONGITUDE_OF_ASCENDING_NODE;
const C_AXIAL_TILT = deg_to_rad( 4 ); // Oblicuidad de la órbita (rad)
const C_SIDEREAL_ROTATION_PERIOD = h_m_s( 9, 4, 0); // Periodo rot. sideral (s)
const C_INITIAL_TRUE_ANOMALY = M_from_t( // f J2000.0 (rad)
	period( C_INITIAL_SEMI_MAJOR_AXIS, SUN_U ),
	41256000 // Ángulo obtenido empíricamente (s)
);
const C_INITIAL_GST = rad_to_s(M_from_t( // GST J2000.0, i.e 12:00 aprox. (s)
	C_SIDEREAL_ROTATION_PERIOD,
	0 // Segundos desde FPOA en J2000, obtenido empíricamente (s)
));
const C_DIFF_SEMI_MAJOR_AXIS = 0; // Cambio del Semi-eje mayor J2000 (km/Cy)
const C_DIFF_ECCENTRICITY = 0; // Cambio de la Excentricidad J2000 (1/Cy)
const C_DIFF_INCLINATION = deg_to_rad( 0 ); // Cambio de la Inclinación J2000 (rad/Cy)
const C_DIFF_LONGITUDE_OF_ASCENDING_NODE = deg_to_rad( 0 ); // Cambio de la RAAN J2000 (rad/Cy)
const C_DIFF_LONGITUDE_OF_PERIAPSE = deg_to_rad( 0 ); // Cambio de la longitud de perihelio J2000 (rad/Cy)

// Parámetros de La Luna
const MOON_U = 4902.800066; // Parámetro gravitacional (km^3/s^2)
const MOONR = 1737.53; // Radio volumétrico medio (km)
const MOONMASS = 0.07346 * 1e24; // Masa (kg)
const MOON_INITIAL_SEMI_MAJOR_AXIS = 3.818745248499886e+05; // Semi-eje mayor J2000 (km)
const MOON_INITIAL_ECCENTRICITY = 6.314721685094304e-02; // Excentricidad J2000
const MOON_INITIAL_PERIAPSE = periapse_from_semi_major_axis( // Periapsis J2000 (km)
	MOON_INITIAL_SEMI_MAJOR_AXIS,
	MOON_INITIAL_ECCENTRICITY
);
const MOON_INITIAL_INCLINATION = deg_to_rad( -18.28 ); // Inclinación J2000 (rad)
const MOON_INITIAL_LONGITUDE_OF_ASCENDING_NODE = deg_to_rad( 1.239580554371928e+02 ); // RAAN  J2000 (rad)
const MOON_INITIAL_ARGUMENT_OF_PERIGEE = deg_to_rad( 3.089226727206595e+02 ); // Argumento de perihelio J2000 (rad)

const MOON_AXIAL_TILT = deg_to_rad( 6.67 ); // Oblicuidad de la órbita (rad)
const MOON_SIDEREAL_ROTATION_PERIOD = 26.849 * EDAY; // Periodo rot. sideral (s)
const MOON_INITIAL_TRUE_ANOMALY = M_from_t( // f J2000.0 (rad)
	period( MOON_INITIAL_SEMI_MAJOR_AXIS, E_U ),
	11.39 * EDAY // Ángulo obtenido empíricamente (s)
);
const MOON_INITIAL_GST = rad_to_s(M_from_t( // GST J2000.0, i.e 12:00 aprox. (s)
	MOON_SIDEREAL_ROTATION_PERIOD,
	0 // Segundos desde FPOA en J2000, obtenido empíricamente (s)
));
const MOON_DIFF_SEMI_MAJOR_AXIS = 0; // Cambio del Semi-eje mayor J2000 (km/Cy)
const MOON_DIFF_ECCENTRICITY = 0; // Cambio de la Excentricidad J2000 (1/Cy)
const MOON_DIFF_INCLINATION = deg_to_rad( 0 ); // Cambio de la Inclinación J2000 (rad/Cy)
const MOON_DIFF_LONGITUDE_OF_ASCENDING_NODE = deg_to_rad( -1935.49 ); // Cambio de la RAAN J2000 (rad/Cy)
const MOON_DIFF_LONGITUDE_OF_PERIAPSE = deg_to_rad( 4067.8 ); // Cambio de la longitud de perihelio J2000 (rad/Cy)

//------BÁSICAS-------------

// PARTE ENTERA
function floor(a){
	return Math.floor( a );
};

// MÁXIMO ENTRE DOS NÚMEROS
function max(a, b){
	return Math.max( a, b );
};

// POTENCIACIÓN
function pow(a, b){
	return Math.pow( a, b );
};

// EXP
function exp(x){
	return pow( EULER, x );
};

// RAIZ CUADRADA
function sqrt(x){
	return Math.sqrt( x );
};

// LOGARITMO NATURAL
function ln(x){
	return Math.log(x);
};

//------TRIGONOMÉTRICAS------------

// SENO 
function sin(x){
	return Math.sin(x);
};

// ARCOSENO
function asin(x){
	return Math.asin(x);
};

// COSENO 
function cos(x){
	return Math.cos(x);
};

// ARCOCOSENO
function acos(x){
	return Math.acos(x);
};

// TANGENTE 
function tan(x){
	return Math.tan(x);
};

// ARCOTANGENTE
function atan(x){
	return Math.atan(x);
};

// COTANGENTE 
function cot(x){
	return cos( x ) / sin( x );
};

//-------HIPERBÓLICAS---------------

// SENO HIPERBÓLICO
function sinh(x){
	return ( exp( x ) - exp( -x ) ) / 2;
};

// COSENO HIPERBÓLICO
function cosh(x){
	return ( exp( x ) + exp( -x ) ) / 2;
};

// TANGENTE HIPERBÓLICA
function tanh(x){
	return sinh( x ) / cosh( x );
};

// ARCOTANGENTE HIPERBÓLICA
function atanh(x){
	return ( 1 / 2 ) * ln( ( 1 + x ) / ( 1 - x ) );
};

//------CONVERSIONES---------------

// RADIANES A GRADOS
function rad_to_deg(rad){
	return rad * 180 / PI;
};

// GRADOS A RADIANES
function deg_to_rad(deg){
	return deg * PI / 180;
};

// SEGUNDOS A GRADOS
function s_to_deg(s){
	return s / 240;
};

// GRADOS A SEGUNDOS
function deg_to_s(d){
	return d * 240;
};

// RADIANES A SEGUNDOS
function rad_to_s(rad){
	return deg_to_s( rad_to_deg( rad ) );
};

// SEGUNDOS A RADIANES
function s_to_rad(s){
	return deg_to_rad( s_to_deg( s ) );
};

// MINUTOS A SEGUNDOS
function min_to_s(m){
	return m * 60;
};

// SEGUNDOS A MINUTOS
function s_to_min(s){
	return s / 60;
};

// HORAS A SEGUNDOS
function h_to_s(h){
	return h * 3600;
};

// SEGUNDOS A HORAS
function s_to_h(s){
	return s / 3600;
};

// DÍAS A SEGUNDOS
function eday_to_s(d){
	return d * h_to_s( 24 );
};

// HORA/MINUTO/SEGUNDO A SEGUNDOS
function h_m_s(h, min, s){
	return h_to_s( h ) + min_to_s( min ) + s;
};

// HORA/MINUTO/SEGUNDO A GRADOS
function h_m_s_to_deg(h, min, s){
	return s_to_deg( h_m_s( h, min, s ) );
};

// HORA/MINUTO/SEGUNDO A RADIANES
function h_m_s_to_rad(h, min, s){
	return deg_to_rad( h_m_s_to_deg( h, min, s ) );
};

function rad_to_h_m_s(rad){
	let hours = floor( s_to_h( rad_to_s( rad ) ) );
	let minus = floor( s_to_min( rad_to_s( rad ) - h_to_s( hours ) ) );
	let secns = floor( rad_to_s( rad ) - h_to_s( hours ) - min_to_s( minus ) );
	return {
		h: hours,
		min: minus,
		s: secns
	};
};

// SEGUNDOS A MILISEGUNDOS
function s_to_ms(s){
	return 1000 * s;
};

// MILISEGUNDOS A SEGUNDOS
function ms_to_s(ms){
	return ms * .001;
};

// SEGUNDOS A DÍAS TERRESTRES
function to_eday(s){
	return s / EDAY;
};

// SEGUNDOS A SIGLOS TERRESTRES
function to_century(s){
	return s / JULIAN_CENTURY;
};

// KILÓMETROS A RADIOS TERRESTRES
function to_er(km){
	return km / ER;
};

//------CURVAS PARAMÉTRICAS-----------

// TRANSFORMACIÓN DE PUNTO EN COORDENADAS POLARES A CARTESIANAS
function cartesian_from_polar_point(p_point){
	
	// COORDENADAS CILÍNDRICAS, Z=0
	const r = p_point.c1;
	const theta = p_point.c2;
	return {
		x: r * cos( theta ),
		y: r * sin( theta ),
		z: 0
	};
};

// TRANSFORMACIÓN DE CURVA EN COORDENADAS POLARES A CARTESIANAS
function cartesian_from_polar_curve(p_points){
	var c_points = [];
	for(var i=0; i<p_points.length; i++){
		c_points.push( cartesian_from_polar_point( p_points[i] ) );
	};
	return c_points;
};

// CURVA PARAMÉTRICA
function curve(f_t, g_t, h_t, init, end, step){
	
	// Arreglo de puntos
	var points = [];
	for(var i=init; i<end; i+=step){
		points.push({
			c1: f_t( i ),
			c2: g_t( i ),
			c3: h_t( i )
		});
	};
	return points;
};

//-------VECTORES---------

// SUMA VECTORIAL
function sum_vec(u, v){
	const comps = Object.keys(u); // Índices
	let sum = {};
	for(var i=0; i<comps.length; i++){
		sum[comps[i]] = u[comps[i]] + v[comps[i]];
	};
	return sum;
};

// PRODUCTO POR ESCALAR
function prod_by_sc(a, v){
	const comps = Object.keys(v); // Índices
	let av = {};
	for(var i=0; i<comps.length; i++){
		av[comps[i]] = a * v[comps[i]];
	};
	return av;
};

// PRODUCTO PUNTO
function dot_prod(u, v){
	var sum = 0; // Iniciar suma en cero
	const comps = Object.keys(u); // Índices
	for(var i=0; i<comps.length; i++){
		sum += u[comps[i]] * v[comps[i]];
	};
	return sum;
};

// NORMA
function norm_vec(v){
	return sqrt( dot_prod( v, v ) );
};

// DISTANCIA ENTRE DOS PUNTOS
function distance(x1, y1, x2, y2){
	return norm_vec({ 
		x: x2 - x1, 
		y: y2 - y1 
	});
};

// HIPOTENUSA
function hipo(o, a){
	return distance(0, 0, o, a);
};

// ÁNGULO ENTRE DOS VECTORES (Ángulo entre 0 y pi)
function angle_between(u, v){
	return acos(
		dot_prod( u, v ) / ( norm_vec( u ) * norm_vec( v ) )
	);
};

// NORMALIZAR UN VECTOR
function normalize_vec(v){
	
	// Norma del vector
	var norm = norm_vec(v);
	
	// Descartar el vector cero
	if(norm == 0){
		return v;
	};
	
	// Multiplicar escalarmente por el inverso de la norma
	return prod_by_sc( 1 / norm, v );
};

// ÁNGULO DE UN VECTOR BIDIMENSIONAL CON EL EJE X (Ángulo entre 0 y 2pi)
function angle_vec(v){
	var a = 0; // Ángulo
	
	// Oblicuo
	if(v.x != 0){
		a = atan(v.y / v.x);
		
		// Corrección del ángulo
		if(v.x < 0 && v.y >= 0){
			a = PI + a;
		}else if(v.x > 0 && v.y < 0){
			a = 2 * PI + a;
		}else if(v.x < 0 && v.y < 0){
			a = PI + a;
		};
	
	// Vertical hacia arriba
	}else if(v.y > 0){
		a = PI / 2;
	
	// Vertical hacia abajo
	}else if(v.y < 0){
		a = 3 * PI / 2;
	};
	return a;
};

// ROTACIÓN ALREDEDOR DE X EN TRES DIMENSIONES
function x_rot(v, angle){
	return {
		x: v.x,
		y: v.y * cos( angle ) - v.z * sin( angle ),
		z: v.y * sin( angle ) + v.z * cos( angle )
	};
};

// ROTACIÓN ALREDEDOR DE Y EN TRES DIMENSIONES
function y_rot(v, angle){
	return {
		x: v.x * cos( angle ) + v.z * sin( angle ),
		y: v.y,
		z: -v.x * sin( angle ) + v.z * cos( angle )
	};
};

// ROTACIÓN ALREDEDOR DE Z EN TRES DIMENSIONES
function z_rot(v, angle){
	return {
		x: v.x * cos( angle ) - v.y * sin( angle ),
		y: v.x * sin( angle ) + v.y * cos( angle ),
		z: v.z
	};
};

// REGLA DE LA MANO DERECHA
function right_hand_rule(u, v, cross){
	
	// Calcular un set equivalente cuyo vector normal sea positivo y paralelo al eje Z
	let a = angle_vec({ // Rotar alrededor de Z, el ángulo con el eje X
		x: cross.x,
		y: cross.y
	});
	let u_rot_1 = z_rot( u, -a ); 
	let v_rot_1 = z_rot( v, -a ); 
	let cross_rot_1 = z_rot( cross, -a );
	let b = angle_vec({ // Rotar alrededor de Y, el ángulo con el eje Z
		x: cross_rot_1.z,
		y: cross_rot_1.x
	});
	let u_rot_2 = y_rot( u_rot_1, -b ); 
	let v_rot_2 = y_rot( v_rot_1, -b ); 
	let cross_rot_2 = y_rot( cross_rot_1, -b );
	let alpha = angle_vec({ // Ángulo de U-equivalente con el eje X
		x: u_rot_2.x,
		y: u_rot_2.y
	});
	let beta = angle_vec({ // Ángulo de V-equivalente con el eje X
		x: v_rot_2.x,
		y: v_rot_2.y
	});
	
	// Verificar el ángulo de la rotación desde U-equivalente hasta V-equivalente
	let dist;
	if(alpha < beta){
		dist = beta - alpha;
	}else{
		dist = 2 * PI - alpha + beta;
	};
	return dist < PI;
};

// PRODUCTO VECTORIAL (TEST DE OTRAS FUNCIONES)
function cross_prod(u, v){
	
	// Hacer la operación solo si los vectores son tridimendionales
	if(Object.keys(u).length != 3 || Object.keys(v).length != 3){
		log('vectors are not both tridimendional!');
		return;
	};
	
	// Hacer la operación con vectores no-nulos
	if(norm_vec(u) == 0 || norm_vec(v) == 0){
		return {
			x: 0,
			y: 0,
			z: 0
		};
	};
	
	// Componentes de los vectores tridimendionales
	let u1 = u.x;
	let u2 = u.y;
	let u3 = u.z;
	let v1 = v.x;
	let v2 = v.y;
	let v3 = v.z;
	
	// Determinantes
	let det_1_2 = u1 * v2 - u2 * v1;
	let det_1_3 = u1 * v3 - u3 * v1;
	let det_2_3 = u2 * v3 - u3 * v2;
	
	// Devolver el vector nulo si los vectores son colineales (se puede demostrar)
	if(det_1_2 == 0 && det_1_3 == 0 && det_2_3 == 0){
		return {
			x: 0,
			y: 0,
			z: 0
		};
	};
	
	// Calcular un vector ortonormal particular
	let n;
	if(det_2_3 != 0){
		n = normalize_vec({
			x: -1,
			y: det_1_3 / det_2_3,
			z: det_1_2 / -det_2_3
		});
	}else if(det_1_3 != 0){
		n = normalize_vec({
			x: det_2_3 / det_1_3,
			y: -1,
			z: det_1_2 / det_1_3
		});
	}else{
		n = normalize_vec({
			x: -det_2_3 / det_1_2,
			y: det_1_3 / det_1_2,
			z: -1
		});
	};
	
	// Ajustar norma
	let norm = norm_vec(u) * norm_vec(v) * sin( angle_between( u, v ) );
	let cross = {
		x: n.x * norm,
		y: n.y * norm,
		z: n.z * norm
	};
	
	// Corregir la dirección del producto según la right-hand rule
	if(!right_hand_rule( u, v, cross )){
		cross.x *= -1;
		cross.y *= -1;
		cross.z *= -1;
	};
	return cross;
};

// PRODUCTO VECTORIAL (DETERMINANTE)
function cof_cross_prod(u, v){
	
	// Componentes de los vectores tridimendionales
	let u1 = u.x;
	let u2 = u.y;
	let u3 = u.z;
	let v1 = v.x;
	let v2 = v.y;
	let v3 = v.z;
	
	// Determinantes
	let det_1_2 = u1 * v2 - u2 * v1;
	let det_1_3 = u1 * v3 - u3 * v1;
	let det_2_3 = u2 * v3 - u3 * v2;
	
	// Cómputo como un determinante
	return {
		x: det_2_3,
		y: -det_1_3,
		z: det_1_2
	};
};

//---------ÓRBITAS EN GENERAL---------------

// ANGULAR MOMENTUM
function angular_momentum(r, v){
	return cof_cross_prod( r, v );
};

// ORBITAL ENERGY
function orbital_energy(v, u, r){
	return ( 1 / 2 ) * pow( v, 2 ) - ( u / r );
};

// LINE OF NODES
function line_of_nodes(h){
	return cof_cross_prod({
		x: 0,
		y: 0,
		z: 1
	}, h);
};

// ECCENTRICITY (Vector)
function ecc_vector(u, v, h, r){
	return sum_vec(
		prod_by_sc( 1 / u, cof_cross_prod( v, h ) ),
		prod_by_sc( -1, normalize_vec( r ) )
	);
};

// SEMI-LATUS RECTUM
function semi_latus_rectum(h, u){
	return pow( h, 2 ) / u;
};

// SEMI-LATUS RECTUM FROM PERIAPSE
function semi_latus_rectum_from_periapse(rp, e){
	return rp * ( 1 + e );
};

// SEMI-MAJOR AXIS
function semi_major_axis(E, u){
	if(E == 0){
		return Number.MAX_VALUE;
	}else{
		return - u / ( 2 * E );	
	};
};

// ECCENTRICITY (Scalar)
function eccentricity(E, p, a){
	if(E == 0){
		return 1;
	}else{
		return sqrt( 1 - p / a );
	};
};

// PERIAPSE
function periapse(p, e){
	return p / (1 + e);
};

// PERIAPSE FROM SEMI-MAJOR AXIS
function periapse_from_semi_major_axis(a, e){
	return a * ( 1 - e );
};

// INCLINATION
function inclination(h){
	return acos( dot_prod( h, {
		x: 0,
		y: 0,
		z: 1
	}) / norm_vec(h) );
};

// LONGITUDE OF THE ASCENDING NODE
function longitude_ascending_node(n){
	return angle_vec({
		x: n.x,
		y: n.y
	});
};

// ARGUMENT OF PERIAPSE/TRUE ANOMALY
function argument_of_periapse_f(e, r, upper_omega, i){
	
	// Rotar set alrededor de Z, RAAN grados
	let e_rot_1 = z_rot( e, -upper_omega );
	let r_rot_1 = z_rot( r, -upper_omega );
	
	// Rotar set alrededor de X, i grados
	let e_rot_2 = x_rot( e_rot_1, -i );
	let r_rot_2 = x_rot( r_rot_1, -i );
	
	// Calcular ángulo de e con X
	let omega = angle_vec({
		x: e_rot_2.x,
		y: e_rot_2.y
	});
	
	// Rotar r alrededor de Z, omega grados
	let r_rot_3 = z_rot( r_rot_2, -omega );
	
	// Calcular ángulo de r con X
	let f = angle_vec({
		x: r_rot_3.x,
		y: r_rot_3.y
	});
	return {
		omega: omega,
		f: f
	};
};

// ROTATION AXIS
function rotation_axis(h, axial_tilt, upper_omega){
	
	// Llevar el nodo ascendente a x
	let rot_axis = z_rot( h, -upper_omega );
	
	// Aplicar el ángulo de oblicuidad en el plano generado por el nodo ascendente
	rot_axis = x_rot( rot_axis, axial_tilt );
	
	// Dejar el nodo ascendente en su sitio
	rot_axis = z_rot( rot_axis, upper_omega );
	return rot_axis;
};

// ORBITAL PLANAR POINT TO SPACE POINT
function orbit_planar_point_to_space_point(point, i, omega, upper_omega){
	
	// Rotar punto, omega grados, alrededor de Z
	let space_point = z_rot( point, omega );
	
	// Rotar punto, i grados, alrededor de X
	space_point = x_rot( space_point, i );
	
	// Rotar punto, upper_omega grados, alrededor de Z
	space_point = z_rot( space_point, upper_omega );
	return space_point;
};

// SET OF VECTORS: PERIAPSE, SEMI-LATUS RECTUM AND ASCENDING NODE
function rp_p_n_vecs(p, e, rp, i, upper_omega, omega){
	
	// Set en el plano orbital
	let rp_vec = prod_by_sc(
		rp,
		{
			x: 1,
			y: 0,
			z: 0
		}
	);
	let p_vec = prod_by_sc(
		p,
		z_rot({
			x: 1,
			y: 0,
			z: 0
		}, PI / 2)
	);
	let n_vec = prod_by_sc(
		r_from_f( p, e, 2 * PI - omega ),
		z_rot({
			x: 1,
			y: 0,
			z: 0
		}, 2 * PI - omega)
	);
	
	// Set en el espacio
	rp_vec = orbit_planar_point_to_space_point(rp_vec, i, omega, upper_omega );
	p_vec = orbit_planar_point_to_space_point(p_vec, i, omega, upper_omega );
	n_vec = orbit_planar_point_to_space_point(n_vec, i, omega, upper_omega );
	return {
		rp: rp_vec,
		p: p_vec,
		n: n_vec
	};
};

// SET OF VECTORS: R AND V IN TIME
function r_v_vecs(type, t, a, e, u, p, fo, T, i, omega, upper_omega){
	
	// Anomalía verdadera en el tiempo t
	let M = 0;
	let E = 0;
	let H = 0;
	let f = 0;
	if(type != 'elliptic'){
		M = M_from_ht(a, u, t); // Anomalía media
		H = H_from_M(M, e, fo); // Anomalía hiperbólica
		f = f_from_H(H, e);
	}else{
		M = M_from_t(T, t); // Anomalía media
		E = E_from_M(M, e); // Anomalía excéntrica
		f = f_from_E(E, e);
	};
	
	// Radio en el tiempo t
	let r = r_from_f(p, e, f);
	
	// Set en el plano orbital
	let r_vec = {
		x: r * cos( f ),
		y: r * sin( f ),
		z: 0
	};
	let v_vec = {
		x: -sqrt( u / p ) * sin( f ),
		y: sqrt( u / p ) * ( e + cos( f ) ),
		z: 0
	};
	
	// Set en el espacio
	r_vec = orbit_planar_point_to_space_point(r_vec, i, omega, upper_omega);
	v_vec = orbit_planar_point_to_space_point(v_vec, i, omega, upper_omega);
	return {
		M: M,
		E: E,
		H: H,
		f: f,
		r: r_vec,
		v: v_vec
	};
};

// INVARIANTS FROM ELEMENTS
function invariants_from_elements(u, a, e, rp, i, omega, upper_omega, f0){

	// Invariantes orbitales y anomalías en el punto especificado
	let p = semi_latus_rectum_from_periapse(rp, e);
	let fo;
	let T;
	let t0;
	let sat_at_t0;
	if(e >= 1){
		fo = outgoing_angle(e);
		t0 = ht_from_M(
			M_from_H(
				H_from_f(
					f0, 
					e
				),
				e
			),
			u,
			a
		);
		sat_at_t0 = r_v_vecs(
			'hyperbolic',
			t0,
			a,
			e,
			u,
			p,
			fo,
			T,
			i,
			omega,
			upper_omega
		);
	}else{
		T = period(a, u);
		t0 = t_from_M(
			M_from_E(
				E_from_f(
					f0, 
					e
				),
				e
			),
			e,
			T
		);
		sat_at_t0 = r_v_vecs(
			'elliptic',
			t0,
			a,
			e,
			u,
			p,
			fo,
			T,
			i,
			omega,
			upper_omega
		);
	};
	return sat_at_t0;
};

// VIS-VIVA EQUATION
function vis_viva(r, a, u){
	return sqrt( u * ( 2 / r - 1 / a ) );
};

// RADIO ORBITAL DADA LA ANOMALÍA VERDADERA
function r_from_f(p, e, f){
	return p / ( 1 + e * cos( f ) );
};

// ANOMALÍA VERDADERA DADO EL RADIO ORBITAL
function f_from_r(r, p, e){
	if(e == 0){
		
		// Órbita circular
		return 0;
	}else{
		let cos_f = ( 1 / e ) * ( p / r - 1 );
		if(cos_f > 1){
			return 0;
		}else if(cos_f < -1){
			return PI;
		}else{
			return acos( cos_f );
		};
	};
};

// RIGHT ASCENSION AND DECLINATION
function pointing_coordiantes(r1, r2, i, axial_tilt, upper_omega){
	
	// Posición de r2 desde r1 en coordenadas eclípticas
	let r3 = sum_vec( r2, prod_by_sc( -1, r1 ) );
	
	// Pasar a coordenadas ecuatoriales
	r3 = z_rot( r3, -upper_omega ); // Poner el nodo ascendente en x
	r3 = x_rot( r3, -( i + axial_tilt ) ); // hacer del plano ecuatorial, el plano de referencia
	return {
		
		// La ascención recta va de 0 a 2pi 
		alpha: angle_vec({ // Ángulo con el FPOA de la proyección en el plano de ref.
			x: r3.x,
			y: r3.y
		}),
		
		// La declinación va de -pi/2 a pi/2
		delta: atan( r3.z / hipo( r3.x, r3.y ) )
	};
};

//-------ÓRBITA ELÍPTICA----------------

// SEMI-MINOR AXIS
function semi_minor_axis(a, e){
	return a * sqrt( 1 - pow( e, 2 ) );
};

// APOAPSE
function apoapse(p, e){
	return p / ( 1 - e );
};

// PERIOD
function period(a, u){
	
	// Kepler's third law
	return 2 * PI * sqrt( pow( a, 3 ) / u );
};

// ANOMALÍA EXCÉNTRICA DADA LA ANOMALÍA VERDADERA
function E_from_f(f, e){
	return 2 * atan( sqrt( ( 1 - e ) / ( 1 + e ) ) * tan( f / 2 ) );
};

// ANOMALÍA MEDIA DADA LA ANOMALÍA EXCÉNTRICA
function M_from_E(E, e){
	
	// Ecuación de Kepler
	let M = E - e * sin(E);
	
	// M relativa (entre 0 y 2pi)
	return M - floor( M / ( 2 * PI ) ) * ( 2 * PI );
};

// TIEMPO DE ÓRBITA DADA LA ANOMALÍA MEDIA
function t_from_M(M, e, T){
	
	// Definición de anomalía media
	return ( T * M ) / ( 2 * PI );
};

// ANOMALÍA MEDIA DADO EL TIEMPO DE ÓRBITA
function M_from_t(T, t){
	
	// M absoluta
	let M = ( 2 * PI / T ) * t;
	
	// M relativa (entre 0 y 2pi)
	return M - floor( M / ( 2 * PI ) ) * ( 2 * PI );
};

// ANOMALÍA EXCÉNTRICA DADA LA ANOMALÍA MEDIA (BISECCIÓN)
function E_from_M(M0, e){
	
	// Intervalo de búsqueda
	let a = 0;
	let b = 2 * PI;
	
	// Anomalías aproximadas
	let fa;
	let Ea;
	let Ma;
	
	// Iteración
	for(var i=0; i<100; i++){
		
		// f_guess
		fa = ( a + b ) / 2;
		
		// E_guess
		Ea = E_from_f( fa, e );
		
		// M_guess
		Ma = M_from_E( Ea, e );
		
		// Corte del intervalo
		if(Ma > M0){
			b = fa;
		}else{
			a = fa;
		};
	};
	return Ea;
};

// ANOMALÍA VERDADERA DADA LA ANOMALÍA EXCÉNTRICA
function f_from_E(E, e){
	return 2 * atan( sqrt( ( 1 + e ) / ( 1 - e ) ) * tan( E / 2 ) );
};

//------------ÓRBITA HIPERBÓLICA--------------

// SEMI-CONJUGATE AXIS
function semi_conjugate_axis(a, e){
	return a * sqrt( pow( e, 2 ) - 1 );
};

// OUTGOING ANGLE
function outgoing_angle(e){
	return acos( -1 / e );
};
	
// TURNING ANGLE
function turning_angle(fo){
	return 2 * fo - PI;
};
	
// EXCESS VELOCITY
function excess_velocity(u, a){
	return sqrt( -u / a );
};

// ANOMALÍA HIPERBÓLICA DADA LA ANOMALÍA VERDADERA
function H_from_f(f, e){
	return 2 * atanh( sqrt( ( e - 1 ) / ( e + 1 ) ) * tan( f / 2 ) );
};

// ANOMALÍA MEDIA DADA LA ANOMALÍA HIPERBÓLICA
function M_from_H(H, e){
	return e * sinh(H) - H;
};

// TIEMPO DE ÓRBITA HIPERBÓLICA DADA LA ANOMALÍA MEDIA
function ht_from_M(M, u, a){
	
	// Definición de anomalía media
	return M * sqrt( -pow( a, 3 ) / u );
};

// ANOMALÍA MEDIA DADO EL TIEMPO DE ÓRBITA HIPERBÓLICA
function M_from_ht(a, u, t){
	return sqrt( u / -pow( a, 3 ) ) * t;
};

// ANOMALÍA HIPERBÓLICA DADA LA ANOMALÍA MEDIA (BISECCIÓN)
function H_from_M(M0, e, fo){
	
	// Intervalo de búsqueda
	let a = -fo;
	let b = fo;
	
	// Anomalías aproximadas
	let fa;
	let Ha;
	let Ma;
	
	// Iteración
	for(var i=0; i<100; i++){
		
		// f_guess
		fa = ( a + b ) / 2;
		
		// H_guess
		Ha = H_from_f( fa, e );
		
		// M_guess
		Ma = M_from_H( Ha, e );
		
		// Corte del intervalo
		if(Ma > M0){
			b = fa;
		}else{
			a = fa;
		};
	};
	return Ha;
};

// ANOMALÍA VERDADERA DADA LA ANOMALÍA HIPERBÓLICA
function f_from_H(H, e){
	return 2 * atan( sqrt( ( e + 1 ) / ( e - 1 ) ) * tanh( H / 2 ) );
};

// TIEMPO DADA LA ANOMALIA VERDADERA
function t_from_f(type, f, e, a, T){
	if(type == 'elliptic'){
		return t_from_M(
			M_from_E(
				E_from_f(
					f,
					e
				),
				e
			),
			e,
			T
		);
	}else{
		return ht_from_M(
			M_from_H(
				H_from_f(
					f,
					e
				),
				e
			),
			u,
			a
		);
	};
};

//-------ROTACIÓN------------------

// TIEMPO SIDERAL DEL MERIDIANO CERO
function GST(T, t, t0){
	
	// Los objetos en la esfera celeste van quedando atrás
	return M_from_t(T, t + t0);
};

// TIEMPO SIDERAL LOCAL
function LST(GST, longitude){
	return GST + longitude;
};

// POSICIÓN EN LA ESFERA CELESTE
function celestial_sphere_pos(ra, d, longitude, latitude, GST){
	
	// Punto más alto del ecuador
	let ref = -1;	// Hacia el sur en latitud norte
	if(latitude < 0){
		ref = 1;	// Hacia el norte en latitud sur
	};
	let pos = x_rot(	// Ecuador
		z_rot(		// Dirección sur
			x_rot(	// Altura
				{
					x: 0,
					y: ref,
					z: 0
				},
				ref * d
			),
			ref * ( ra - LST(GST, longitude) )
		),
		ref * ( PI / 2 - latitude )
	);
	
	// Orientar el norte hacia arriba
	if(latitude < 0){
		pos.y *= -1;
	};
	
	// Orientar el este hacia la derecha
	pos.x *= -1;
	
	// Obtener hora
	let ref_vec = y_rot( x_rot( pos, -latitude ), -PI / 2 );
	let hour = angle_vec({
		x: ref_vec.x,
		y: ref_vec.z
	});
	return {
		pos: pos,
		hour: hour
	};
};

//-------RENDEZVOUS/TARGETING------------------

// CHORD Y SEMI-PERIMETER
function chord_semi_perimeter(rt1, rt2){
	let r1 = norm_vec( rt1 );
	let r2 = norm_vec( rt2 );
	let c = norm_vec( sum_vec( rt1, prod_by_sc( -1, rt2 ) ) );
	let s = .5 * ( c + r2 + r1 );
	return {
		chord: c,
		semi_perimeter: s
	}; 
};

// ALPHA
function transfer_alpha(s, a){
	return 2 * asin( sqrt( s / ( 2 * a ) ) );
};

// BETA
function transfer_beta(s, c, a){
	return 2 * asin( sqrt( ( s - c ) / ( 2 * a ) ) );
};

// DELTA T DADO SEMIEJE MAYOR (ECUACIÓN DE LAMBERT)
function dt_from_a(rt1, rt2, a, u){
	let c_s = chord_semi_perimeter( rt1, rt2 );
	let alpha = transfer_alpha(c_s.semi_perimeter, a);
	let beta = transfer_beta(c_s.semi_perimeter, c_s.chord, a);
	let factor = sqrt( pow( a, 3 ) / u );
	return factor * ( alpha - beta - ( sin( alpha ) - sin( beta ) ) );
};

// SEMIEJE MAYOR DADO DELTA T (BISECCIÓN)
function a_from_dt(rt1, rt2, dt, u){
	let c_s = chord_semi_perimeter( rt1, rt2 );
	
	// Intervalo de búsqueda
	let a1 = c_s.semi_perimeter / 2;
	let a2 = 20 * c_s.semi_perimeter;
	
	// Auxiliares
	let mid_a;
	let dt_guess;
	
	// Iteración
	for(var i=0; i<100; i++){
		
		// Middle
		mid_a = ( a1 + a2 ) / 2;
		
		// dt_guess
		dt_guess = dt_from_a( rt1, rt2, mid_a, u );
		
		// Corte del intervalo
		if(dt_guess > dt){
			a1 = mid_a;
		}else{
			a2 = mid_a;
		};
	};
	
	// Transfer orbit
	let uc = prod_by_sc(
		1 / c_s.chord,
		sum_vec(
			rt2,
			prod_by_sc( -1, rt1 )
		)
	);
	let f1 = sqrt( u / ( 4 * mid_a ) );
	let f2 = cot( transfer_alpha( c_s.semi_perimeter, mid_a ) / 2 );
	let f3 = cot( transfer_beta( c_s.semi_perimeter, c_s.chord, mid_a ) / 2 );
	let A = f1 * f2;
	let B = f1 * f3;
	let v0 = sum_vec(
		prod_by_sc( B + A, uc ),
		prod_by_sc( B - A, normalize_vec( rt1 ) )
	);
	return {
		a: mid_a,
		v: v0
	};
};

// MINIMUM FLIGHT TIME ELLIPTIC TRIP 
function ell_min_flight_t(rt1, rt2, u){
	let c_s = chord_semi_perimeter( rt1, rt2 );
	let f1 = ( sqrt( 2 ) / 3 ) * sqrt( pow( c_s.semi_perimeter, 3 ) / u );
	let f2 = 1 - pow( sqrt( ( c_s.semi_perimeter - c_s.chord ) / c_s.semi_perimeter ), 3 );
	return f1 * f2;
};

// ESFERA DE INFLUENCIA
function r_soi(orbiting, orbited){
	if(orbited == null){
		return;
	};
	return orbiting.orbit.perturbation.a * pow( orbiting.m / orbited.m, 2 / 5 );
};