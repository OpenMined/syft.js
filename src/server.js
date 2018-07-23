// import {getFloatTensor} from './tensor_object';
const tensor_object = require('./tensor_object');
let val=tensor_object.getFloatTensor();
const express = require('express'),
      server = express();

server.set('port', process.env.PORT || 3000);

//Basic routes
server.get('/', (request,response)=>{
   response.send(val.owners);
  // response.send(tensor_object.floatTensor.torch_type);
});

server.get('/about',(request,response)=>{
   response.send('About page');
});

//Express error handling middleware
server.use((request,response)=>{
   response.type('text/plain');
   response.status(505);
   response.send('Error page');
});

//Binding to a port
server.listen(3000, ()=>{
  console.log('Express server started at port 3000');
});
