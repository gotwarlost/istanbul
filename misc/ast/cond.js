var x = 10, y, z;

y = (z=10,x < 10) ? (z--,1) : (z++,2);
console.log('Y=' + y);
console.log('Z=' + z);
