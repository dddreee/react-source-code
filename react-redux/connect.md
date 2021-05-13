# connect
> connect 作为最常用的一个方法，一般通过 `connect(mapStateToProps, mapDispatchToProps)(Component)` 的方式，将 store 的状态与 action 绑定到目标组件上。

先看下v5.x的代码

```jsx
// createConnect with default args builds the 'official' connect behavior. Calling it with
// different options opens up some testing and extensibility scenarios
export function createConnect({
  connectHOC = connectAdvanced,
  mapStateToPropsFactories = defaultMapStateToPropsFactories,
  mapDispatchToPropsFactories = defaultMapDispatchToPropsFactories,
  mergePropsFactories = defaultMergePropsFactories,
  selectorFactory = defaultSelectorFactory
} = {}) {
  return function connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    {
      pure = true,
      areStatesEqual = strictEqual,
      areOwnPropsEqual = shallowEqual,
      areStatePropsEqual = shallowEqual,
      areMergedPropsEqual = shallowEqual,
      ...extraOptions
    } = {}
  ) {
    const initMapStateToProps = match(mapStateToProps, mapStateToPropsFactories, 'mapStateToProps')
    const initMapDispatchToProps = match(mapDispatchToProps, mapDispatchToPropsFactories, 'mapDispatchToProps')
    const initMergeProps = match(mergeProps, mergePropsFactories, 'mergeProps')

    return connectHOC(selectorFactory, {
      // used in error messages
      methodName: 'connect',

       // used to compute Connect's displayName from the wrapped component's displayName.
      getDisplayName: name => `Connect(${name})`,

      // if mapStateToProps is falsy, the Connect component doesn't subscribe to store state changes
      shouldHandleStateChanges: Boolean(mapStateToProps),

      // passed through to selectorFactory
      initMapStateToProps,
      initMapDispatchToProps,
      initMergeProps,
      pure,
      areStatesEqual,
      areOwnPropsEqual,
      areStatePropsEqual,
      areMergedPropsEqual,

      // any extra options args can override defaults of connect or connectAdvanced
      ...extraOptions
    })
  }
}

export default createConnect()
```

可以看到 `connect` 是通过 `createConnect` 方法创建的，先来看下这个createConnect方法接收的参数

- connectHOC - connect高阶组件
- mapStateToPropsFactories - mapStateToProps默认值
- mapDispatchToPropsFactories - 同上
- selectorFactory - 注释是这么写的 `selectorFactory returns a final props selector from its mapStateToProps,mapStateToPropsFactories,mapDispatchToProps, mapDispatchToPropsFactories, mergeProps,mergePropsFactories, and pure args.` 大致意思就是将上面的 mapStateToProps， mapxxxxx 之类的参数整合成一个props并返回这个props



这里挺奇怪的 `react-redux` 并没有开放 `createConnect` 这个api，然后又给这个方法传入了默认的参数，这么做有啥意义呢？仅从注释上来看，这个就是为了测试和扩展的时候能够尝试一些不同的配置选项，但是全局搜索了这个方法，并没有其他地方有使用。。。就先略过吧



返回的 `connect` 方法就是项目中经常用到的了，在绝大多数情况下只需要传入2个参数就可以了，而`connect` 其实可以接收4个参数

