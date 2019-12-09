# Syft.js Tensorflow & PyTorch API Support

We are still currently working on support for a number of API endpoints within
both PyTorch and Tensorflow. Below you can find a brief outline of which API
endpoints are supported.

## pytorch conversion progress

| pytorch api                            | tensorflow.js api | supported |
| -------------------------------------- | ----------------- | --------- |
| torch.abs(input, out=none)             | tf.abs(x)         | x         |
| torch.acos(input, out=none)            | tf.acos(x)        |           |
| torch.add(input, other, out=none)      | tf.add(a, b)      | x         |
| torch.addcdiv()                        | tbd               |           |
| torch.addcmul()                        | tbd               |           |
| torch.asin(input, out=none)            | tf.asin(x)        | x         |
| torch.atan(input, out=none)            | tf.atan(x)        | x         |
| torch.atan2(input, other, out=none)    | tf.atan2(a, b)    | x         |
| torch.bwtwise_not(input, out=none)     | tf.logicalNot(x)  | rename    |
| torch.ceil(input, out=None)            | tf.ceil(x)        | X         |
| torch.clamp(input, min, max, out=None) | tbd               |           |
| torch.cos(input, out=none)             | tf.cos(x)         | x         |
| torch.cosh(input, out=none)            | tf.cosh(x)        | x         |
| torch.div(input, other, out=none)      | tf.div(a, b)      | x         |
| torch.erf(input, out=none)             | tf.erf(x)         | x         |
| torch.erfc(input, out=none)            | tbd               |           |
| torch.erfinv(input, out=none)          | tbd               |           |
| torch.exp(input, out=none)             | tf.exp(x)         | x         |
| torch.expm1(input, out=none)           | tf.expm1(x)       | x         |
| torch.floor(input, out=none)           | tf.floor(x)       | x         |
| torch.fmod(input, other, out=none)     | tf.mod(a, b)      | rename    |
