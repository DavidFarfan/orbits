
//--------FUNCIONES JS FRECUENTES------------

// Log
function log(txt){
	console.log(txt);
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
	return x.toPrecision(n);
};