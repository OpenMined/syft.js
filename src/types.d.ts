declare type SocketCMDObjectType = 'controller'

declare type SocketCMD = {
  functionCall: string,
  objectType: SocketCMDObjectType,
  objectIndex: string,
  tensorIndexParams: any[]
}
