define(['./ipsum'], function (ipsum) {

    return function exec(a, b, c){
        return ipsum.sum(a, b) * c;
    };

});
