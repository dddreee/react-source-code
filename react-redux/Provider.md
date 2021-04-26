# Provider

> The `<Provider>` component makes the Redux `store` available to any nested components that need to access the Redux store.



v5.1.2 版本的 Provider 组件源码非常简单，仅接收一个 store 和 一个 children，**其主要作用就是为需要的子组件提供store**。此处的 `getChildContext` 是过时的 [`context`](https://reactjs.org/docs/legacy-context.html) api。

通过在 Provider 组件中定义一个 `getChildContext` 方法，并且定义类属性 `Provider.childContextTypes`，那么在子组件就可以通过 `this.context` 获取到父组件中 `getChildContext` 方法返回的值

```jsx
import React, { Component, Children } from 'react'
import PropTypes from 'prop-types'
import { storeShape, subscriptionShape } from '../utils/PropTypes'
import warning from '../utils/warning'

export function createProvider(storeKey = 'store') {
    const subscriptionKey = `${storeKey}Subscription`

    class Provider extends Component {
        getChildContext() {
          return { [storeKey]: this[storeKey], [subscriptionKey]: null }
        }

        constructor(props, context) {
          super(props, context)
          this[storeKey] = props.store;
        }

        render() {
          return Children.only(this.props.children)
        }
    }

    if (process.env.NODE_ENV !== 'production') {
      // Use UNSAFE_ event name where supported
      const eventName = prefixUnsafeLifecycleMethods
        ? 'UNSAFE_componentWillReceiveProps'
        : 'componentWillReceiveProps'
      Provider.prototype[eventName] = function (nextProps) {
        if (this[storeKey] !== nextProps.store) {
          warnAboutReceivingStore()
        }
      }
    }

    Provider.propTypes = {
        store: storeShape.isRequired,
        children: PropTypes.element.isRequired,
    }
    Provider.childContextTypes = {
        [storeKey]: storeShape.isRequired,
        [subscriptionKey]: subscriptionShape,
    }

    return Provider
}

export default createProvider()

```

