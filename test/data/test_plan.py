import torch as th
import syft as sy
import base64
from syft.serde import protobuf

sy.hook(globals())

# force protobuf serialization for tensors
hook.local_worker.framework = None

@sy.func2plan(args_shape=[(2,2)], state=(th.tensor([4.2, 7.3]),))
def plan(x, state):
    (y,) = state.read()
    x = x + y
    x = th.abs(x)
    return x

print(plan)
print(plan.torchscript.code)

pb = protobuf.serde._bufferize(hook.local_worker, plan)
serialized_plan = pb.SerializeToString()
print(base64.b64encode(serialized_plan).decode('ascii'))
