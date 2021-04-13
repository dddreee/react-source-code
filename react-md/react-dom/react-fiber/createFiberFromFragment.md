# createFiberFromFragment

这是从 React.Fragment 创建 fiber，最终都是调用的 createFiber 来创建fiber。

但是跟其他的比如 createFiberFromElement 等等不同，第二个参数 pendingProps 其他的函数都是传入的null 或者对象，当前这个函数传入的却是是 element.props.children，也就是可能会是数组，那么在 beginWork 函数中，会根据 Fragment 的这个tag去匹配并执行 updateFragment 这个函数

```javascript
const createFiber = function(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode,
): Fiber {
  // $FlowFixMe: the shapes are exact here but Flow doesn't like constructors
  return new FiberNode(tag, pendingProps, key, mode);
};
export function createFiberFromFragment(
  elements: ReactFragment,
  mode: TypeOfMode,
  expirationTime: ExpirationTime,
  key: null | string,
): Fiber {
  const fiber = createFiber(Fragment, elements, key, mode);
  fiber.expirationTime = expirationTime;
  return fiber;
}
```

在updateFragment 中确实如此，直接取 pengdingProps 作为 nextChildren 传入到 reconcileChildren 函数中的

```javascript
function updateFragment(
  current: Fiber | null,
  workInProgress: Fiber,
  renderExpirationTime: ExpirationTime,
) {
  const nextChildren = workInProgress.pendingProps;
  reconcileChildren(
    current,
    workInProgress,
    nextChildren,
    renderExpirationTime,
  );
  return workInProgress.child;
}
```

