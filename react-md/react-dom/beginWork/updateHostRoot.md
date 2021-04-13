# updateHostRoot

[`pushHostRootContext`](#pushHostRootContext) 函数主要将一些值 push 到 `valueStack` 这个数组变量中。

- root (也就是 `workInProgress.stateNode`) 的 `pendingContext` 如果不是 `null` 或者 `root.context` 不是`null` ，都会执行 `pushTopLevelContextObject` 函数，这个函数接收 3 个参数

  - `fiber` 当前执行的 `workInProgresss`
  - `context` 当前 `root.pendingContext` 或者 `root.context` 不是 `null` 的那个，当前几乎全是 `root.context`
  - `didChange` 如果 `root.pendingContent` 不是 `null` 那么是 `root.pendingContext !== root.context` 的结果；否则是 `false`

  在这个函数中，会调用2次 `push` 函数。`push` 函数呢也是接收3个参数；变量 `index` 初始值 `-1`先 `index++` ，之后 将 `valueStack[index] = cursor.current` ，最后 `cursor.current = value`

  - `cursor` 含有 `current` 属性的一个对象  类似 `{ current: null }`
  - `value` 即将赋值个 `cursor.current` 属性的值
  - `fiber` 就是当前的 `workInProgress`

  ``pushTopLevelContextObject`` 函数调用2次 `push`，第一次 `push(contextStackCursor, context, fiber);` 第二次 `push(didPerformWorkStackCursor, didChange, fiber);`

- 之后执行 `pushHostContainer` 函数。这个函数接收2个参数

  - fiber 当前 workInProgress 也就是 rootFiber
  - nextRootInstance 当前 root 的实例（ `root.containerInfo` ）

  这个函数中会多次执行 `push` 函数

```javascript
function updateHostRoot(current, workInProgress, renderExpirationTime) {
  pushHostRootContext(workInProgress);
```

`processUpdateQueue` 这个函数字面上就是处理更新队列，这个函数接收 5个参数。

```javascript
  const updateQueue = workInProgress.updateQueue;
  const nextProps = workInProgress.pendingProps; // 对于 rootFibe 来说什么 props 啊 state之类全是null
  const prevState = workInProgress.memoizedState;
  const prevChildren = prevState !== null ? prevState.element : null;
  processUpdateQueue(
    workInProgress,
    updateQueue,
    nextProps,
    null,
    renderExpirationTime,
  );
```

对比 prevChildren 和 nextChildren，如果相同那么 state 跟之前相同就没必要继续执行下去的

```javascript
  const nextState = workInProgress.memoizedState;
  // Caution: React DevTools currently depends on this property
  // being called "element".
  const nextChildren = nextState.element;
  if (nextChildren === prevChildren) {
    // If the state is the same as before, that's a bailout because we had
    // no work that expires at this time.
    resetHydrationState();
    return bailoutOnAlreadyFinishedWork(
      current,
      workInProgress,
      renderExpirationTime,
    );
  }
```

到 `reconcileChildren` 函数了

```javascript
  const root = workInProgress.stateNode;
  if (
    (current === null || current.child === null) &&
    root.hydrate &&
    enterHydrationState(workInProgress)
  ) {
    // If we don't have any current children this might be the first pass.
    // We always try to hydrate. If this isn't a hydration pass there won't
    // be any children to hydrate which is effectively the same thing as
    // not hydrating.

    // This is a bit of a hack. We track the host root as a placement to
    // know that we're currently in a mounting state. That way isMounted
    // works as expected. We must reset this before committing.
    // TODO: Delete this when we delete isMounted and findDOMNode.
    workInProgress.effectTag |= Placement;

    // Ensure that children mount into this root without tracking
    // side-effects. This ensures that we don't store Placement effects on
    // nodes that will be hydrated.
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderExpirationTime,
    );
  } else {
    // Otherwise reset hydration state in case we aborted and resumed another
    // root.
    // 否则重置 调和状态防止我们终止并恢复另一个
    reconcileChildren(
      current,
      workInProgress,
      nextChildren,
      renderExpirationTime,
    );
    resetHydrationState();
  }
  return workInProgress.child;
}
```



#### `pushHostRootContext` 函数 {#pushHostRootContext}

```javascript
function pushHostRootContext(workInProgress) {
  const root = (workInProgress.stateNode);
  if (root.pendingContext) {
    pushTopLevelContextObject(
      workInProgress,
      root.pendingContext,
      root.pendingContext !== root.context,
    );
  } else if (root.context) {
    // Should always be set
    pushTopLevelContextObject(workInProgress, root.context, false);
  }
  pushHostContainer(workInProgress, root.containerInfo);
}

// didPerformWorkStackCursor 是通过 createCursor(false) 生成的，这里直接写返回值了
let didPerformWorkStackCursor = {current: false}
function pushTopLevelContextObject(
  fiber: Fiber,
  context: Object,
  didChange: boolean,
): void {
  push(contextStackCursor, context, fiber);
  push(didPerformWorkStackCursor, didChange, fiber);
}

function pushHostContainer(fiber, nextRootInstance) {
  // Push current root instance onto the stack;
  // This allows us to reset root when portals are popped.
  push(rootInstanceStackCursor, nextRootInstance, fiber);
  // Track the context and the Fiber that provided it.
  // This enables us to pop only Fibers that provide unique contexts.
  push(contextFiberStackCursor, fiber, fiber);

  // Finally, we need to push the host context to the stack.
  // However, we can't just call getRootHostContext() and push it because
  // we'd have a different number of entries on the stack depending on
  // whether getRootHostContext() throws somewhere in renderer code or not.
  // So we push an empty value first. This lets us safely unwind on errors.
  // 先推入一个空值，之后清除这个空值再插入真正的值
  push(contextStackCursor, NO_CONTEXT, fiber);
  const nextRootContext = getRootHostContext(nextRootInstance);
  // Now that we know this function doesn't throw, replace it.
  pop(contextStackCursor, fiber);
  push(contextStackCursor, nextRootContext, fiber);
}

const valueStack = [];
let index = -1;

function push(cursor, value, fiber) {
  index++;
  valueStack[index] = cursor.current;
  cursor.current = value;
}
```

#### `processUpdateQueue` 函数

- 调用 `ensureWorkInProgressQueueIsAClone` 函数，确保 `processUpdateQueue` 参数中的 queue 是从 `workInProgress` 中克隆的。传入 `processUpdateQueue` 的 `queue` 是 `workInProgress.updateQueue` 。而 `workInProgress` 在创建的时候其 `updateQueue` 属性是从 `current.updateQueue` 复制过去的。因而在  `ensureWorkInProgressQueueIsAClone` 函数中 `queue === current.updateQueue` 是true。`cloneUpdateQueue` 函数确实返回一个新的 `UpdateQueue` ，这个新的 `UpdateQueue` 的 `baseState` `firstUpdate`  和  `lastUpdate` 是复制的 queue 中的，其余的都是字段都是 null。这样确保了 workInProgress.updateQueue 与 current.updateQueue 拥有同样的值但是是两个不同的对象了
- while 循环从 `queue.firstUpdate` 开始遍历。
  - 进入 `getStateFromUpdate(workInProgress, queue, updte, prevState, nextProps, instance)` 函数，这个函数将 prevState  与update上的部分状态合并之后生成一个新的 resultState 并返回这个 resultState。根据传入的 `update.tag` 去匹配对应的 case（此处对应的是UpdateState）。返回 `Object.assign({}, prevState, partialState)` ，`prevState` 就是 `queue.baseState` ， 而 `partialState` 则是 `upload.payload`
  - 如果 update.callback 不是 null；处理下 update.lastEffect 和 update.firstEffect。这个就不多说了
- while 循环从 queue. firstCapturedUpdate 开始遍历，跟处理方式更上面的一致，只是修改的对象属性不同
- newFirstUpdate 和 newFirstCapturedUpdate 都是null 的情况下 newBaseState = resultState。然后就是下面的 queue.firstUpdate = newFirstUpdate，queue.firstCapturedUpdate = newFirstCapturedUpdate。同时更新 workInProgress.expiration = newExpirationTime ， workInProgress.memorizedState = resultState

```javascript
function ensureWorkInProgressQueueIsAClone<State>(
  workInProgress,
  queue,
) {
  const current = workInProgress.alternate;
  if (current !== null) {
    // If the work-in-progress queue is equal to the current queue,
    // we need to clone it first.
    if (queue === current.updateQueue) {
      queue = workInProgress.updateQueue = cloneUpdateQueue(queue);
    }
  }
  return queue;
}

function getStateFromUpdate<State>(
  workInProgress: Fiber,
  queue: UpdateQueue<State>,
  update: Update<State>,
  prevState: State,
  nextProps: any,
  instance: any,
): any {
  switch (update.tag) {
    case ReplaceState: {
      const payload = update.payload;
      if (typeof payload === 'function') {
        // Updater function
        const nextState = payload.call(instance, prevState, nextProps);
        return nextState;
      }
      return payload;
    }
    case CaptureUpdate: {
      workInProgress.effectTag =
        (workInProgress.effectTag & ~ShouldCapture) | DidCapture;
    }
    // Intentional fallthrough
    case UpdateState: {
      const payload = update.payload;
      let partialState;
      if (typeof payload === 'function') {
        // Updater function
        
        partialState = payload.call(instance, prevState, nextProps);

      } else {
        // Partial state object
        partialState = payload;
      }
      if (partialState === null || partialState === undefined) {
        // Null and undefined are treated as no-ops.
        return prevState;
      }
      // Merge the partial state and the previous state.
      return Object.assign({}, prevState, partialState);
    }
    case ForceUpdate: {
      hasForceUpdate = true;
      return prevState;
    }
  }
  return prevState;
}

export function processUpdateQueue (
  workInProgress, // 当前 fiber
  queue, // 队列
  props, // 等待处理的 props
  instance, // 实例
  renderExpirationTime,
) {
  hasForceUpdate = false;

  queue = ensureWorkInProgressQueueIsAClone(workInProgress, queue);

  // These values may change as we process the queue.
  let newBaseState = queue.baseState;
  let newFirstUpdate = null;
  let newExpirationTime = NoWork;

  // Iterate through the list of updates to compute the result.
  let update = queue.firstUpdate;
  let resultState = newBaseState;
  while (update !== null) {
    const updateExpirationTime = update.expirationTime;
    if (updateExpirationTime < renderExpirationTime) {
      // This update does not have sufficient priority. Skip it.
      if (newFirstUpdate === null) {
        // This is the first skipped update. It will be the first update in
        // the new list.
        newFirstUpdate = update;
        // Since this is the first update that was skipped, the current result
        // is the new base state.
        newBaseState = resultState;
      }
      // Since this update will remain in the list, update the remaining
      // expiration time.
      if (newExpirationTime < updateExpirationTime) {
        newExpirationTime = updateExpirationTime;
      }
    } else {
      // This update does have sufficient priority. Process it and compute
      // a new result.
      resultState = getStateFromUpdate(
        workInProgress,
        queue,
        update,
        resultState,
        props,
        instance,
      );
      const callback = update.callback;
      if (callback !== null) {
        workInProgress.effectTag |= Callback;
        // Set this to null, in case it was mutated during an aborted render.
        update.nextEffect = null;
        if (queue.lastEffect === null) {
          queue.firstEffect = queue.lastEffect = update;
        } else {
          queue.lastEffect.nextEffect = update;
          queue.lastEffect = update;
        }
      }
    }
    // Continue to the next update.
    update = update.next;
  }

  // Separately, iterate though the list of captured updates.
  let newFirstCapturedUpdate = null;
  update = queue.firstCapturedUpdate;
  while (update !== null) {
    const updateExpirationTime = update.expirationTime;
    if (updateExpirationTime < renderExpirationTime) {
      // This update does not have sufficient priority. Skip it.
      if (newFirstCapturedUpdate === null) {
        // This is the first skipped captured update. It will be the first
        // update in the new list.
        newFirstCapturedUpdate = update;
        // If this is the first update that was skipped, the current result is
        // the new base state.
        if (newFirstUpdate === null) {
          newBaseState = resultState;
        }
      }
      // Since this update will remain in the list, update the remaining
      // expiration time.
      if (newExpirationTime < updateExpirationTime) {
        newExpirationTime = updateExpirationTime;
      }
    } else {
      // This update does have sufficient priority. Process it and compute
      // a new result.
      resultState = getStateFromUpdate(
        workInProgress,
        queue,
        update,
        resultState,
        props,
        instance,
      );
      const callback = update.callback;
      if (callback !== null) {
        workInProgress.effectTag |= Callback;
        // Set this to null, in case it was mutated during an aborted render.
        update.nextEffect = null;
        if (queue.lastCapturedEffect === null) {
          queue.firstCapturedEffect = queue.lastCapturedEffect = update;
        } else {
          queue.lastCapturedEffect.nextEffect = update;
          queue.lastCapturedEffect = update;
        }
      }
    }
    update = update.next;
  }

  if (newFirstUpdate === null) {
    queue.lastUpdate = null;
  }
  if (newFirstCapturedUpdate === null) {
    queue.lastCapturedUpdate = null;
  } else {
    workInProgress.effectTag |= Callback;
  }
  if (newFirstUpdate === null && newFirstCapturedUpdate === null) {
    // We processed every update, without skipping. That means the new base
    // state is the same as the result state.
    newBaseState = resultState;
  }

  queue.baseState = newBaseState;
  queue.firstUpdate = newFirstUpdate;
  queue.firstCapturedUpdate = newFirstCapturedUpdate;

  // Set the remaining expiration time to be whatever is remaining in the queue.
  // This should be fine because the only two other things that contribute to
  // expiration time are props and context. We're already in the middle of the
  // begin phase by the time we start processing the queue, so we've already
  // dealt with the props. Context in components that specify
  // shouldComponentUpdate is tricky; but we'll have to account for
  // that regardless.
  workInProgress.expirationTime = newExpirationTime;
  workInProgress.memoizedState = resultState;
}
```



#### reconcileChildren

> current 什么情况下会是 null ？客户端渲染的情况下走 reconcileChildFibers



```javascript
export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderExpirationTime: ExpirationTime,
) {
  if (current === null) {
    // If this is a fresh new component that hasn't been rendered yet, we
    // won't update its child set by applying minimal side-effects. Instead,
    // we will add them all to the child before it gets rendered. That means
    // we can optimize this reconciliation pass by not tracking side-effects.
    // 如果这是一个新的还没有被渲染的组件，我们不会通过应用最小的副作用来更新其子集。相反，我们会在渲染子对象之前将它们全部添加到子对象中。这意味着我们可以通过不跟踪副作用来优化此和解流程。
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderExpirationTime,
    );
  } else {
    // If the current child is the same as the work in progress, it means that
    // we haven't yet started any work on these children. Therefore, we use
    // the clone algorithm to create a copy of all the current children.

    // If we had any progressed work already, that is invalid at this point so
    // let's throw it out.
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderExpirationTime,
    );
  }
}
```



<h4><span id="reconcileChildFibers">reconcileChildFibers</span></h4>

这个方法接受4个参数：

- returnFiber 父组件就是当前的 workInProgress
- currentFirstChild 当前父组件上的子组件（第一次渲染的时候肯定是 null 的）
- newChild 新生成的子组件，可以是 ReactNode，也可以是数组或者数字或者字符串。。
- expirationTime

先判断传入的 newChild 是不是 Fragment，如果是就将 Fragment.props.children 重新赋值给 newChild

```javascript
function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any,
    expirationTime: ExpirationTime,
) {
    // This function is not recursive.
    // If the top level item is an array, we treat it as a set of children,
    // not as a fragment. Nested arrays on the other hand will be treated as
    // fragment nodes. Recursion happens at the normal flow.

    // Handle top level unkeyed fragments as if they were arrays.
    // This leads to an ambiguity between <>{[...]}</> and <>...</>.
    // We treat the ambiguous cases above the same.
    const isUnkeyedTopLevelFragment =
      typeof newChild === 'object' &&
      newChild !== null &&
      newChild.type === REACT_FRAGMENT_TYPE &&
      newChild.key === null;
    if (isUnkeyedTopLevelFragment) {
      newChild = newChild.props.children;
    }
```

判断 newChild 是不是 object 并且不为null，根据 newChild.$$typeof 来执行不同的函数

当 $$typeof 是 REACT_ELEMENT_TYPE , REACT_PORTAL_TYPE 则执行 [placeSingleChild](#placeSingleChildFunction) 并返回。REACT_ELEMENT_TYPE 传入 [reconcileSingleElement](#reconcileSingleElement) 函数执行返回的 fiber 对象

REACT_PORTAL_TYPE 传入 reconcileSinglePortal 函数执行返回的 fiber 对象

```javascript
    // Handle object types
    const isObject = typeof newChild === 'object' && newChild !== null;

    if (isObject) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(
              returnFiber,
              currentFirstChild,
              newChild,
              expirationTime,
            ),
          );
        case REACT_PORTAL_TYPE:
          return placeSingleChild(
            reconcileSinglePortal(
              returnFiber,
              currentFirstChild,
              newChild,
              expirationTime,
            ),
          );
      }
    }
```

newChild 是 string 或者 number

```javascript
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(
        reconcileSingleTextNode(
          returnFiber,
          currentFirstChild,
          '' + newChild,
          expirationTime,
        ),
      );
    }
```

是数组

```javascript
    if (isArray(newChild)) {
      return reconcileChildrenArray(
        returnFiber,
        currentFirstChild,
        newChild,
        expirationTime,
      );
    }
```

有遍历器属性是可遍历的

```javascript
    if (getIteratorFn(newChild)) {
      return reconcileChildrenIterator(
        returnFiber,
        currentFirstChild,
        newChild,
        expirationTime,
      );
    }
```

如果是 object，走到这里说明 newChild 是一个无效的对象类型。如果是 undefined 并且 不是 Fragment，抛出错误

```javascript
    if (isObject) {
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    if (typeof newChild === 'undefined' && !isUnkeyedTopLevelFragment) {
      // If the new child is undefined, and the return fiber is a composite
      // component, throw an error. If Fiber return types are disabled,
      // we already threw above.
      switch (returnFiber.tag) {
        case ClassComponent: {
        }
        // Intentionally fall through to the next case, which handles both
        // functions and classes
        // eslint-disable-next-lined no-fallthrough
        case FunctionComponent: {
          const Component = returnFiber.type;
          invariant(
            false,
            '%s(...): Nothing was returned from render. This usually means a ' +
              'return statement is missing. Or, to render nothing, ' +
              'return null.',
            Component.displayName || Component.name || 'Component',
          );
        }
      }
    }

    // Remaining cases are all treated as empty.
    return deleteRemainingChildren(returnFiber, currentFirstChild);
  }

  return reconcileChildFibers;
}

```



<h4><span id="placeSingleChildFunction">placeSingleChild</span> </h4>

通过 reconcileChildFibers 调用的 shouldTrackSideEffects 都是 true

通过 mountChildFibers 调用的 shouldTrackSideEffects 都是 false

```javascript
function placeSingleChild(newFiber: Fiber): Fiber {
  // This is simpler for the single child case. We only need to do a
  // placement for inserting new children.
  if (shouldTrackSideEffects && newFiber.alternate === null) {
    newFiber.effectTag = Placement;
  }
  return newFiber;
}
```



<h4><span id="reconcileSingleElement">reconcileSingleElement</span></h4>

这个方法是处理单个 element 的，通过 element 生成 fiber并返回。

这个函数接收3个参数，这4个参数除了 element ，其他的跟在 [reconcileChildFibers](#reconcileChildFibers) 函数中的相同。：

- returnFiber 就是父节点
- currentFirstChild 父节点 returnFiber 的第一个子节点也就 returnFiber 的 child 属性值
- element 更新之后的 ReactElement
- expirationTime

```javascript
function reconcileSingleElement(
	returnFiber: Fiber,
 	currentFirstChild: Fiber | null,
 	element: ReactElement,
 	expirationTime: ExpirationTime,
): Fiber {
  const key = element.key;
  let child = currentFirstChild;
```

遍历 returnFiber 的 所有child。returnFiber 只存储第一个子节点 child，然后 child 通过 sibling 存储相邻的下一个兄弟节点。此处就看得出来 key 的 作用了

首次渲染的时候 child 是 null 因此不用走块内容

- 如果 child.key === element.key 说明这两个是同个数据源
  - 但是如果当前 child 的 tag 是 Fragment 并且 element.type === REACT_FRAGMENT_TYPE，或者 child.elementType === element.type ，表明两者是同类型的组件。然后执行 [deleteRemainingChildren](#deleteRemainingChildren) 函数从 child.sibling 开始删除剩余的子节点。然后合并当前的子节点
  - 不同的组件类型，那么先删除所有的 child
- 如果 key 不相同，那么调用 `deleteChild` 删除这个child

```javascript
  while (child !== null) {    
		// TODO: If key === null and child.key === null, then this only applies to
    // the first item in the list.
    if (child.key === key) {
      if (
        child.tag === Fragment
        ? element.type === REACT_FRAGMENT_TYPE
        : child.elementType === element.type
      ) {
        deleteRemainingChildren(returnFiber, child.sibling);
        const existing = useFiber(
          child,
          element.type === REACT_FRAGMENT_TYPE
          ? element.props.children
          : element.props,
          expirationTime,
        );
        existing.ref = coerceRef(returnFiber, child, element);
        existing.return = returnFiber;
        return existing;
      } else {
        deleteRemainingChildren(returnFiber, child);
        break;
      }
    } else {
      deleteChild(returnFiber, child);
    }
    child = child.sibling;
  }
```

首次渲染的时候 child 肯定是 null，所以直接走到这，会根据 element.type 指定不同的函数来创建 element 所对应的 fiber。`REACT_FRAGMENT_TYPE` 对应 `createFiberFromFragment` ，其他情况对应 `createFiberFromElement` ，这里先看 `createFiberFromElement`

```javascript
  if (element.type === REACT_FRAGMENT_TYPE) {
    const created = createFiberFromFragment(
      element.props.children,
      returnFiber.mode,
      expirationTime,
      element.key,
    );
    created.return = returnFiber;
    return created;
  } else {
    const created = createFiberFromElement(
      element,
      returnFiber.mode,
      expirationTime,
    );
    created.ref = coerceRef(returnFiber, currentFirstChild, element);
    created.return = returnFiber;
    return created;
  }
}
```

`createFiberFromElement` 会调用 `createFiberFromTypeAndProps ` 函数，从 类型 和 props 创建 fiber

```javascript
export function createFiberFromElement(
  element: ReactElement,
  mode: TypeOfMode,
  expirationTime: ExpirationTime,
): Fiber {
  let owner = null;
  const type = element.type;
  const key = element.key;
  const pendingProps = element.props;
  const fiber = createFiberFromTypeAndProps(
    type,
    key,
    pendingProps,
    owner,
    mode,
    expirationTime,
  );
  return fiber;
}
```





#### createFiberFromTypeAndProps

这个会先根据type 然后标记 fiberTag 是哪个类型组件的 tag，再调用对应的函数创建 fiber 并返回。这个返回的 fiber 就是下次执行 beginWork 的当前fiber。

```javascript
export function createFiberFromTypeAndProps(
  type: any, // React$ElementType
  key: null | string,
  pendingProps: any,
  owner: null | Fiber,
  mode: TypeOfMode,
  expirationTime: ExpirationTime,
): Fiber {
  let fiber;

  let fiberTag = IndeterminateComponent;
  // The resolved type is set if we know what the final type will be. I.e. it's not lazy.
  let resolvedType = type;
  if (typeof type === 'function') {
    if (shouldConstruct(type)) {
      fiberTag = ClassComponent;
    }
  } else if (typeof type === 'string') {
    fiberTag = HostComponent;
  } else {
    getTag: switch (type) {
      case REACT_FRAGMENT_TYPE:
        return createFiberFromFragment(
          pendingProps.children,
          mode,
          expirationTime,
          key,
        );
      case REACT_CONCURRENT_MODE_TYPE:
        return createFiberFromMode(
          pendingProps,
          mode | ConcurrentMode | StrictMode,
          expirationTime,
          key,
        );
      case REACT_STRICT_MODE_TYPE:
        return createFiberFromMode(
          pendingProps,
          mode | StrictMode,
          expirationTime,
          key,
        );
      case REACT_PROFILER_TYPE:
        return createFiberFromProfiler(pendingProps, mode, expirationTime, key);
      case REACT_SUSPENSE_TYPE:
        return createFiberFromSuspense(pendingProps, mode, expirationTime, key);
      default: {
        if (typeof type === 'object' && type !== null) {
          switch (type.$$typeof) {
            case REACT_PROVIDER_TYPE:
              fiberTag = ContextProvider;
              break getTag;
            case REACT_CONTEXT_TYPE:
              // This is a consumer
              fiberTag = ContextConsumer;
              break getTag;
            case REACT_FORWARD_REF_TYPE:
              fiberTag = ForwardRef;
              break getTag;
            case REACT_MEMO_TYPE:
              fiberTag = MemoComponent;
              break getTag;
            case REACT_LAZY_TYPE:
              fiberTag = LazyComponent;
              resolvedType = null;
              break getTag;
          }
        }
        let info = '';
        invariant(
          false,
          'Element type is invalid: expected a string (for built-in ' +
            'components) or a class/function (for composite components) ' +
            'but got: %s.%s',
          type == null ? type : typeof type,
          info,
        );
      }
    }
  }

  fiber = createFiber(fiberTag, pendingProps, key, mode);
  fiber.elementType = type;
  fiber.type = resolvedType;
  fiber.expirationTime = expirationTime;

  return fiber;
}
```



<h5><span id="deleteRemainingChildren">deleteRemainingChildren</span></h5>

删除剩余子节点 TODO：二次渲染的时候再来看，returnFiber.lastEffect 等其他 effect 是什么作用？？

```javascript
function deleteRemainingChildren(
	returnFiber: Fiber,
 	currentFirstChild: Fiber | null,
): null {
  if (!shouldTrackSideEffects) {
    // Noop.
    return null;
  }

  // TODO: For the shouldClone case, this could be micro-optimized a bit by
  // assuming that after the first child we've already added everything.
  let childToDelete = currentFirstChild;
  while (childToDelete !== null) {
    deleteChild(returnFiber, childToDelete);
    childToDelete = childToDelete.sibling;
  }
  return null;
}

function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {
  if (!shouldTrackSideEffects) {
    // Noop.
    return;
  }
  // Deletions are added in reversed order so we add it to the front.
  // At this point, the return fiber's effect list is empty except for
  // deletions, so we can just append the deletion to the list. The remaining
  // effects aren't added until the complete phase. Once we implement
  // resuming, this may not be true.
  const last = returnFiber.lastEffect;
  if (last !== null) {
    last.nextEffect = childToDelete;
    returnFiber.lastEffect = childToDelete;
  } else {
    returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
  }
  childToDelete.nextEffect = null;
  childToDelete.effectTag = Deletion;
}
```



