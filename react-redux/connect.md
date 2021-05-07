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

> context v6.0 才开始支持

