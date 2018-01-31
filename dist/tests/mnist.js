"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let mnist = require('mnist')(false);
const syft = require("..");
global.syft = syft;
let dataset = mnist(60000, 10000);
async function test() {
    let training = {
        input: await syft.Tensor.FloatTensor.create(dataset.training.input),
        output: await syft.Tensor.FloatTensor.create(dataset.training.output),
    };
    let testing = {
        input: await syft.Tensor.FloatTensor.create(dataset.test.input),
        output: await syft.Tensor.FloatTensor.create(dataset.test.output),
    };
    let model = await syft.Model.Sequential.create([
        await syft.Model.Linear.create(784, 10),
        await syft.Model.ReLU.create(),
        await syft.Model.Softmax.create()
    ]);
    global.Model = model;
    let loss = await syft.Model.CrossEntropyLoss.create();
    let optim = await syft.Optimizer.SGD.create(await model.parameters());
    let metric = ['accuracy'];
    let train = async () => {
        let error = await model.fit(training.input, training.output, loss, optim, 100, 10, 1, metric, true);
        console.log('trained!', error);
    };
    await train();
    global.train = train;
    global.perd = await model.forward(testing.input);
    console.log(await global.perd.toString());
}
test();
//# sourceMappingURL=mnist.js.map