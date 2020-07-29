# syft.js Multi-armed Bandit Example

This is a demonstration of how to use [syft.js](https://github.com/openmined/syft.js)
with [PyGrid](https://github.com/OpenMined/pygrid) to train [a multi-armed bandit](https://vwo.com/blog/multi-armed-bandit-algorithm/) in the browser. A multi-armed bandit can be used to perform automated A/B testing on a website or application, while gradually converging your users to the ideal user-experience, given a goal of your choosing.

In this demo, we're automatically generating various website layouts that we want our users to view. There are subtle changes made to the website every time you load the website again, including things like changes in button size, color, or position on the page. In the background, syft.js will track which layouts the user does what we want (click a button) and report a positive model diff for that particular layout. For all other layouts where the user doesn't click on the button, we do not report anything. Over time, our model will slowly start to converge on a "preferred user experience" for the best layout, as chosen by user actions.

While this demo is inherently simple, it's easy to see how one could extend it to a real-world application whereby website layouts are generated and tested by real users, slowly converging to the preferred UX. We're particuarly excited to see derivations of this demo in real-world web and mobile development!

## Quick Start

1. Install and start [PyGrid](https://github.com/OpenMined/pygrid)
2. Install [PySyft](https://github.com/OpenMined/PySyft) and run the [Bandit create plan](<https://github.com/OpenMined/PySyft/blob/master/examples/tutorials/model-centric-fl/Part%2003%20-%20Create%20Plan%20(Bandit%20Demo).ipynb>).
3. Now back in this folder, execute `npm install`
4. And then execute `npm start`

This will launch a web browser running the file `index.js`. Every time you make changes to this file, the server will automatically re-compile your code and refresh the page. No need to start and stop. :)
