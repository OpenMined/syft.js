// This needs to map to a TensorFlow tensors
// Needs to have its own type
// Add other metadata
// Need to recursively parse all entries of 'd'
// Create a new class called TorchTensor
// Inside of TorchTensor have a ._data (private method) which stores the information in the tensor as a TensorFlow tensor
// IMPORTANT: This whole class should be written as a way to translate Torch tensors and commands to TensorFlow, otherwise if we receive a TensorFlow tensor, just pass it right through... no need to translate!

// Consider potentially renaming TorchTensor to TensorFlowTensor since we don't have access to Torch in Javascript

export default class TorchTensor {
  constructor(id, bin, chain, gradChain, tags, description) {
    this.id = id;
    this.bin = bin;
    this.chain = chain;
    this.gradChain = gradChain;
    this.tags = tags;
    this.description = description;
  }
}
