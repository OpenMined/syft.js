"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function arrMul(arr, n) {
    let res = [];
    for (let i = 0; i < n; i++) {
        res = res.concat(arr);
    }
    return res;
}
const syft = require("..");
global.syft = syft;
async function test() {
    let training = {
        input: await syft.FloatTensor.create(arrMul([[0, 0, 1], [0, 1.0, 1], [1, 0, 1], [1, 1, 1]], 2000)),
        output: await syft.FloatTensor.create(arrMul([[0, 0], [0, 0], [0, 1], [0, 1]], 2000)),
    };
    let model = await syft.Sequential.create([
        await syft.Linear.create(3, 4),
        await syft.Tanh.create(),
        await syft.Linear.create(4, 2),
        await syft.Softmax.create(1),
        await syft.Log.create()
    ]);
    global.model = model;
    let loss = await syft.NLLLoss.create();
    let optim = await syft.SGD.create(await model.parameters());
    let metric = ['accuracy'];
    let train = async () => {
        let error = await model.fit(training.input, training.output, loss, optim, 100, 10, 1, metric, true);
        console.log('trained!', error);
    };
    await train();
    global.train = train;
    global.perd = await model.forward(training.input);
    console.log(await global.perd.toString());
}
test();
//# sourceMappingURL=other.js.map