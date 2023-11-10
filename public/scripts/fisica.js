// TRANSFORMACIÓN DE PUNTO EN COORDENADAS POLARES A CARTESIANAS
function cartesian_from_polar_point(p_point){
	const r = p_point[0];
	const theta = p_point[1];
	return [r * Math.cos(theta), r * Math.sin(theta)];
}

// TRANSFORMACIÓN DE CURVA EN COORDENADAS POLARES A CARTESIANAS
function cartesian_from_polar_curve(p_points){
	var c_points = [];
	for(var i=0; i<p_points.length; i++){
		c_points.push(cartesian_from_polar_point(p_points[i]));
	}
	return c_points;
}

// CURVA PARAMÉTRICA
function curve(x_t, y_t, init, end, step){
	
	// Arreglo de puntos
	var points = [];
	
	// Calcular puntos
	for(var i=init; i<end; i+=step){
		points.push([
			x_t(i),
			y_t(i)
		]);
	};
	return points;
}

// DISTANCIA ENTRE DOS PUNTOS
function distance(x1, y1, x2, y2){
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

// HIPOTENUSA
function hipo(o, a){
	return distance(0, 0, o, a);
}

// NORMA DE UN VECTOR (Bidimensional)
function norm_vec(v){
	return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
}

// PRODUCTO PUNTO
function dot_prod(u, v){
	var sum = 0;
	const n = Object.keys(u);
	for(var i=0; i<n.length; i++){
		sum += u[n[i]] * v[n[i]];
	}
	return sum;
}

// ÁNGULO DE UN VECTOR (Devuelve un ángulo entre 0 y 2pi)
function angle_vec(v){
	var a = 0;
	
	// Método usual
	if(v.x != 0){
		a = Math.atan(v.y / v.x);
		
		// Corrección de la dirección
		if(v.x < 0){
			a += Math.PI;
		}
	
	// Vector vertical hacia arriba
	}else if(v.y > 0){
		a = Math.PI / 2;
	
	// Vector vertical hacia abajo
	}else if(v.y < 0){
		a = -Math.PI / 2;
	
	// Vector de norma cero no tiene ángulo
	}else{
		return null;
	}
	
	// Corregir el rango (a está entre -pi/2 y 3pi/2)
	if(a < 0){
		a += 2 * Math.PI;
	}
	return a;
}

// ÁNGULO ENTRE DOS VECTORES
function angle_between(u, v){
	return Math.acos(
		dot_prod(u, v) / ( norm_vec(u) * norm_vec(v) )
	);
}

// VECTOR ROTACIÓN DE OTRO VECTOR
function rot_vec(v, a, normal){
	
	// Vector rotado normalizado
	const norm = norm_vec(v);
	const angle = angle_vec(v);
	var vec_aux = {
		x: Math.cos(angle + a),
		y: Math.sin(angle + a)
	}
	
	// Ajustar la norma
	if(normal){
		return vec_aux;
	}else{
		return {
			x: norm * vec_aux.x,
			y: norm * vec_aux.y
		}
	}
}

// NORMALIZAR UN VECTOR (Bidimensional)
function normalize_vec(v){
	var norm = norm_vec(v);
	return {
		x: v.x / norm,
		y: v.y / norm
	}
}

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
	}
	
	// Normalizarlo
	return normalize_vec(vec_aux);
}

// RADIO ORBITAL
function orbital_r(p, e, f){
	return p / ( 1 + e * Math.cos( f ) );
}

// ANOMALÍA EXCÉNTRICA DE LA TRAYECTORIA ELÍPTICA (POR BISECCIÓN)
function bis_elliptic_ecc_anomaly(M, e){
	
	// Lado derecho
	let side_r = e * Math.sin(M);
	
	// Límites del intervalo
	let a;
	let b;
	let middle;
	
	// Calcular intervalo de búsqueda
	if(side_r > 0){
		a = M;
		b = M + e;	
	}else if(side_r < 0){
		a = M - e;
		b = M;
	}else{
		return M;
	}
	
	// Diez iteraciones de búsqueda
	for(var i=0; i<10; i++){
		
		// Cortar a la mitad
		middle = ( a + b ) / 2;
		side_r = e * Math.sin(middle);
		if(side_r > middle - M){ a = middle }
		else{ b = middle }
	}
	return middle;
}