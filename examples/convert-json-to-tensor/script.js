const json = `{
  "torch_type": "torch.FloatTensor",
  "data": [1.0, 2.0, 3.0, 4.0, 5.0],
  "id": 1476041248,
  "owners": [0],
  "is_pointer": false
}`;

const tensorObject = JSON.parse(json);
const floatTensor = new Syft.default(tensorObject);

floatTensor.torch_type = 'test';

console.log(floatTensor.torch_type);

floatTensor.show();

Syft.connect('ws://localhost:1112/');
