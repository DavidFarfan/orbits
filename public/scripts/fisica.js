
//------CONSTANTES--------

const PI = Math.PI;
const euler = Math.E;

// Parámetros terrestres
const u = 3.986e5; // Parámetro gravitacional (km^3/s^2)
const er = 6.37812e3; // (km/er)
const eday = 8.64e4; // (s/eday)

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
	return pow( euler, x );
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

// SEGUNDOS A MILISEGUNDOS
function s_to_ms(s){
	return 1000 * s;
};

// SEGUNDOS A DÍAS TERRESTRES
function to_eday(s){
	return s / eday;
};

// KILÓMETROS A RADIOS TERRESTRES
function to_er(km){
	return km / er;
};

//------CURVAS PARAMÉTRICAS-----------

// TRANSFORMACIÓN DE PUNTO EN COORDENADAS POLARES A CARTESIANAS
function cartesian_from_polar_point(p_point){
	const r = p_point[0];
	const theta = p_point[1];
	return [ r * cos( theta ), r * sin( theta ) ];
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
function curve(f_t, g_t, init, end, step){
	
	// Arreglo de puntos
	var points = [];
	
	// Calcular puntos
	for(var i=init; i<end; i+=step){
		points.push([
			f_t( i ),
			g_t( i )
		]);
	};
	return points;
};

//-------VECTORES---------

// DISTANCIA ENTRE DOS PUNTOS
function distance(x1, y1, x2, y2){
	return sqrt( pow( x2 - x1, 2 ) + pow( y2 - y1, 2 ) );
};

// HIPOTENUSA
function hipo(o, a){
	return distance(0, 0, o, a);
};

// NORMA DE UN VECTOR (Bidimensional)
function norm_vec(v){
	return hipo( v.x, v.y );
};

// PRODUCTO PUNTO
function dot_prod(u, v){
	var sum = 0;
	const n = Object.keys(u);
	for(var i=0; i<n.length; i++){
		sum += u[n[i]] * v[n[i]];
	};
	return sum;
};

// ÁNGULO DE UN VECTOR CON "LA HORIZONTAL" (Ángulo entre 0 y 2pi)
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
	
	// Vector cero
	}else{
		return null;
	};
	return a;
};

// ÁNGULO ENTRE DOS VECTORES (Ángulo entre 0 y pi)
function angle_between(u, v){
	return acos(
		dot_prod( u, v ) / ( norm_vec( u ) * norm_vec( v ) )
	);
};

// VECTOR ROTACIÓN DE OTRO VECTOR
function rot_vec(v, a, normal){
	
	// Vector rotado normalizado
	const norm = norm_vec(v);
	const angle = angle_vec(v);
	var vec_aux = {
		x: cos(angle + a),
		y: sin(angle + a)
	}
	
	// Ajustar la norma
	if(normal){
		return vec_aux;
	}else{
		return {
			x: norm * vec_aux.x,
			y: norm * vec_aux.y
		}
	};
};

// NORMALIZAR UN VECTOR (Bidimensional)
function normalize_vec(v){
	
	// Norma del vector
	var norm = norm_vec(v);
	
	// Descartar el vector cero
	if(norm == 0){
		return v;
	};
	
	// Multiplicar  escalarmente por el inverso de la norma
	return {
		x: v.x / norm,
		y: v.y / norm
	};
};

// VECTOR ORTONORMAL (Bidimensional)
function vec_ort(v){
	
	// Calcular un vector ortogonal particular
	var vec_aux;
	if(v.x != 0){
		vec_aux = {
			x: - v.y / v.x,
			y: 1
		}
	}else if(v.y != 0){
		vec_aux = {
			x: 1,
			y: - v.x / v.y
		}
	}else{
		return v;
	};
	
	// Normalizarlo
	return normalize_vec(vec_aux);
};

//---------ÓRBITAS EN GENERAL---------------

// SEMI-LATUS RECTUM
function semi_latus_rectum(h){
	return pow( h, 2 ) / u;
};

// SEMI-MAJOR AXIS
function semi_major_axis(E){
	if(E == 0){
		return Number.MAX_VALUE;
	}else{
		return - u / ( 2 * E );	
	};
};

// ECCENTRICITY
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

// RELACIÓN VIS-VIVA
function vis_viva(r, a){
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

// VELOCIDAD TANGENCIAL
function tan_vel(a, b, px, py, vt, type, clockwise){
	let dir;
	let x;
	let v;
	
	// Corrección para la mitad inferior
	if(py < 0){
		x = -px;
		v = -vt;
	}else{
		x = px;
		v = vt;
	};
	
	// Corrección según el sentido de la órbita
	if(clockwise){
		v *= -1;
	};
	
	// Corrección para trayectoria hiperbólica
	if(type != 'elliptic'){
		x *= -1;
	};
	
	// Normalizar un vector tangente particular
	if(type != 'elliptic'){
		dir = normalize_vec({
			x: 1,
			y: ( b * x ) / ( pow( a, 2 ) * sqrt( pow( x / a, 2 ) - 1 ) )
		});
	}else{
		dir = normalize_vec({
			x: 1,
			y: ( -b * x ) / ( pow( a, 2 ) * sqrt( 1 - pow( x / a, 2 ) ) )
		});
	};
	
	// Ajustar norma a la velocidad
	return {
		x: v * dir.x,
		y: v * dir.y
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
function period(a){
	
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
function excess_velocity(a){
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
function ht_from_M(M, a){
	
	// Definición de anomalía media
	return M * sqrt( -pow( a, 3 ) / u );
};

// ANOMALÍA MEDIA DADO EL TIEMPO DE ÓRBITA HIPERBÓLICA
function M_from_ht(a, t){
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