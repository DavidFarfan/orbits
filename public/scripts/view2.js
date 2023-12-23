//---------VISTA 2: ELEVACIÓN------------------
class View2 extends View{
	constructor(){
		return;
	};
	
	static show(animator){
		
		// Construir pedido para el animador
		var request = [];
		
		//-------OBJETOS-----------------
		
		// Sol
		var sun_radius = max( 1, to_px( SUNR ) );
		request.push([
			'circle', 
			to_px( center.y ),
			to_px( center.z ), 
			sun_radius,
			'YELLOW'
		]);
		
		// Satélites
		Satellite.list.forEach(function(value, index, array){
			value.view2(request);
		});
		
		//------EFEMÉRIDES----------------
		
		// Dibujar efemérides si está disponible
		if(ephemeris != null){
			ephemeris.forEach(function(value, index, array){
				
				// Posición absoluta
				request.push([
					'circle',
					to_px( center.y + value[1] ),
					to_px( center.z + value[2] ),
					1,
					'YELLOW'
				]);
				
				// Vector r
				request.push([
					'line', 
					to_px( center.y ),
					to_px( center.z ),  
					to_px( center.y + value[1] ),
					to_px( center.z + value[2] ),
					'YELLOW'
				]);
				
				// Vector v
				request.push([
					'line',
					to_px( center.y + value[1] ),
					to_px( center.z + value[2] ),
					
					// La longitud del vector se dibuja sin tener en cuenta la escala
					to_px( center.y + value[1] ) + value[4] * 1e0,
					to_px( center.z + value[2] ) + value[5] * 1e0,
					'YELLOW'
				]);
				
				// Secuencia
				request.push([
					'print', 
					index,
					to_px( center.y + value[1] ) - 10, 
					to_px( center.z + value[2] ) + 10,
					'YELLOW'
				]);
			});
		};
		
		// Imprimir info. solicitada
		super.print_basic(request);
		super.print_info(request, info);
		
		// Enviar pedido al animador
		animator.postMessage({
			type: 'request',
			req: request
		});
	};
};