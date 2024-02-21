//---------VISTA 2: ELEVACIÓN------------------
class View2 extends View{
	constructor(){
		return;
	};
	
	// Dibujar Efemérides en formato vector
	static draw_ephemeris(request){
		let print_pos = center_body.get_print_pos();
		super.draw_ephemeris( request, print_pos, 2 );
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