- mapStateToProps
- mapDispatchToProps
- [mergeProps](https://react-redux.js.org/api/connect#mergeprops-stateprops-dispatchprops-ownprops--object)
- [options](https://react-redux.js.org/api/connect#options-object) (第四个参数)

前两个参数不用多说了，具体讲讲 `mergeProps` 和 第四个参数（暂时叫它 `options` 吧）

### `mergeProps?: (stateProps, dispatchProps, ownProps) => Object`

其实就是一个方法，接收3个参数，返回一个对象，可以将这个对象称为 `mergedProps` 并且会用做 wrapped component 的props。如果不传的话，会默认返回 `{ ...ownProps, ...stateProps, ...dispatchProps }`

### `options?: Object`

```javascript
{
  context?: Object,
  pure?: boolean,
  areStatesEqual?: Function,
  areOwnPropsEqual?: Function,
  areStatePropsEqual?: Function,
  areMergedPropsEqual?: Function,
  forwardRef?: boolean,
}
```

> context 和 forwardRef v6.0 才开始支持

- pure 默认是true，如果是true，包装组件就会跟 PureComponent 一样
- xxxxEqual 这类的都是传入的一个比对函数`shallowEqual`，本身这些比对函数都有默认值并且适用于99%的情况

```javascript
const hasOwn = Object.prototype.hasOwnProperty
/**
这个is函数我是真没看明白。。总之就相当于做了个 x === y 的判断
*/
function is(x, y) {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y
  } else {
    return x !== x && y !== y
  }
}

export default function shallowEqual(objA, objB) {
  if (is(objA, objB)) return true

  // 有一个是null或者非对象，return false
  if (typeof objA !== 'object' || objA === null ||
      typeof objB !== 'object' || objB === null) {
    return false
  }

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)
  // 对比属性的数量，数量不同直接返回false
  if (keysA.length !== keysB.length) return false
  // 通过遍历 keys ，可以比对数组和对象 
  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) ||
        !is(objA[keysA[i]], objB[keysA[i]])) {
      return false
    }
  }

  return true
}

```

- forwardRef 如果为true，那么就会将包装组件上的ref传递给被包装的组件的实例



在接着connect的代码往下看... 这里就以 `initMapStateToProps` 为例子，调用 `match` 函数，传入三个参数

- mapStateToProps 就是我们写connect的时候传入的第一个参数
- mapStateToPropsFactories 这个是一个写死的默认函数 `defaultMapStateToPropsFactories` 从 `mapStateToProps.js` 中引入的默认值，所以我在下面的代码中直接将 mapStateToPropsFactories  替换为 defaultMapStateToPropsFactories
- `'mapStateToProps'` 固定的字符串，只是在有错误的时候做提示用的

```jsx
import defaultMapStateToPropsFactories from './mapStateToProps'

function match(arg, factories, name) {
  for (let i = factories.length - 1; i >= 0; i--) {
    const result = factories[i](arg)
    if (result) return result
  }

  return (dispatch, options) => {
    throw new Error(`Invalid value of type ${typeof arg} for ${name} argument when connecting component ${options.wrappedComponentName}.`)
  }
}
const initMapStateToProps = match(mapStateToProps, /* mapStateToPropsFactories */defaultMapStateToPropsFactories, 'mapStateToProps')
```

这个 `match` 会从末尾开始往前遍历 `defaultMapStateToPropsFactories` , 如果`defaultMapStateToPropsFactories[i](mapStateToProps)` 有返回，那么直接return 这个值

```javascript
// defaultMapStateToPropsFactories
import { wrapMapToPropsConstant, wrapMapToPropsFunc } from './wrapMapToProps'

export function whenMapStateToPropsIsFunction(mapStateToProps) {
  return (typeof mapStateToProps === 'function')
    ? wrapMapToPropsFunc(mapStateToProps, 'mapStateToProps')
    : undefined
}

export function whenMapStateToPropsIsMissing(mapStateToProps) {
  return (!mapStateToProps)
    ? wrapMapToPropsConstant(() => ({}))
    : undefined
}

export default [
  whenMapStateToPropsIsFunction,
  whenMapStateToPropsIsMissing
]
```

这个 `defaultMapStateToPropsFactories` 有两种情况，函数名就很明显了。

- whenMapStateToPropsIsFunction 
- whenMapStateToPropsIsMissing

先看正常情况 ( mapStateToProps 是函数的情况 )，会返回 `wrapMapToPropsFunc(mapStateToProps, 'mapStateToProps')`，接着来看看这个 wrapMapToPropsFunc

```javascript
/**
wrapMapToPropsFunc
*/

// dependsOnOwnProps is used by createMapToPropsProxy to determine whether to pass props as args
// to the mapToProps function being wrapped. It is also used by makePurePropsSelector to determine
// whether mapToProps needs to be invoked when props have changed.
// 
// A length of one signals that mapToProps does not depend on props from the parent component.
// A length of zero is assumed to mean mapToProps is getting args via arguments or ...args and
// therefore not reporting its length accurately..
export function getDependsOnOwnProps(mapToProps) {
  return (mapToProps.dependsOnOwnProps !== null && mapToProps.dependsOnOwnProps !== undefined)
    ? Boolean(mapToProps.dependsOnOwnProps)
    : mapToProps.length !== 1
}

// Used by whenMapStateToPropsIsFunction and whenMapDispatchToPropsIsFunction,
// this function wraps mapToProps in a proxy function which does several things:
// 
//  * Detects whether the mapToProps function being called depends on props, which
//    is used by selectorFactory to decide if it should reinvoke on props changes.
//    
//  * On first call, handles mapToProps if returns another function, and treats that
//    new function as the true mapToProps for subsequent calls.
//    
//  * On first call, verifies the first result is a plain object, in order to warn
//    the developer that their mapToProps function is not returning a valid result.
//    
export function wrapMapToPropsFunc(mapToProps, methodName) {
  return function initProxySelector(dispatch, { displayName }) {
    const proxy = function mapToPropsProxy(stateOrDispatch, ownProps) {
      return proxy.dependsOnOwnProps
        ? proxy.mapToProps(stateOrDispatch, ownProps)
        : proxy.mapToProps(stateOrDispatch)
    }

    // allow detectFactoryAndVerify to get ownProps
    proxy.dependsOnOwnProps = true

    proxy.mapToProps = function detectFactoryAndVerify(stateOrDispatch, ownProps) {
      proxy.mapToProps = mapToProps
      proxy.dependsOnOwnProps = getDependsOnOwnProps(mapToProps)
      let props = proxy(stateOrDispatch, ownProps)

      if (typeof props === 'function') {
        proxy.mapToProps = props
        proxy.dependsOnOwnProps = getDependsOnOwnProps(props)
        props = proxy(stateOrDispatch, ownProps)
      }

      if (process.env.NODE_ENV !== 'production') 
        verifyPlainObject(props, displayName, methodName)

      return props
    }

    return proxy
  }
}

```

`wrapMapToPropsFunc(mapStateToProps, 'mapStateToProps')` 会返回一个 `initProxySelector ` 。

## connectHOC (connectAdvanced)

