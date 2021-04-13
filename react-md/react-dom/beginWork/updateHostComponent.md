# updateHostComponent

进入函数，首先执行的就是 [pushHostContext](#pushHostContext)

```javascript
function updateHostComponent(current, workInProgress, renderExpirationTime) {
  pushHostContext(workInProgress);

  if (current === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  }

  const type = workInProgress.type;
  const nextProps = workInProgress.pendingProps;
  const prevProps = current !== null ? current.memoizedProps : null;

  let nextChildren = nextProps.children;
  const isDirectTextChild = shouldSetTextContent(type, nextProps);

  if (isDirectTextChild) {
    // We special case a direct text child of a host node. This is a common
    // case. We won't handle it as a reified child. We will instead handle
    // this in the host environment that also have access to this prop. That
    // avoids allocating another HostText fiber and traversing it.
    nextChildren = null;
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    // If we're switching from a direct text child to a normal child, or to
    // empty, we need to schedule the text content to be reset.
    workInProgress.effectTag |= ContentReset;
  }

  markRef(current, workInProgress);

  // Check the host config to see if the children are offscreen/hidden.
  if (
    renderExpirationTime !== Never &&
    workInProgress.mode & ConcurrentMode &&
    shouldDeprioritizeSubtree(type, nextProps)
  ) {
    // Schedule this fiber to re-render at offscreen priority. Then bailout.
    workInProgress.expirationTime = workInProgress.childExpirationTime = Never;
    return null;
  }

  reconcileChildren(
    current,
    workInProgress,
    nextChildren,
    renderExpirationTime,
  );
  return workInProgress.child;
}
```



<h4><span id="pushHostContext">pushHostContext</span></h4>

```javascript
function pushHostContext(fiber: Fiber): void {
  const rootInstance: Container = requiredContext(
    rootInstanceStackCursor.current,
  );
  const context: HostContext = requiredContext(contextStackCursor.current);
  const nextContext = getChildHostContext(context, fiber.type, rootInstance);

  // Don't push this Fiber's context unless it's unique.
  if (context === nextContext) {
    return;
  }

  // Track the context and the Fiber that provided it.
  // This enables us to pop only Fibers that provide unique contexts.
  push(contextFiberStackCursor, fiber, fiber);
  push(contextStackCursor, nextContext, fiber);
}

function requiredContext<Value>(c: Value | NoContextT): Value {
  invariant(
    c !== NO_CONTEXT,
    'Expected host context to exist. This error is likely caused by a bug ' +
      'in React. Please file an issue.',
  );
  return (c: any);
}
```

