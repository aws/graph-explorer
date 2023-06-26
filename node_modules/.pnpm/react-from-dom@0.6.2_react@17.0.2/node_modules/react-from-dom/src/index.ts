/* eslint-disable @typescript-eslint/no-use-before-define */
import * as React from 'react';

import { noTextChildNodes, possibleStandardNames, randomString, styleToObject } from './helpers';

export interface Options {
  actions?: Action[];
  index?: number;
  level?: number;
  nodeOnly?: boolean;
  randomKey?: boolean;
  selector?: string;
  type?: string;
}

interface Attributes {
  [index: string]: any;

  key: string;
}

export interface Action {
  // If this returns true, the two following functions are called if they are defined
  condition: (node: Node, key: string, level: number) => boolean;

  // Use this to inject a component or remove the node
  // It must return something that can be rendered by React
  post?: (node: Node, key: string, level: number) => React.ReactNode;

  // Use this to update or replace the node
  // e.g. for removing or adding attributes, changing the node type
  pre?: (node: Node, key: string, level: number) => Node;
}

function parseAttributes(node: Node, reactKey: string): Attributes {
  const attributes: Attributes = {
    key: reactKey,
  };

  /* istanbul ignore else */
  if (node instanceof Element) {
    const nodeClassNames = node.getAttribute('class');

    if (nodeClassNames) {
      attributes.className = nodeClassNames;
    }

    [...node.attributes].forEach(d => {
      switch (d.name) {
        // this is manually handled above, so break;
        case 'class':
          break;
        case 'style':
          attributes[d.name] = styleToObject(d.value);
          break;
        case 'allowfullscreen':
        case 'allowpaymentrequest':
        case 'async':
        case 'autofocus':
        case 'autoplay':
        case 'checked':
        case 'controls':
        case 'default':
        case 'defer':
        case 'disabled':
        case 'formnovalidate':
        case 'hidden':
        case 'ismap':
        case 'itemscope':
        case 'loop':
        case 'multiple':
        case 'muted':
        case 'nomodule':
        case 'novalidate':
        case 'open':
        case 'readonly':
        case 'required':
        case 'reversed':
        case 'selected':
        case 'typemustmatch':
          attributes[possibleStandardNames[d.name] || d.name] = true;
          break;
        default:
          attributes[possibleStandardNames[d.name] || d.name] = d.value;
      }
    });
  }

  return attributes;
}

function parseChildren(childNodeList: NodeList, level: number, options: Options) {
  const children: React.ReactNode[] = [...childNodeList]
    .map((node, index) =>
      convertFromNode(node, {
        ...options,
        index,
        level: level + 1,
      }),
    )
    .filter(Boolean);

  if (!children.length) {
    return null;
  }

  return children;
}

function parseName(nodeName: string) {
  if (/[a-z]+[A-Z]+[a-z]+/.test(nodeName)) {
    return nodeName;
  }

  return nodeName.toLowerCase();
}

export function convertFromNode(input: Node, options: Options = {}): React.ReactNode {
  if (!input || !(input instanceof Node)) {
    return null;
  }

  const { actions = [], index = 0, level = 0, randomKey } = options;

  let node = input;
  let key = `${level}-${index}`;
  const result: React.ReactNode[] = [];

  if (randomKey && level === 0) {
    key = `${randomString()}-${key}`;
  }

  /* istanbul ignore else */
  if (Array.isArray(actions)) {
    actions.forEach((action: Action) => {
      if (action.condition(node, key, level)) {
        if (typeof action.pre === 'function') {
          node = action.pre(node, key, level);

          if (!(node instanceof Node)) {
            node = input;

            /* istanbul ignore else */
            if (process.env.NODE_ENV !== 'production') {
              // eslint-disable-next-line no-console
              console.warn(
                'The `pre` method always must return a valid DomNode (instanceof Node) - your modification will be ignored (Hint: if you want to render a React-component, use the `post` method instead)',
              );
            }
          }
        }

        if (typeof action.post === 'function') {
          result.push(action.post(node, key, level));
        }
      }
    });
  }

  if (result.length) {
    return result;
  }

  switch (node.nodeType) {
    case 1: {
      // regular dom-node
      return React.createElement(
        parseName(node.nodeName),
        parseAttributes(node, key),
        parseChildren(node.childNodes, level, options),
      );
    }
    case 3: {
      // textnode
      const nodeText = node.nodeValue?.toString() || '';

      /* istanbul ignore else */
      if (/^\s+$/.test(nodeText) && !/[\u00A0\u202F]/.test(nodeText)) {
        return null;
      }

      /* istanbul ignore next */
      if (!node.parentNode) {
        return nodeText;
      }

      const parentNodeName = node.parentNode.nodeName.toLowerCase();

      if (noTextChildNodes.includes(parentNodeName)) {
        /* istanbul ignore else */
        if (/\S/.test(nodeText)) {
          // eslint-disable-next-line no-console
          console.warn(
            `A textNode is not allowed inside '${parentNodeName}'. Your text "${nodeText}" will be ignored`,
          );
        }

        return null;
      }

      return nodeText;
    }
    case 8: {
      // html-comment
      return null;
    }
    /* istanbul ignore next */
    default: {
      return null;
    }
  }
}

export function convertFromString(input: string, options: Options = {}): React.ReactNode | Node {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const { nodeOnly = false, selector = 'body > *', type = 'text/html' } = options;

  try {
    const parser = new DOMParser();
    const document = parser.parseFromString(input, type as DOMParserSupportedType);
    const node = document.querySelector(selector);

    if (!(node instanceof Node)) {
      throw new TypeError('Error parsing input');
    }

    if (nodeOnly) {
      return node;
    }

    return convertFromNode(node, options);
  } catch (error) {
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  return null;
}

export default function convert(
  input: Node | string,
  options: Options = {},
): React.ReactNode | Node {
  if (typeof input === 'string') {
    return convertFromString(input, options);
  }

  if (input instanceof Node) {
    return convertFromNode(input, options);
  }

  return null;
}
