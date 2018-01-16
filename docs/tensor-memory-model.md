# Tensor Memory Model

There are four main memory components to our Tensor Object: Data, Shape, Size, and Strides.  Here we will go over each with a bit more depth to help our users and contributors understand how they work together to model tensors.

## Data
Data is an array that stores all the numeric values in the tensor.  The Shape, Size, and Strides are used to organize the data into different arrangements comprised of dimensions and channels.

We can think of Data as a nested array that was flattened, and the Shape as the information to reconstruct the nested array.

Example: 2x3x2
```
nested = [
  [
    [0, 1],
    [2, 3],
    [4, 5],
  ],
  [
    [6, 7],
    [8, 9],
    [10, 11],
  ]
]

flattened = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

shape = [2, 3, 2]
```

## Shape
Shape describes the number of channels in each dimension.  We can see this in the above example.

## Size
Size is the total number of unique coordinates that can be achieved with the given Shape.  this is equivalent to multiplying all the shape values together. As for the above example the Size would be `2 * 3 * 2` or `12`.

# Strides
Strides are the distance between values in a channel of a given dimension.  If we look at the `nested` array in the example above, we can come up with a simple indexing model to find the distances.

  - `Stride[0]` is the distance between `nested[0][a][b]` and `nested[1][a][b]`
  - `Stride[1]` is the distance between `nested[a][0][b]` and `nested[a][1][b]`
  - `Stride[2]` is the distance between `nested[a][b][0]` and `nested[a][b][1]`

It turns out that there is a nice mathematical relationship here.
```
Stride[i] = 1 * Shape[i + 1] * Shape[i + 2] ... * Shape[i + (Shape.Length - 1)]
```
This can nicely be calculated using an inverse `for` loop and we can also calculate the `Size` at the same time.
```
Size = 1
for (i = Shape.Length - 1; i >= 0; i--) {
  Stride[i] = Size
  Size *= Shape[i]
}
```
With the example above we would get the following values for Strides:
```
Stride[0] = 6
Stride[1] = 2
Stride[2] = 1
```
With a Size:
```
Size = 12
```

<!-- # Using Shape, Size, and Stride

## Calculate an Index given Indices
## Calculate Indices given an Index

## Calculate Dimensional Offsets -->
