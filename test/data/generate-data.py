# This python script generates values in dummy.js, for MNIST plan unit tests.
# Script should be executed with appropriate PySyft version installed.

import os
import base64

import torch as th
from torch import jit
from torch import nn
from torchvision import datasets, transforms

import syft as sy
from syft.serde import protobuf
from syft.execution.state import State
from syft.execution.placeholder import PlaceHolder
from syft.execution.translation import TranslationTarget

sy.make_hook(globals())
# force protobuf serialization for tensors
hook.local_worker.framework = None
th.random.manual_seed(1)

def serialize_to_b64_pb(worker, obj):
    pb = protobuf.serde._bufferize(worker, obj)
    bin = pb.SerializeToString()
    return base64.b64encode(bin).decode('ascii')


def tensors_to_state(tensors):
    return State(
       state_placeholders=[
           PlaceHolder().instantiate(t)
           for t in tensors
       ]
    )

def set_model_params(module, params_list, start_param_idx=0):
    """ Set params list into model recursively
    """
    param_idx = start_param_idx

    for name, param in module._parameters.items():
        module._parameters[name] = params_list[param_idx]
        param_idx += 1

    for name, child in module._modules.items():
        if child is not None:
            param_idx = set_model_params(child, params_list, param_idx)

    return param_idx

# = MNIST =

class Net(nn.Module):
    def __init__(self):
        super(Net, self).__init__()
        self.fc1 = nn.Linear(784, 392)
        self.fc2 = nn.Linear(392, 10)

    def forward(self, x):
        x = self.fc1(x)
        x = nn.functional.relu(x)
        x = self.fc2(x)
        return x

def softmax_cross_entropy_with_logits(logits, targets, batch_size):
    """ Calculates softmax entropy
        Args:
            * logits: (NxC) outputs of dense layer
            * targets: (NxC) one-hot encoded labels
            * batch_size: value of N, temporarily required because Plan cannot trace .shape
    """
    # numstable logsoftmax
    norm_logits = logits - logits.max()
    log_probs = norm_logits - norm_logits.exp().sum(dim=1, keepdim=True).log()
    # NLL, reduction = mean
    return -(targets * log_probs).sum() / batch_size

def naive_sgd(param, **kwargs):
    return param - kwargs['lr'] * param.grad

model = Net()

@sy.func2plan()
def training_plan(X, y, batch_size, lr, model_params):
    # inject params into model
    set_model_params(model, model_params)

    # forward pass
    logits = model.forward(X)
    
    # loss
    loss = softmax_cross_entropy_with_logits(logits, y, batch_size)

    # backprop
    loss.backward()

    # step
    updated_params = [
        naive_sgd(param, lr=lr)
        for param in model_params
    ]
    
    # accuracy
    pred = th.argmax(logits, dim=1)
    target = th.argmax(y, dim=1)
    acc = pred.eq(target).sum().float() / batch_size

    return (
        loss,
        acc,
        *updated_params
    )

# Build the training plan.
bs = 64
lr = 0.005
model_params = tuple(p.data for p in model.parameters())
X = th.randn(bs, 28 * 28)
y = nn.functional.one_hot(th.randint(0, 10, (bs,)), 10)
training_plan.build(X, y, th.tensor([bs]), th.tensor([lr]), model_params, trace_autograd=True)

# Produce training plan result after the first batch.
mnist_dataset = th.utils.data.DataLoader(
    datasets.MNIST('data', train=True, download=True, transform=transforms.ToTensor()),
    batch_size=bs,
    shuffle=False
)
X, y = next(iter(mnist_dataset))
X = X.view(bs, -1)
y_oh = th.nn.functional.one_hot(y, 10).float()
training_plan.forward = None
loss, acc, *upd_params = training_plan(X, y_oh, th.tensor([bs], dtype=th.float32), th.tensor([lr]), model_params)

print("MNIST plan (torch): ")
print(training_plan.code)

training_plan.base_framework = TranslationTarget.TENSORFLOW_JS.value
print("MNIST plan: ")
print(training_plan.code)

# = Plan with state =
@sy.func2plan(args_shape=[(2,2)], state=(th.tensor([4.2, 7.3]),))
def plan_with_state(x, state):
    (y,) = state.read()
    x = x + y
    x = th.abs(x)
    return x

plan_with_state.base_framework = TranslationTarget.TENSORFLOW_JS.value
print("Plan w/ state: ")
print(plan_with_state.code)

# = Bandit plans =
# Simple
reward = th.tensor([0.0, 0.0, 0.0])
n_so_far = th.tensor([1.0, 1.0, 1.0])
means = th.tensor([1.0, 2.0, 3.0])
bandit_args = [reward, n_so_far, means]
bandit_arg_shape = [arg.shape for arg in bandit_args]
@sy.func2plan(args_shape=bandit_arg_shape)
def bandit(reward, n_so_far, means):
    prev = means
    new = th.div(prev*(n_so_far-1),n_so_far) + th.div(reward,n_so_far)
    means=new
    return means

bandit.base_framework = TranslationTarget.TENSORFLOW_JS.value
print("Bandit simple plan: ")
print(bandit.code)

# Thompson
alphas = th.tensor([1.0, 1.0, 1.0], requires_grad=False)
betas = th.tensor([1.0, 1.0, 1.0], requires_grad=False)
rwd = th.tensor([0.0, 0.0, 0.0])
samples = th.tensor([0.0, 0.0, 0.0])
bandit_args_th = [rwd, samples, alphas, betas]
bandit_th_args_shape = [rwd.shape, samples.shape, alphas.shape, betas.shape]
@sy.func2plan(args_shape=bandit_th_args_shape)
def bandit_thompson(reward, sample_vector, alphas, betas):
    prev_alpha = alphas
    prev_beta = betas
    alphas = prev_alpha.add(reward)
    betas = prev_beta.add(sample_vector.sub(reward))
    return (alphas, betas)

bandit_thompson.base_framework = TranslationTarget.TENSORFLOW_JS.value
print("Bandit thompson plan: ")
print(bandit_thompson.code)

replacements = {
    'MNIST_BATCH_SIZE': bs,
    'MNIST_LR': lr,
    'MNIST_PLAN': serialize_to_b64_pb(hook.local_worker, training_plan),
    'MNIST_BATCH_DATA': serialize_to_b64_pb(hook.local_worker, tensors_to_state([X, y_oh])),
    'MNIST_MODEL_PARAMS': serialize_to_b64_pb(hook.local_worker, tensors_to_state(model_params)),
    'MNIST_UPD_MODEL_PARAMS': serialize_to_b64_pb(hook.local_worker, tensors_to_state(upd_params)),
    'MNIST_LOSS': loss.item(),
    'MNIST_ACCURACY': acc.item(),
    'PLAN_WITH_STATE': serialize_to_b64_pb(hook.local_worker, plan_with_state),
    'BANDIT_SIMPLE_PLAN': serialize_to_b64_pb(hook.local_worker, bandit),
    'BANDIT_SIMPLE_MODEL_PARAMS': serialize_to_b64_pb(hook.local_worker, tensors_to_state([means])),
    'BANDIT_THOMPSON_PLAN': serialize_to_b64_pb(hook.local_worker, bandit_thompson),
    'BANDIT_THOMPSON_MODEL_PARAMS': serialize_to_b64_pb(hook.local_worker, tensors_to_state([alphas, betas])),
}

with open("dummy.tpl.js", "r") as tpl, open("dummy.js", "w") as output:
    js_tpl = tpl.read()
    for k, v in replacements.items():
        js_tpl = js_tpl.replace(f"%{k}%", str(v))
    output.write(js_tpl)
