# Anvoy

Anvoy (MIT License) is a react-inspired component based JavaScript library for building user interfaces for the web.

Anvoy is very fast ([benchmarks](https://cloud.githubusercontent.com/assets/3513040/20868652/ba10c134-ba2e-11e6-9ada-bb7309ef46fe.png), [repo](https://github.com/melnikov-s/js-framework-benchmark)), small (~ 10k gzipped), has 0 dependencies and supports IE9+. (NOTE: IE9 will require [classList polyfill](https://github.com/eligrey/classList.js))

## Installing

npm isntall: `npm install --save anvoy`

or

standalone UMD bundle: [https://unpkg.com/anvoy/lib/anvoy.js](https://unpkg.com/anvoy/lib/anvoy.js)

## Usage with Redux

[anvoy-redux](https://github.com/melnikov-s/anvoy-redux)

## Usage with Mobx

[mobx-anvoy](https://github.com/melnikov-s/mobx-anvoy)

## Introduction

Anvoy is a UI component library very similar to React. Where Anvoy differs is that it creates a separation between DOM node structure (markup) and node behavior. The node structure is defined once per component and is static, while the behavior is the concern of the `render` method and only for nodes that need to change or have user interaction. This is in contrast to React, where both the element structure and the behavior is a concern of the `render` method. By separating the two we can reduce the complexity of the `render` method for any given component, allow for structure-first or behavior-first development as well as eliminate the need for a virtual DOM and therefore JSX.

## Examples

Note: These examples are taken from React's official site and converted to Anvoy components.

### A Simple Component

```javascript
import {Component, render, create} from 'anvoy';

class HelloMessage extends Component {
    //the static logic-less template, the '@name' inside the curly brackets is not an expression
    //but rather a text node marker.
    static el() {
        return `
            <div>
                Hello {@name}
            </div>
        `;
    }

    //the render description, here we refer to the nodes we've marked in the template
    render(props) {
        return {
            name: props.name
        }
    }
}

render(create(HelloMessage, {name: 'Jane'}), document.body);
```

### A Stateful Component

```javascript
import {Component, render, create} from 'anvoy';

class Timer extends Component {
    //A lifecylce method to get the initial state of the component
    getInitialState() {
        return {secondsElapsed: 0};
    }

    //a lifecycle method that will execute after the component has mounted to the DOM
    didMount() {
        this.interval = setInterval(() => this.tick(), 1000);
    }

    //a lifecycle method that will execute before the component has unmounted from the DOM
    willUnmount() {
        clearInterval(this.interval);
    }

    //our own custom method for this component
    tick() {
        this.setState((prevState) => ({
            secondsElapsed: prevState.secondsElapsed + 1
        }));
    }

    static el() {
        return `
            <div>
                Seconds Elapsed: {@elapsed}
            </div>
        `;
    }

    render(props, state) {
        return {
            elapsed: state.secondsElapsed
        }
    }
}

render(create(Timer), document.body);
```

### An Application

```javascript
import {Component, create, render} from 'anvoy';

class TodoApp extends Component {
    getInitialState() {
        return {items: [], text: ''};
    }

    handleSubmit(el, e) {
        e.preventDefault();

        let newItem = {
            text: this.state.text,
            id: Date.now()
        };

        this.setState( prevState => ({
            items: prevState.items.concat(newItem),
            text: ''
        }));
    }

    handleInput(el, e) {
        this.setState({text: el.value});
    }

    static el() {
        return  `
          <div>
            <h3>TODO</h3>
            <ul>
                <@todoList/>
            <ul/>
            <form @todoForm>
              <input @newTodo type="text"/>
              <button>Add # {@todoCount}</button>
            </form>
          </div>
        `;
    }

    render(props, state) {
        return {
            //a container node that composes other Anvoy components.
            todoList: state.items.map( item => create(Todo, {item, key: item.id})),

            todoForm: {
                //an event handler
                onSubmit: this.handleSubmit
            },

            newTodo: {
                value: state.text,
                onInput: this.handleInput
            },

            todoCount: state.items.length + 1
        };
    }
}

class Todo extends Component {
    static el() {
        return `<li></li>`;
    }

    render(props) {
        //root nodes (li tags in this case) do not need a marker, they are always referred to as 'root'
        return {
            root: {
                text: props.item.text
            }
        };
    }
}

render(create(TodoApp), document.body);
```
### A Component Using External Plugins
```javascript
import {Component, mount} from 'anvoy';

let md = new Remarkable();

class MarkdownEditor extends Component {
    getInitialState() {
        return {value: 'Type some *markdown* here!'};
    }

    handleInput(el) {
        this.setState({value: el.value});
    }

    static el() {
        return `
            <div class="MarkdownEditor">
                <h3>Input</h3>
                <textarea @input></textarea>
                <h3>Output</h3>
                <div @output class="content"></div>
            </div>
        `;
    }

    render(props, state) {
        return {
            input: {
                value: state.value,
                onInput: this.handleInput
            },
            output: {
                html: md.render(state.value)
            }
        };
    }
}

render(create(MarkdownEditor), document.body);
```

### More Examples

[TodoMVC example](https://github.com/melnikov-s/anvoy-todomvc-example)
[Kanban Application using Redux](https://github.com/melnikov-s/anvoy-redux-kanban-example)

## Component Structure

An Anvoy component is composed of a static logic-less template, a render method, life cycle hooks and custom methods. During run time a component might receive props from its parent and/or update its internal state, when this occurs the component will then call the render method, get back a render description and apply that description to all the marked nodes within the template as well as run any applicable life-cycle hooks.

There are three types of nodes that an Anvoy component manages:

Text - a DOM TextNode that can have a string value
Element - a DOM Element that can have attributes, events, and text or html content
Container - a virtual node that composes zero or many other components.

## Component Template

A template is defined on a component with the static `el` method. It returns a string HTML template. Once defined on a component the template never changes. Only the marked nodes can change during the component's life. Nodes have to be marked within the template and referenced in the component's render method.

Text nodes are marked using the `{@name}` syntax (eg: `Hi {@lastName}, {@firstName}`). They are represented by a standard DOM Text node and can appear anywhere where a DOM Text node may appear.

Element nodes are marked with the `@name` attribute and like all attributes must appear within an element tag. (eg: `<span @myElem class="myClass"></span>`)

Container nodes are marked using the `<@name/>` syntax, the tags must be self closing and may contain attributes which will be the default props for all contained components. (eg: `<@list myProp="value" />`).

A template must have a single root element.

```javascript
    //INVALID
    class Comp extends Anvoy.Component {
        static el() {
            return `
                <div></div>
                <div></div>
            `;
        }
    }
```

```javascript
    //VALID
    class Comp extends Anvoy.Component {
        static el() {
            return `
                <div>
                    <div></div>
                    <div></div>
                </div>
            `;
        }
    }
```

### Whitespace rules

Templates strip out static whitespace HTML Text nodes that have newline characters in them, this is done to remove whitespace that are used for indentation which can lead to performance degradation in certain circumstances and an overall more complicated DOM tree. This will not be done within `pre` tags.

For example something like this:

```javascript
class Comp extends Anvoy.Component {
    static el() {
        return `
            <div>
                <span> Hello There {@nameA} and {@nameB}</span>
            <div>
        `;
    }
}
```

is equivalent to:

```javascript
class Comp extends Anvoy.Component {
    static el() {
        return `<div><span> Hello There {@nameA} and {@nameB}</span><div>`;
    }
}
```

where the whitespace used for indentation is stripped out.

## Render Method

The render method accepts a component's props and state as arguments and returns a render description. The render description is just a plain object in the form of `{nodeName: nodeDescription}`. Where the `nodeName` is the name marked in the template for each individual node and the `nodeDescription` will differ based on the type of node it is (Text, Element or Container)

The render method must *ALWAYS* preserve the same structure of the returned description and should be a pure function of props and state.

### Text Node Description

A text node description is simply a string.

eg:
```javascript
class Welcome extends Anvoy.Component {
    static el() {
        return `<div>Welcome {@theName}!<div>`;
    }

    render(props) {
        return {
            theName: props.name
        };
    }
}

Anvoy.render(Anvoy.create(Welcome, {name: 'Chloe'}), document.body);
/*
contents of document.body are:
<div>Welcome Chloe!</div>
*/

```

### Element Node Description

An element node description is a key value map. There are some special keys that have their own behaviors (eg: `text`, `html`, `styles`, `classNames`)  while all others will just set attributes directly on the DOM Element.

#### Special Element Attributes

- `text`: [string] set the `textContent` of an element
- `html`: [string] set the `innerHTML` of an element
- `detached`: [boolean] whether the element should be detached from the DOM
- `disabled`: [boolean] like the HTML `disabled` attribute but using `true`/`false`
- `checked`: [boolean] like the HTML `checked` attribute but using `true`/`false`
- `selected`: [boolean] like the HTML 'selected' attribute but using `true`/`false`
- `hidden`: [boolean] like the HTML5 `hidden` attribute but using `true`/`false`
- `classNames`: [object] a map of className to value, if the value is falsy the className will not be applied to the element's `class` HTML attribute. Otherwise it will.
- `styles`: [object] a map of camelCased css properties to style value.
- `defaultValue`: [string] the default `value` attribute value for the element, only applied during the initial render and ignored in subsequent renders.
- `defaultChecked`: [boolean] the default `checked` attribute value for the element, only applied during the initial render and ignored in subsequent renders.

All other attributes will be put directly on the element and the value can either be a string or boolean. In the case of a boolean value, `false` will remove the attribute from the element while `true` will include the attribute with an empty value.

Example:

```javascript
class HelloGoodBye extends Anvoy.Component {
    static el() {
        return `
            <div>
                <span @hello class="hello"></span>
                <span @goodbye class="goodbye"></span>
            <div>
        `;
    }

    render(props) {
        return {
            hello: {
                text: `Hello ${props.name}!`,
                "data-faded": props.sayingGoodBye,
                classNames: {
                    "faded": props.sayingGoodBye,
                    "pulse": !props.sayingGoodBye
                },
                styles: {
                    backgroundColor: props.sayingGoodBye ? '#DDD' : 'initial'
                }
            },
            goodbye: {
                html: `<strong>GoodBye ${props.name}!</strong>`,
                detached: !props.sayingGoodBye
            }
        }
    }
}

Anvoy.render(Anvoy.create(HelloGoodBye, {sayingGoodBye: false, name: 'Chloe'}), document.body);
/*
contents of document.body are:
<div>
    <span class="hello pulse" style="background-color: 'initial';">Hello Chloe!</span>
</div>
*/

Anvoy.render(Anvoy.create(HelloGoodBye, {sayingGoodBye: true, name: 'Chloe'}), document.body);
/*
contents of document.body are:
<div>
    <span class="hello faded" data-faded style="background-color: '#DDD';">Hello Chloe!</span>
    <span class="goodbye"><strong>GoodBye Chloe!</strong></span>
</div>
*/
```

#### Element Events

Events take the form of `{on${EventName}: eventHandlerFunction}`, for example the DOM `click` event will be `onClick` and the DOM  `mousedown` event will be `onMouseDown`.  Typically, the pattern is to take the DOM event name append 'on' and camelCase it. The DOM `dblclick` serves as an exception to this and becomes `onDoubleClick`. For a full list of supported events [click here](https://raw.githubusercontent.com/melnikov-s/anvoy/master/src/core/events.js).

The event handler will always execute in the component's context (`this` will be the component instance). It will receive two arguments, the DOM `Element` of the target and the DOM `Event` object.

example:

```javascript
class ClickCounter extends Anvoy.Component {
    getInitialState() {
        return {counter: 0};
    }

    handleIncrement(el, e) {
        this.setState(prevState => ({counter: prevState.counter + 1}));
    }

    handleDecrement(el, e) {
        this.setState(prevState => ({counter: prevState.counter - 1}));
    }

    static el() {
        return `
            <div>
                {@counter}
                <button @inc>Increment</button>
                <button @dec>Decrement</button>
            </div>
        `;
    }
    render(props, state) {
        return {
            counter: state.counter,
            inc: {
                onClick: this.handleIncrement
            },
            dec: {
                onClick: this.handleDecrement
            }
        }
    }
}
```

#### Custom Element Events
You may also bind custom events using `events` in the element description. `events` is a map of `{event: eventHandlerFunction}`. It does not use the 'on*' nomenclature but rather binds the event directly on the element.

Note: You may only have one type of event handler per element, so if you define `onClick` and a `click` within `events` the `onClick` will take precedence.

### Container Node Description
Container nodes use the top level Anvoy function `create` to generate their description. The `create` function itself generates component description given a component constructor and a set of props. An array of these component descriptions, containing any number of elements, is the description for a `container`.

A `container` node can update its child components in two ways: using keyed and non-keyed updates.

Keyed updates require a unique key value per component which will enable the `container` node to track any type of removal or re-arrangement of child components. The `container` node will then ensure that component instances are preserved during updates.

Non-keyed updates occur when no key has been provided and will simply re-use existing components and update them with the new props provided that the component class matches. Non-keyed updates can perform better in certain situations but should only be used for components that have no internal or instance state.

Note: All component descriptions for a given `container` node must either be keyed or non-keyed. Anvoy will throw an error if only some of the component descriptions have valid keys.

example:
```javascript
class Item extends Anvoy.Component {
    static el() {
        return `<li></li>`
    }

    render(props) {
        return {
            root: {
                text: props.value
            }
        }
    }
}

class List extends Anvoy.Component {
    static el() {
        return `
            <ul>
                <@list/>
            </ul>
        `
    }

    render(props) {
        return {
            list: props.items.map((itemValue, i) => Anvoy.create(Item, {
                key: i,
                value: itemValue
            }))
        }
    }
}

Anvoy.render(Anvoy.create(List, {items: ['one', 'two', 'three']}), document.body);
```

## Top Level Anvoy API

### Anvoy.create

`create(Component | tag, props)`

`create` is a function that will return a component description given a component class as the first argument and some props as the second argument. The `create` function does not actually instantiate anything but instead creates a description to be used in a `container` node description or passed along to the `render` function which will then perform the necessary operations.

Within the props passed into `create` there are some that have special behaviors:

`key` - This attribute takes a unique value for the component which will enable Anvoy to determine if an existing component should be updated with new props or be replaced.

`ref` - This attribute takes a callback function that will be executed right after the component is instantiated. It will have a single argument which will be the created component instance.

#### Anonymous Components

`create` can also create anonymous components, these are single element components provided for convenience.  Anonymous components are useful for generating a dynamic amount of tags (like li, option, etc) without having to define concrete components. Any props passed into these components will become the element description within the render method. To create an anonymous component provide a string HTML tag instead of a component class to `create`.

example:

```javascript
class MyList extends Anvoy.Component {
    static el() {
        return `
            <ul>
                <@list class="my-option" />
            </ul>
        `;
    }

    render(props, state) {
        return {
            list: props.items.map((item, i) => Anvoy.create('li', {
                text: item,
                onClick: () => this.setState({selected: item}),
                classNames: {
                    selected: state.selected === item,
                    even: (i + 1) % 2 === 0
                }
            }))
        };
    }
}

Anvoy.render(Anvoy.create(MyList, {items: ['one', 'two', 'three']}), document.body);
/*
contents of document.body are:
<ul>
    <li class="my-option">one</li>
    <li class="my-option even">two</li>
    <li class="my-option">three</li>
</ul>
*/
```

Event context (`this`) within anonymous component will be the component whose render method was executing during the `create` call.

### Anvoy.clone

`clone(componentDescription, additionalProps)`

`clone` takes an existing component description that was created with `create` along with some additional props and returns a cloned description with the additional props extending the original description props.

### Anvoy.render

`render(componentDescription, DOMMountPoint)`

`render` accepts a component description and a DOM element as the mount point, the component will than be instantiated and mounted to the DOM element. Only one component can exists per mount point and all other content will be removed during `render`.

Subsequent calls to `render` providing the same component class, key (if applicable) and mount point will update the existing component instance instead of tearing it down and re-instantiating it.

### Anvoy.unmount

`unmount(DOMMountPoint)`

unmount an existing component from a mount point.

## Component Lifecycle Methods

Components have lifecycle methods which can be overridden in order to enable code execution in specific moments of a component's execution.

There are three phases of a component's lifecycle: mounting, updating and unmounting.

### Mounting

`getInitialState(props)`: called immediately after component instantiation, expects a return of a plain object to used as the initial state of the component.

`willMount()`: called before the initial render when the component has not yet mounted to the DOM

`render(props, state)`: the initial render, expects a render description as output.

`didMount()`: called after the component has mounted on to the DOM.

### Updating

`willReceiveProps(nextProps)`: called when a component has its props updated from a parent, will not be called if the update was only to the component's internal state. Will always be called if the update originates from a parent component, therefore the `nextProps` might not always differ from the current `props`.

`shouldUpdate(nextProps, nextState)`: Expects a boolean that will determine whether or not child components should be updated. This is meant as a potential optimization, but since Anvoy render methods tend to be much lighter than those of React this should be used very sparingly.

`willUpdate(nextProps, nextState)`: If `shouldUpdate` returns true or is not overridden, the update will begin. `willUpdate` is called right before the component's nodes update.

`render(props, state)`: expects a render description as output, the structure of which must remain constant. Updates all nodes based on the returned description.

`didUpdate(prevState, prevProps)`: called right after the component's nodes update

### Unmounting

`willUnmount()`: called when a component is about to leave the DOM

## Element Lifecycle Methods

Component element nodes also have their own lifecycle. Which allows for elements to have certain behaviors once mounted or before/after an update. Typical use-cases might be to give focus to an element or to apply a third party plugin, for example, a jquery datepicker widget.

### Mounting
`didMount(el)`: Called when the element node has been mounted to the DOM

### Updating
`willUpdate(el, prevProps, prevState)`: Called before all element nodes have been updated

`didUpdate(el, prevProps, prevState)`: Called after all element nodes have been updated

### Unmounting
`willUnmount(el)`: Called right before an element node will be unmounted from the DOM

Element lifecycle methods need to be returned from the static `elements` method in the form of `{nodeName: lifecycleMethods}`. For example:

```javascript
class Form extends Component {
    static el() {
        return `
            <form>
                <input @name type="text"/>
                <input @date type="text"/>
            </form>
        `;
    }

    static elements() {
        return {
            name: {
                didMount(el) {
                    el.focus();
                }
            },
            date: {
                didMount(el) {
                    //using jquery-ui datePicker
                    $(el).datePicker();
                }
            }
        }
    }
}
```

## Component API

### properties
 `props`: (read-only) immutable props that are passed from the parent component
 `state`: (read-only) component's internal state

### methods

`setState(partialState | stateCallback)`: provide a partial state object that will be asynchronously merged with the component's internal state. A callback can also be provided if the changed state has to be derived from the previous state in which case the callback will be invoked on update and will contain the final state as an argument expecting the partial state as output. The returned partial state will then be synchronously merged with the internal state.   

`getRootEl()`: get the root element of a component.

### static class methods

`static getDefaultProps()`: get the default prop values for a given component. A default prop value will be used in place of any `undefined` props attribute from the parent.

## Node-less Components and Higher Ordered Components

It is possible to create an Anvoy component that has no DOM nodes itself but rather wraps zero or one other Anvoy components. This can be used for implementing Higher Ordered Components or injecting additional props to the child component. To create such a component omit the `static el()` method and return either a `create` description (single component) from `render` or `null` (no component)

example:

```javascript
class SayName extends Anvoy.Component {
  static el() {
    return `<div>{@name}</div>`
  }
  render(props) {
    return {
       name: props.name
    }
  }
}

class SayHelloName extends Anvoy.Component {
  render(props) {
    return Anvoy.create(SayName, {name: `Hello ${props.name}`});
  }
}

Anvoy.render(Anvoy.create(SayHelloName, {name: 'Bill'}), document.body);
```

## Element Mixins

Using element lifecyle methods it is possible to add additional behaviors to each element node.  Lifecycle methods for a particular element can also be an array, in which case Anvoy will combine all methods to be executed in sequence. This allows for the possibility of combining multiple different behaviors together on the same element. For example you might have some behaviors that will add a bootstrap tooltip to an element when it is mounted, but you might also have some behaviors that will turn that same element into a date input field using a jquery ui plugin. Instead of manually applying the tooltip or date plugin to each element we can create a general mixin and apply that mixin as needed.

Element lifecycle methods also allow for a `methods` property in which you can add custom element description methods. The `methods` property is a map of custom methods, each method will receive three arguments. First argument will be the reference to the DOM element, second will be the value to be set and the third argument will be a boolean that is set to `true` if the component has mounted.


This is best demonstrated with an example:

```javascript
let toolTip = (options = {}) => ({
  didMount(el) {
    $(el).tooltip(options);
  }
});

let datePicker = (options = {}) => ({
  didMount(el) {
    $(el).datePicker(options);
  },
  methods: {
    setDate(el, value, isMounted) {
      //This will be executed before 'didMount'
      if (isMounted) {
        $(el).datePicker("setDate", value);
      } else {
        el.value = value;
      }
    }
  }
});

class Form extends Anvoy.Component {
  static el() {
    return `
      <form>
        <label>Name</label>
        <input @name type="text" title="Your full name" />
        <input @dob title="Your date of birth" />
      </form>
    `;
  }

  static elements() {
    return {
      name: toolTip(),
      datePicker: [toolTip(), datePicker()]
    }
  }

  render(props) {
    return {
      name: {
        value: props.name
      },
      dob: {
        setDate: props.dob
      }
    }
  }
}
```
## Advanced

### Context

Context allows for sharing state across an entire component tree. This is not a feature that is typically used application development but can be useful for library development. To create a shared context simply overwrite the `getChildContext` method on a component and have it return an object. That object will than be accessible to any children of that component. Context can only be set once in Anvoy and can not be updated.

```javascript
class Parent extends Anvoy.Component {
  getChildContext() {
    return {
      a: 0,
      b: 1,
      c: 2
    }
  }

  willMount() {
    console.log(this.context); //{}
  }

  render() {
    return Anvoy.create(Child);
  }
}

class Child extends Anvoy.Component {
  getChildContext() {
    return {
      c: 3,
      d: 4
    }
  }

  willMount() {
    console.log(this.context); //{a: 0, b: 1, c: 2}
  }

  render() {
    return Anvoy.create(GrandChild);
  }
}

class GrandChild extends Anvoy.Component {
  willMount() {
    console.log(this.context); //{a: 0, b: 1, c: 3, d: 4}
  }
  static el() {
    return `<span></span>`;
  }
}

Anvoy.render(Anvoy.create(Parent), document.body);
```

### Server Side Rendering (experimental)

Server side rendering is still a very much experimental feature in Anvoy, and thus requires the use of the `jsdom` library. `jsdom` is a full DOM implementation for node js, while it does a fantastic job the performance on the server side can be poor. Also there does not exists any type of safe checks on the client side to ensure that the same initial state was used on both the client and server. Use with caution.

#### Universal Component

```javascript
import {Component} from 'anvoy';

export default class ClickCounter extends Component {
    getInitialState(props) {
        return {counter: props.startingCount || 0};
    }

    handleIncrement(el, e) {
        this.setState(prevState => ({counter: prevState.counter + 1}));
    }

    handleDecrement(el, e) {
        this.setState(prevState => ({counter: prevState.counter - 1}));
    }

    static el() {
        return `
            <div>
                {@counter}
                <button @inc>Increment</button>
                <button @dec>Decrement</button>
            </div>
        `;
    }

    render(props, state) {
        return {
            counter: state.counter,
            inc: {
                onClick: this.handleIncrement
            },
            dec: {
                onClick: this.handleDecrement
            }
        }
    }
}

```

#### On the Server

```javascript
import {jsdom} from 'jsdom';
import {render, create, setDocument, renderToString} from 'anvoy';
import express from 'express';
import ClickCounter from './clickCounter';

let app = express();

app.get('/', (req, res) => {
  let doc = jsdom();
  setDocument(doc);
  //need to identify the server side rendered component with a unique id, here we use 'counter'.
  let html = renderToString('counter', create(ClickCounter, {startingCount: 42}));

  res.send(`
      <!doctype html>
      <html>
          <body>
              <div id="app">
                  ${html}
              </div>
              <script src="dist/my-bundle.js"></script>
          </body>
      </html>
  `);
});
```

### On the Client

```javascript
import {render, create, hydrate} from 'anvoy';
import ClickCounter from './clickCounter';

//need to use the same id and props as on the server.
hydrate('counter', create(ClickCounter, {startingCount: 42}))
```

## TODO

### Web Components

One of the strengths of React is that it allows you to create a component which is a small wrapper over some elements and styles and then compose those components, potentially with children. For example `<MyFancyButton>Label</MyFancyButton>`. While this is doable in Anvoy as well it is far more cumbersome. As you will need to mark the component in the template, give it a concrete description within `render` and if needed have a separate component for the children.

Web components might help close this gap. By allowing the developer to create web components with Anvoy and use them like any other element within a standard Anvoy component we can have the strengths of React while also utilizing the standard platform.

### Transitions

Official css animation transition support.

### Improved Server Side Rendering

Create a custom server side renderer that does not rely on jsdom.

## Special Thanks

Thanks to the React team and all the contributors for their amazing work and influence.

# License

The MIT License (MIT)

Copyright (c) 2016 Sergey Melnikov

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
