# Root Render

创建了 react root 之后，后续就是执行 root 上的 render 方法了

```javascript
ReactRoot.prototype.render = function(
  children: ReactNodeList,
  callback: ?() => mixed,
): Work {
  const root = this._internalRoot;
  const work = new ReactWork();
  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    work.then(callback);
  }
  updateContainer(children, root, null, work._onCommit);
  return work;
};
```

- 获取root，然后创建 ReactWork 实例

  ```javascript
  function ReactWork() {
    this._callbacks = null;
    this._didCommit = false;
    // list of Work objects.
    this._onCommit = this._onCommit.bind(this);
  }
  ```

- 调用 updateContainer 方法。element 其实就是 ReactDOM.render 的第一个参数。container 就是 fiberRoot，fiberRoot.current 就是 rootFiber 也就是 createHostRootFiber 中的 uninitializedFiber。然后会计算一个 currentTime  和 expirationTime。这个两个 time 晚点再看计算方式。最后调用 updateContainerAtExpirationTime 这个方法

  ```javascript
  export function updateContainer(
    element: ReactNodeList,
    container: OpaqueRoot,
    parentComponent: ?React$Component<any, any>,
    callback: ?Function,
  ): ExpirationTime {
    const current = container.current;
    const currentTime = requestCurrentTime();
    const expirationTime = computeExpirationForFiber(currentTime, current);
    return updateContainerAtExpirationTime(
      element,
      container,
      parentComponent,
      expirationTime,
      callback,
    );
  }
  ```

- updateContainerAtExpirationTime 中，因为 parentComponent 是 null 所以 context 直接就是 `{}` 了，然后调用 scheduleRootUpdate 方法

  ```javascript
  export function updateContainerAtExpirationTime(
    element: ReactNodeList,
    container: OpaqueRoot,
    parentComponent: ?React$Component<any, any>,
    expirationTime: ExpirationTime,
    callback: ?Function,
  ) {
    // TODO: If this is a nested container, this won't be the root.
    const current = container.current;
    const context = getContextForSubtree(parentComponent);
    if (container.context === null) {
      container.context = context;
    } else {
      container.pendingContext = context;
    }
  
    return scheduleRootUpdate(current, element, expirationTime, callback);
  }
  ```

