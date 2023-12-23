
//--------FUNCIONES JS FRECUENTES------------

// Log
function log(txt){
	console.log( txt );
};

// Number to string
function str(x){
	if(x == null){
		return 'null'
	};
	return x.toString();
};

// Precision
function significant(x, n){
	if(x == undefined) return NaN;
	return x.toPrecision( n );
};

// Hour string
function hour_string(hour){
	let h = hour.h;
	let min = hour.min;
	let s = hour.s;
	let string = '';
	if(h < 10){
		string += '0';
	};
	string += str( h ) + ':';
	if(min < 10){
		string += '0';
	};
	string += str( min ) + ':';
	if(s < 10){
		string += '0';
	};
	string += str( s );
	return string;
};