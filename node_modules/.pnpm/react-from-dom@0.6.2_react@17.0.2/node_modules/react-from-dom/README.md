# react-from-dom

[![NPM version](https://badge.fury.io/js/react-from-dom.svg)](https://www.npmjs.com/package/react-from-dom) [![CI](https://github.com/gilbarbara/react-from-dom/actions/workflows/main.yml/badge.svg)](https://github.com/gilbarbara/react-from-dom/actions/workflows/main.yml) [![Maintainability](https://api.codeclimate.com/v1/badges/8b7357d2d51cd2ee7f8e/maintainability)](https://codeclimate.com/github/gilbarbara/react-from-dom/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/8b7357d2d51cd2ee7f8e/test_coverage)](https://codeclimate.com/github/gilbarbara/react-from-dom/test_coverage)

Convert HTML/XML source code or a DOM node to a React element.  
The perfect replacement for React's `dangerouslySetInnerHTML`


## Setup

Install it
```shell-script
npm install react-from-dom
```

## Getting Started

Set a string with HTML/XML source code OR a DOM Node which it will be used to create React elements recursively.

```jsx
import React from 'react';
import convert from 'react-from-dom';

const panel = convert(`
<div class="panel">
  <div class="panel-header">
    <h2>Title</h2>
  </div>
  <div class="panel-content">
    <ul>
      <li>line 1</li>
      <li>line 2</li>
    </ul>
  </div>
  <div class="panel-footer">
    Footer
  </div>
</div>
`);

const audio = document.createElement('audio');
audio.setAttribute('controls', 'true');
audio.setAttribute(
  'src',
  'https://interactive-examples.mdn.mozilla.net/media/examples/t-rex-roar.mp3',
);
const audioContent = document.createTextNode('Your browser does not support the audio element.');
audio.appendChild(audioContent);

const audioElement = convert(audio);

const App = () => (
  <div>
    {panel}
    {audioElement}
  </div>
);
```
## API

The function accepts two parameters:

**input** {string|Node}  - *required*  
An HTML/XML source code string or a DOM node.

**options** {object} - optional

- **actions** {Action[]}  
  An array of actions to parse your input before converting.  
  Read about them below.
- **nodeOnly** {boolean}  
  Return the DOM Node instead of a React Element.  
  *Only used for string inputs.*
- **selector** {string}  
  The CSS selector used to get your entry. Default: `body > *`  
  *Only used for string inputs.*
- **type** {string}  
  The mimeType used by DOMParser's parseFromString. Default: `text/html`  
  *Only used for string inputs.*

### Actions

You can mutate/update a Node before the conversion or replace it  with a ReactNode.

```tsx
{
  // If this returns true, the two following functions are called if they are defined
  condition: (node: Node, key: string, level: number) => boolean;

  // Use this to update or replace the node
  // e.g. for removing or adding attributes, changing the node type
  pre?: (node: Node, key: string, level: number) => Node;

  // Use this to inject a component or remove the node
  // It must return something that can be rendered by React
  post?: (node: Node, key: string, level: number) => React.ReactNode;
}
```

#### Examples

##### Add a class to all elements that match

```javascript
{
  condition: node => node.nodeName.toLowerCase() === 'div',
  pre: node => {
    node.className += ' a-class-added';
    return node;
  },
}
```

##### Remove all elements with a certain class
```javascript
{
  condition: node => node.className.indexOf('delete-me') >= 0,
  post: () => null,
}
```

##### Return a react component for some node types
```javascript
{
  condition: node => node.nodeName.toLowerCase() === 'pre',
  post: (node, key) => (
    <ReactMarkdown key={key} source={node.textContent} />
  ),
},
```

##### Transform one node into another and preserve the childNodes
```javascript
{
  condition: node => node.nodeName.toLowerCase() === 'ul',
  pre: (node) => {
    const ol = document.createElement('ol');
    
    [...node.childNodes].forEach(child => {
      ol.appendChild(child);
    });
    
    return ol;
  }
}
```

## Browser Support

If you need to support legacy browsers you'll need to include a polyfiil for `Number.isNaN` in your app.  
Take a look at [react-app-polyfill](https://www.npmjs.com/package/react-app-polyfill) or [polyfill.io](https://polyfill.io/v3/).

## Credits

This is a fork from [dom-to-react](https://github.com/diva-e/dom-to-react) package. Thanks! ❤️

## License

MIT
