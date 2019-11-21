# BASIC.js
A BASIC interpreter written purely in JavaScript

[Try it out](https://gllms.github.io/BASIC.js/)

# Installation
First include math.js
Then include the BASIC.js file from this repository.
Then include your own scripts

```html
<script src="https://url.to/newest/version/of/math.min.js"></script>
<script src="BASIC.js"></script>
<script src="script.js"></script>
```

# Usage
```javascript
t = new SyntaxTree("10 PRINT 2 + 2");
t.runLine(10); // 4
```
# Contributing
Pull requests are always welcome. For major changes, please open an issue first to discuss what you would like to change.
Please make sure to update tests when needed.