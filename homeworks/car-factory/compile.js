// const solc = require('solc');
const fs = require('fs');
const path = require('path');

// const carFactory = path.resolve(__dirname, '../contracts', 'CarFactory.sol');
// const Ownable = path.resolve(__dirname, '../contracts', 'Ownable.sol');
// const solCarFactory = fs.readFileSync(carFactory, 'utf8');
// const solOwnable = fs.readFileSync(Ownable, 'utf8');

// console.log('Solcarfactory: ', solOwnable);

// const input = {
//     'CarFactory.sol': solCarFactory,
//     'Ownable.sol': solOwnable
// }

var solc = require('solc')
var input = {
    'lib.sol': 'library L { function f() returns (uint) { return 7; } }',
    'cont.sol': 'import "lib.sol"; contract x { function g() { L.f(); } }'
}
var output = JSON.parse(solc.compile(JSON.stringify({ sources: input }), () => { }))
for (var contractName in output.contracts) {
    console.log(contractName + ': ' + output.contracts[contractName].bytecode)
}

console.log('____________output: ', output);