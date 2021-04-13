# ReactDOM.render

render 方法主要分为几个阶段

- createRoot 创建 fiberRoot，fiberRoot的current 指向 rootFiber，rootFiber的stateNode 属性指向这个 fiberRoot
- 执行 root.render，计算 currentTime 和 expirationTime，然后进入 scheduleRootUpdate中
- 在 scheduleRootUpdate 中创建 更新队列 enqueueUpdate
- 开始执行 scheduleWork 调度工作
- 在 scheduleWork 中会处理很多东西