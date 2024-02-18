//---------VISTA 2: ELEVACIÓN------------------
class View2 extends View{
	constructor(){
		return;
	};
	
	// Dibujar efemérides
	static draw_ephemeris(request){
		if(ephemeris != null){
			let print_pos = center_body.get_print_pos();
			ephemeris.forEach(function(value, index, array){
				
				// Posición absoluta
				request.push([
					'circle',
					to_px( print_pos.y + value[1] ),
					to_px( print_pos.z + value[2] ),
					1,
					'YELLOW'
				]);
				
				// Vector r
				request.push([
					'line', 
					to_px( print_pos.y ),
					to_px( print_pos.z ),  
					to_px( print_pos.y + value[1] ),
					to_px( print_pos.z + value[2] ),
					'YELLOW'
				]);
				
				// Vector v
				request.push([
					'line',
					to_px( print_pos.y + value[1] ),
					to_px( print_pos.z + value[2] ),
					
					// La longitud del vector se dibuja sin tener en cuenta la escala
					to_px( print_pos.y + value[1] ) + value[4] * 1e0,
					to_px( print_pos.z + value[2] ) + value[5] * 1e0,
					'YELLOW'
				]);
				
				// Secuencia
				request.push([
					'print', 
					index,
					to_px( print_pos.y + value[1] ) - 10, 
					to_px( print_pos.z + value[2] ) + 10,
					'YELLOW'
				]);
			});
		};
	};
	
	static show(animator){
		
		// Construir pedido para el animador
		var request = [];
		
		//-------OBJETOS-----------------
		
		// Satélites
		Satellite.list.forEach(function(value, index, array){
			value.view2(request);
		});
		
		// Efemérides
		View2.draw_ephemeris(request);
		
		// Imprimir info. solicitada
		super.print_basic(request);
		super.print_info(request, info_page);
		
		// Enviar pedido al animador
		animator.postMessage({
			type: 'request',
			req: request
		});
	};
};