import * as controller from '../controller'


controller.send_json(JSON.stringify({
  functionCall: 'test',
  objectType: 'test',
  objectIndex: '-1',
  tensorIndexParams: ['test']
}), true)
.then(res => console.log(res), res => console.log('error', res))
