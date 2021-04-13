# CreateRoot

root 存储在 container 上的 _reactRootContarner 属性中，第一次渲染的时候是null。在 ReactDOM.render 方法中会先创建这个root

- 调用 legacyCreateRootFromDOMContainer 方法，传入 container 和 forceHydrate，客户端渲染下这个 forceHydrate 一般是 false。

  ```javascript
  function legacyCreateRootFromDOMContainer(
    container: DOMContainer,
    forceHydrate: boolean,
  ): Root {
    const shouldHydrate =
      forceHydrate || shouldHydrateDueToLegacyHeuristic(container);
    // First clear any existing content.
    if (!shouldHydrate) {
      let warned = false;
      let rootSibling;
      while ((rootSibling = container.lastChild)) {
        container.removeChild(rootSibling);
      }
    }
    // Legacy roots are not async by default.
    const isConcurrent = false;
    return new ReactRoot(container, isConcurrent, shouldHydrate);
  }
  ```

  

- 在 `legacyCreateRootFromDOMContainer` 中，如果 `container` 有子元素的，那么会删除所有的子元素，再往下就是创建 `ReactRoot` 的实例了

- 在 `ReactRoot` 方法中先调用 `createContainer` 方法创建 `root` ，传入3个参数 `container` ,  `isConcurrent` , `hydrate `。这个 `isConcurrent` 是 `Concurrent` 渲染模式下目前还没有标准化。并将 `root` 赋值给 `ReactRoot`实例上的 `_internalRoot` 属性

  ```javascript
  function ReactRoot(
    container: DOMContainer,
    isConcurrent: boolean,
    hydrate: boolean,
  ) {
    const root = createContainer(container, isConcurrent, hydrate);
    this._internalRoot = root;
  }
  ```

- 在 createContainer 方法中调用了 createFiberRoot 方法

  ```javascript
  function createContainer(containerInfo, isConcurrent, hydrate) {
    return createFiberRoot(containerInfo, isConcurrent, hydrate);
  }
  ```

- 在 createFiberRoot 中先调用 createHostRootFiber 方法创建一个为初始化的 uninitializedFiber。而 createHostRootFiber 也是调用的 createFiber 方法

  ```javascript
  function createHostRootFiber(isConcurrent) {
    var mode = isConcurrent ? ConcurrentMode | StrictMode : NoContext;
  
    if (enableProfilerTimer && isDevToolsPresent) {
      // Always collect profile timings when DevTools are present.
      // This enables DevTools to start capturing timing at any pointâ€“
      // Without some nodes in the tree having empty base times.
      mode |= ProfileMode;
    }
    return createFiber(HostRoot, null, null, mode);
  }
  
  // This is a constructor function, rather than a POJO constructor, still
  // please ensure we do the following:
  // 1) Nobody should add any instance methods on this. Instance methods can be 
  //    more difficult to predict when they get optimized and they are almost 任何人都不许添加实例方法
  //    never inlined properly in static compilers.
  // 任何人都不许添加实例方法。实例方法在得到优化时可能更难预测，它们在静态编译器中几乎从未正确内联过。
  // 2) Nobody should rely on `instanceof Fiber` for type testing. We should
  //    always know when it is a fiber. 任何人都不应该依赖  `instanceof Fiber` 进行类型测试。当这是 fiber 的时候我们应该知道的
  // 3) We might want to experiment with using numeric keys since they are easier
  //    to optimize in a non-JIT environment.
  // 4) We can easily go from a constructor to a createFiber object literal if that
  //    is faster.
  // 5) It should be easy to port this to a C struct and keep a C implementation
  //    compatible.
  var createFiber = function (tag, pendingProps, key, mode) {
    return new FiberNode(tag, pendingProps, key, mode);
  };
  
  /**
  * FiberNode 构造函数
  */
  function FiberNode(tag, pendingProps, key, mode) {
    // Instance
    this.tag = tag;
    this.key = key;
    this.elementType = null;
    this.type = null;
    this.stateNode = null;
  
    // Fiber
    this.return = null;
    this.child = null;
    this.sibling = null;
    this.index = 0;
  
    this.ref = null;
  
    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.updateQueue = null;
    this.memoizedState = null;
    this.contextDependencies = null;
  
    this.mode = mode;
  
    // Effects
    this.effectTag = NoEffect;
    this.nextEffect = null;
  
    this.firstEffect = null;
    this.lastEffect = null;
  
    this.expirationTime = NoWork;
    this.childExpirationTime = NoWork;
  
    this.alternate = null;
  
    if (enableProfilerTimer) {
      this.actualDuration = Number.NaN;
      this.actualStartTime = Number.NaN;
      this.selfBaseDuration = Number.NaN;
      this.treeBaseDuration = Number.NaN;
      this.actualDuration = 0;
      this.actualStartTime = -1;
      this.selfBaseDuration = 0;
      this.treeBaseDuration = 0;
    }
  }
  ```

- 给 root 赋值，并返回

  ```javascript
  function createFiberRoot(containerInfo, isConcurrent, hydrate) {
    // Cyclic construction. This cheats the type system right now because
    // stateNode is any.
    var uninitializedFiber = createHostRootFiber(isConcurrent);
  
    var root = void 0;
    if (enableSchedulerTracing) {
      root = {
        current: uninitializedFiber,
        containerInfo: containerInfo,
        pendingChildren: null,
  
        earliestPendingTime: NoWork,
        latestPendingTime: NoWork,
        earliestSuspendedTime: NoWork,
        latestSuspendedTime: NoWork,
        latestPingedTime: NoWork,
  
        pingCache: null,
  
        didError: false,
  
        pendingCommitExpirationTime: NoWork,
        finishedWork: null,
        timeoutHandle: noTimeout,
        context: null,
        pendingContext: null,
        hydrate: hydrate,
        nextExpirationTimeToWorkOn: NoWork,
        expirationTime: NoWork,
        firstBatch: null,
        nextScheduledRoot: null,
  
        interactionThreadID: unstable_getThreadID(),
        memoizedInteractions: new Set(),
        pendingInteractionMap: new Map()
      };
    } else {
      // 其实这的代码跟上面差不多的少了最下面三个属性而已
    }
  
    uninitializedFiber.stateNode = root;
    return root;
  }
  ```



至此，ReactRoot 就创建好了，后续就是执行 root.render 了