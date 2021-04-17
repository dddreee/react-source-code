# connect
> connect 作为最常用的一个方法，通过 `connect(mapStateToProps, mapDispatchToProps)(Component)` 的方式，将 store 的状态与 action 绑定到目标组件上。

第一次执行的时候返回一个高阶组件 `connectHOC`
