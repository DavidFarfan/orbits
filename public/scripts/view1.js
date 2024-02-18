//---------VISTA 1: PLANTA ------------------------------------
class View1 extends View{
	constructor(){
		return;
	};
	
	// Dibujar Efemérides en formato vector
	static draw_ephemeris(request){
		if(ephemeris != null){
			let print_pos = center_body.get_print_pos();
			ephemeris.forEach(function(value, index, array){
				
				// Posición absoluta
				request.push([
					'circle',
					to_px( print_pos.x + value[0] ),
					to_px( print_pos.y + value[1] ),
					1,
					'YELLOW'
				]);
				
				// Vector r
				request.push([
					'line', 
					to_px( print_pos.x ),
					to_px( print_pos.y ),  
					to_px( print_pos.x + value[0] ),
					to_px( print_pos.y + value[1] ),
					'YELLOW'
				]);
				
				// Vector v
				request.push([
					'line',
					to_px( print_pos.x + value[0] ),
					to_px( print_pos.y + value[1] ),
					
					// La longitud del vector se dibuja sin tener en cuenta la escala
					to_px( print_pos.x + value[0] ) + value[3] * 1e0,
					to_px( print_pos.y + value[1] ) + value[4] * 1e0,
					'YELLOW'
				]);
				
				// Secuencia
				request.push([
					'print', 
					index,
					to_px( print_pos.x + value[0] ) - 10, 
					to_px( print_pos.y + value[1] ) + 10,
					'YELLOW'
				]);
			});
		};
	};
	
	// Dibujar objetos e información en vista de planta
	static show(animator){
		
		// Construir pedido para el animador
		var request = [];
		
		//-------OBJETOS-----------------
		
		// Satélites
		Satellite.list.forEach(function(value, index, array){
			value.view1(request);
		});
		
		// Efemérides
		View1.draw_ephemeris(request);
	
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