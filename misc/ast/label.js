var items= [],itemsPassed = 0;
var i, j;

function foo() 
{
top:
    for (i = 0; i < items.length; i++){
        for (j = 0; j < tests.length; j++)
            if (!tests[j].pass(items[i]))
                continue top;
        itemsPassed++;
    }
}
