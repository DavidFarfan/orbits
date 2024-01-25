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
	let url = "https://ssd.jpl.nasa.gov/api/horizons.api?format=text" + "&COMMAND='" + HORIZONS_MOON + "'&OBJ_DATA='YES'&MAKE_EPHEM='YES'&EPHEM_TYPE='VECTORS'&CENTER='500@399'&START_TIME='1969-07-01 12:00'&STOP_TIME='1969-07-20 12:00'&STEP_SIZE='1d'";
	log( url );
	$.get(
		url,
		(data, status) => {
			log( data );
			let formated_data = cartesian_horizons_ephem( data );
			//self.postMessage({ type: 'ephemeris', eph: formated_data });
		}
	);
});