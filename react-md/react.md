# React

> React 作为创建组件的顶层API，提供了多种组件创建方式和一些便捷的API，这篇笔记将从文档和源码的角度介绍下React 组件和其他API

## 组件

组件分为函数组件和class组件，和特殊组件：

- React.Component 和 React.PureComponent 是常用的class组件
- 通过函数声明的组件就是函数组件，也是无状态组件
- 特殊组件：
  	- [React.memo](https://zh-hans.reactjs.org/docs/react-api.html#reactmemo) 高阶组件，包装函数组件，每次更新前比较传入的props，如果props 没变更，则不渲染组件
  	- [React.Fragment](https://zh-hans.reactjs.org/docs/fragments.html) 直接返回一组子组件，且无需向DOM添加额外节点
  	- [Context](https://zh-hans.reactjs.org/docs/context.html) 提供了一个无需为每层组件手动添加props，就能在组件树之间进行数据传递
  	- [React.lazy](https://zh-hans.reactjs.org/docs/code-splitting.html#reactlazy) 提供动态引入组件功能，需要结合 `React.Suspense` 组件使用
  	- ...etc

##### Class 组件

```jsx
import React, { Component, PureComponent } from 'react'
export class MyComponent extends Component {
  render() {
    return <div>Hello, world</div>
  }
}

export class MyPureComponent extends PureComponent {
  render() {
    return <div>Hello, world</div>
  }
}
```

class 组件分为 Component 组件和 PureComponent 组件，这两类组件其实没什么区别，PureComponent 通过浅层的 props 和 state 比对实现了 `shouldComponentUpdate()` 。

---



#### 创建组件 - jsx

jsx  是 React 提供的一种语法糖，可以很好的描述react组件。

```jsx
const element = <div>Hello</div>
```

之后 jsx 通过babel转换成 `React.createElement` 方法，如果不用jsx，也是写成下面这种方式

```jsx
import React, { Component } from 'react'
import ReactDOM from 'react-dom'

/** class 组件 **/
class Title extends Component {
  render () {
    return <h1>Hello</h1>
  }
}
ReactDOM.render(
	<Title />,
  container
)

// 等同于
ReactDOM.render(
	React.createElement(
    Title,
    {},
    null
  ),
  container
)


// 有props情况下
function Name (props) {
  return <div>{props.name}</div>
}

ReactDOM.render(
	<Name name="2333" />，
  container
)
// 等同于
ReactDOM.render(
	React.createELement(
  	Name,
    {name: "2333"},
    null
  ),
  container
)

```

#### React.createElement(type, config, children)

react的组件最终都是通过这个方法创建的 react 元素。这个方法接受3个参数

- type -- 传入的元素类型，可以是字符串/类/函数，如果是字符串，那么会校验是否是DOM元素
- config -- 其实就是props对象
- children -- 子组件，如果有多个子组件，那么在这之后依次插入参数

最终返回一个ReactElement 类型的对象（dom元素，class组件和函数组件）

```jsx
const ReactElementExample = {
 	$$typeof: Symbol.for('react.element'),
  key: null,
  props: {
    name: '2333'
  },
  ref: null,
  type: Name,
  _owner: null
}
```

- $$typeof 表示 React 元素的类型

- key 帮助 React 识别哪些元素改变了，比如被添加或删除。
- type 就是React.createElement 传入的第一个参数，表示组件类型
- _owner 记录创建该元素的组件

#### 特殊组件处理

- `React.memo`

  React.memo 接收2个参数，type 跟上面的type一样，第二个参数 `compare` 是对比方法不传的话就默认浅层对比props，使用方式如下。

  ```jsx
  function MyComponent(props) {
    /* 使用 props 渲染 */
  }
  function areEqual(prevProps, nextProps) {
    /*
    如果把 nextProps 传入 render 方法的返回结果与
    将 prevProps 传入 render 方法的返回结果一致则返回 true，
    否则返回 false
    */
  }
  export default React.memo(MyComponent, areEqual);
  ```

  实际返回的是一个类似 `ReactElement` 的对象，只有3个属性：$$typeof、type、compare

  ```javascript
  const REACT_MEMO_TYPE = Symbol.for('react.memo')
  export default function memo (
    type,
    compare
  ) {
    return {
      $$typeof: REACT_MEMO_TYPE,
      type,
      compare: compare === undefined ? null : compare,
    };
  }
  ```

- `React.Fragment`

  ```jsx
  const element = (
  	<React.Fragment>
    	<p>1</p>
      <p>2</p>
    </React.Fragment>
  )
  React.createElement(
    React.Fragment,
    {},
    React.createElement('p', {}, 1),
    React.createElement('p', {}, 2)
  )
  
  const element2 = {
    $$typeof: Symbol.for('react.element'),
    children: [...],
    type: Symbol.for('react.fragment'),
    key: null,
    ref: null,
    _owner: null
  }
  ```

- Context

  先看下官方文档的一段示例

  ```jsx
  // Context 可以让我们无须明确地传遍每一个组件，就能将值深入传递进组件树。
  // 为当前的 theme 创建一个 context（“light”为默认值）。
  const ThemeContext = React.createContext('light');
  class App extends React.Component {
    render() {
      // 使用一个 Provider 来将当前的 theme 传递给以下的组件树。
      // 无论多深，任何组件都能读取这个值。
      // 在这个例子中，我们将 “dark” 作为当前的值传递下去。
      return (
        <ThemeContext.Provider value="dark">
          <Toolbar />
        </ThemeContext.Provider>
      );
    }
  }
  
  // 中间的组件再也不必指明往下传递 theme 了。
  function Toolbar() {
    return (
      <div>
        <ThemedButton />
      </div>
    );
  }
  
  class ThemedButton extends React.Component {
    // 指定 contextType 读取当前的 theme context。
    // React 会往上找到最近的 theme Provider，然后使用它的值。
    // 在这个例子中，当前的 theme 值为 “dark”。
    static contextType = ThemeContext;
    render() {
      return <Button theme={this.context} />;
    }
  }
  ```

  在源码中，Context 其实就是返回一个特殊的 React 元素，createContext 其实接收2个参数，但是文档中并没有说明大概不需要用到第二个参数。[calculateChangedBits延伸](https://dev.to/alexkhismatulin/react-context-a-hidden-power-3h8j)

  ```javascript
  const REACT_CONTEXT_TYPE = Symbol.for('react.context')
  const REACT_PROVIDER_TYPE = Symbol.for('react.provider')
  export function createContext(
    defaultValue,
    calculateChangedBits,
  ) {
    if (calculateChangedBits === undefined) {
      calculateChangedBits = null;
    }
    const context = {
      $$typeof: REACT_CONTEXT_TYPE,
      _calculateChangedBits: calculateChangedBits,
      _currentValue: defaultValue,
      _currentValue2: defaultValue,
      _threadCount: 0,
      // These are circular
      Provider: null,
      Consumer: null
    };
    context.Provider = {
      $$typeof: REACT_PROVIDER_TYPE,
      _context: context,
    };
  	context.Consumer = context;
    return context;
  }
  ```

- React.lazy 等其他特殊组件，基本都是拥有不同 $$typeof 以及特定属性的特殊 ReactElement 对象。这里就不多赘述了







## APIs

- [hooks](https://zh-hans.reactjs.org/docs/hooks-reference.html) 在React中 hooks 的处理都特别简单，执行的时候获取当前的 `dispatcher`，然后执行 dispatcher 上的对应的hooks方法，主要是在ReactDOM 中处理

  ```javascript
  function resolveDispatcher() {
    var dispatcher = ReactCurrentDispatcher.current;
    !(dispatcher !== null) ? invariant(false, 'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.') : void 0;
    return dispatcher;
  }
  
  function useContext(Context, unstable_observedBits) {
    var dispatcher = resolveDispatcher();
    {
      !(unstable_observedBits === undefined) ? warning$1(false, 'useContext() second argument is reserved for future ' + 'use in React. Passing it is not supported. ' + 'You passed: %s.%s', unstable_observedBits, typeof unstable_observedBits === 'number' && Array.isArray(arguments[2]) ? '\n\nDid you call array.map(useContext)? ' + 'Calling Hooks inside a loop is not supported. ' + 'Learn more at https://fb.me/rules-of-hooks' : '') : void 0;
  
      // TODO: add a more generic warning for invalid values.
      if (Context._context !== undefined) {
        var realContext = Context._context;
        // Don't deduplicate because this legitimately causes bugs
        // and nobody should be using this in existing code.
        if (realContext.Consumer === Context) {
          warning$1(false, 'Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be ' + 'removed in a future major release. Did you mean to call useContext(Context) instead?');
        } else if (realContext.Provider === Context) {
          warning$1(false, 'Calling useContext(Context.Provider) is not supported. ' + 'Did you mean to call useContext(Context) instead?');
        }
      }
    }
    return dispatcher.useContext(Context, unstable_observedBits);
  }
  
  function useState(initialState) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useState(initialState);
  }
  
  function useReducer(reducer, initialArg, init) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useReducer(reducer, initialArg, init);
  }
  
  function useRef(initialValue) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useRef(initialValue);
  }
  
  function useEffect(create, inputs) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useEffect(create, inputs);
  }
  
  function useLayoutEffect(create, inputs) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useLayoutEffect(create, inputs);
  }
  
  function useCallback(callback, inputs) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useCallback(callback, inputs);
  }
  
  function useMemo(create, inputs) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useMemo(create, inputs);
  }
  
  function useImperativeHandle(ref, create, inputs) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useImperativeHandle(ref, create, inputs);
  }
  ```

  就 useState 延伸一下：为什么 useState 能跟 class组件的state 一样能记录状态？ReactDOM 在渲染函数组件执行 useState 的时候，会创建一个hook对象，hook对象上的一个 memoizedState 属性就会存储的 useState 传入的初始值（初次渲染的时候），之后每次更新组件的时候再次执行 useState 都会先判断 memoizedState 是否有值，有的话则返回 memoizedState。如果一个组件中有多个 useState ，hook会用next属性记录后续的 state

- `React.Children` 提供了用于处理 `this.props.children` 不透明数据结构的实用方法。包含 5 个方法 `forEach, map, count, toArray, only`

  - `React.Children.map` 

    ```jsx
    React.Children.map(children, callback, thisArg)
    ```

    源码有点绕，这里就不讲源码了，直接将他的处理逻辑。分为几种情况

    - children 为 null 或者 undefined  值的，会直接返回null
    - children 是字符串或者数字或者是对象并且 $$typeof 为element 和 portal 类型，直接将children 传入 callback 处理
    - children 是数组或者可遍历的数据类型的，那么就会循环处理，并且将嵌套的数据也扁平处理，返回一个数组

  - `React.Children.forEach` 处理如上，不会返回数组

  - `React.Children.count` 返回子组件总数量，相当于 forEach 或 map 调用的次数

  - `only` 验证 `children` 是否只有一个子节点（一个 React 元素），如果有则返回它，否则此方法会抛出错误

  - `toArray` 将 `children` 以数组的方式扁平展开并返回

- `React.isValidElement(object)` 验证对象是不是React元素，返回 true 或 false