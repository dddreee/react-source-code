# [react-redux](https://react-redux.js.org/)

> react-redux 目前最新的版本是 v7.2.3，公司当前项目中使用的是 v5.1.2。关于react-redux 的一些基础概念就不多赘述了，自行查阅文档吧



## Tutorials & APIs

- [Provider](./Provider.md)
- connect (**最核心的api**)
- createProvider （5.x 版本有，6.0之后移除了，其实用不着）
- connectAdvanced （这个其实也用不着，就是一个 connectHOC）
- ReactReduxContext （6.0 新增的，6.0开始使用的新context api）
- batch （7.0新增，批量更新，引用的是 react-dom 中的 unstable_batchedUpdates）
- useDispatch （以下都是 7.1 新增）
- createDispatchHook
- useSelector
- createSelectorHook
- useStore
- createStoreHook
- shallowEqual

---

<details>
<summary>几个大版本历史</summary>
	<ul>
        <li>v5.0 版本 主要修复了一些bug，重写了connect并增加了一些可选属性，优化了性能</li>
        <li>v6.0 版本 使用了新的Context API; 几个破坏性的变化 -- 原先 connect 的 withRef 替换成了 forwardRef 以及原先将store当作props传递给组件的方式将不再支持改为了 context={MyContext} 的方式传递属性；与此同时，react-router-redux 也需要替换为 connect-react-router</li>
        <li>v7.0 版本 使用了 Hooks，因此需要 react@16.8.4 以上的版本。在v6的时候将内部订阅store变更由原本connect的个别组件上升到 Provider 中去订阅了，这个版本又给改回来了因为性能原因;新增了 batch api;用hooks重写了 connect; 恢复了原本在v6移除的将 store 作为 props 传递给组件的功能；并且在后续的版本中添加了一些新api</li>
    </ul>
</details>

