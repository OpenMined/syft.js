// Mock of FloatTensor class in vanilla JavaScript.
function FloatTensor(data, id, owners, is_pointer, torch_type ) {
    this.torch_type = torch_type 
    this.data = data
    this.id = id
    this.owners = owners
    this.is_pointer = is_pointer  
}

function addition(float0, float1) {
    return float0 + float1;
}


module.exports = FloatTensor;
module.exports = addition;

