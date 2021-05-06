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

