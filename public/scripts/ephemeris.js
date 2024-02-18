// Recibir efemérides de Horizon API
self.onmessage = (e) => {
	switch (e.data.type) {
		case 'ephemeris':
			ephemeris = e.data.eph;
			break;
		case 'elements':
			
			/*
			Esta sección se usó para intentar aproximar
			la perturbación de Ceres, que no encontré en un paper,
			Mediante gráficas de elemento orbital vs tiempo.
			El Exp. reveló que las perturbaciones no son funciones lineales.
			Ceres permanece sin perturbaciones implementadas por el momento. 
			*/
			break;
	};
};

// Tratamiento de la hoja de datos: Vectores pos, vel, formato lista
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

// Tratamiento de la hoja de datos: Elementos orbitales, formato lista
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
	
	// Petición al servidor
	$.get(
		url,
		(data, status) => {
			log( data );
			
			// Tratar los datos obtenidos: formato
			let formated_data = cartesian_horizons_ephem( data );
			
			// El almacenaje se hace con un mensaje a sí mismo
			self.postMessage({ type: 'ephemeris', eph: formated_data });
		}
	);
});