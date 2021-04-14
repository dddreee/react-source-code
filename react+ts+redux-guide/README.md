# React + Typescript + Redux 不完全指南

> 观前提示：不熟悉 [typescript](https://www.typescriptlang.org/zh/) 和 [redux](https://cn.redux.js.org/) (如果访问不了就自行百度吧)的，也可以看个热闹。本指南只是个人的笔记，完整的指南请戳👉 [这里](https://github.com/piotrwitek/react-redux-typescript-guide)



## React 常用类型速览

### `React.FC<Props>` | `React.FunctionComponent<Props>`

这个类型表示 函数组件

```tsx
const MyComponent: React.FC<Props> = (props) => <div>123</div>
```



### `React.Component<Props, State>`

这个类型表示 类组件

```tsx
class MyComponent extends React.Component<Props, State> {
  render () {
    return <div></div>
  }
}
```



### `React.ReactElement`

表示原生dom组件(`<div />`)和 用户自定义组件`<MyComponent />`

```tsx
const elementOnly: React.ReactElement = <div /> || <MyComponent />
```



### `React.ReactNode`

ReactNode 表示React 节点类型，包含了ReactElement 类型

```tsx
const maybeReactNode = 'string' || 0 || null || false || undefined || <div /> || <MyComponent />
```



### `React.CSSProperties`

表示内敛样式类型

```tsx
const styles: React.CSSProperties = {flex: 1, color: 'red'}
const element = <div style={styles}></div>
```



### `React.HTMLProps<HTMLxxxElement>`

一些HTML元素的属性类型

```tsx
const Input: React.FC<Props & React.HTMLProps<HTMLInputElement>> = props => {...}
<Input accept={...} alt={...} />
```



### `React.ReactEventHandler<HTMLxxxxElement>`

表示事件处理类型

```tsx
const onChange: React.ReactEventHandler<HTMLInputElement> = e => {/*...*/}
<input onChange={onChange} />
```



### React.xxxEvent\<HTMLxxxElement>

表示其他更多指定的事件类型。常用的事件有：`ChangeEvent, FormEvent, FocusEvent, KeyboardEvent, MouseEvent, DragEvent, PointerEvent, WheelEvent, TouchEvent`

```tsx
const handleChange: (e: React.MouseEvent<HTMLDivElement>) => {/*...*/}
<div onMouseMove={handleChange}></div>
```



## React Router 常用类型

> npm install @types/react-router-dom --save

### RouteComponentProps<Params extends { [K in keyof Params]?: string | undefined; } = {}, C extends StaticContext = StaticContext, S = unknown>

表示路由组件属性类型，第一个传入的Params其实表示路由中定义的参数。

```tsx
// 比如我定义一个路由 /app/:id，下面这个组件就是这个路由对应的组件
import React from 'react'
import { RouteComponentProps } from 'react-router-dom'

const AppDetail: React.FC<RouteComponentProps<{ id: string }>> = (props): React.ReactElement => {
  return <div>{props.match.params.id}</div>
}

// 如果有其他一些参数
interface SomeProps {
  name: string
}
const AppDetail: React.FC<SomeProps & RouteComponentProps<{ id: string }>> = props => {
  return <div>{props.match.params.id}-{props.name}</div>
}
```



## React Redux 使用类型

```typescript
// store/contants.tsx
export const UPDATE_CURRENT = 'UPDATE_CURRENT'
export const UPDATE_SIZE = 'UPDATE_SIZE'
export type Action_Type = UPDATE_CURRENT | UPDATE_SIZE
```

```typescript
// store/action.tsx
import * as Constants from './contants'
import { Dispatch } from 'redux'

const {
    UPDATE_SIZE,
    UPDATE_CURRENT
} = Constants

type ConstantsKeys = keyof typeof Constants
export type DemoAction<T = any> = {
	type: ConstantsKeys,
    data: T
}

export const updateCurrent = (curr: number) => (dispatch: Dispatch<DemoAction<number>>) => {
    dispatch({
        type: UPDATE_CURRENT,
        data: curr
    })
}

export const updateSize = (size: number) => (dispatch: Dispatch<DemoAction<number>>) => {
    dispatch({
        type: UPDATE_SIZE,
        data: size
    })
}
```

上面的 `keyof typeof Constants` 返回的是 `UPDATE_SIZE | UPDATE_CURRENT` 类型，主要是为了限制 action.type 只能是这些值

```typescript
// store/reducer.js

import {
    UPDATE_SIZE,
    Action_Type,
    UPDATE_CURRENT
} from './contants'

import {
    Reducer
} from 'redux'

import {
    DemoAction
} from './action'

interface PageState {
    current?: number;
    size?: number
}

const initState: PageState = {
    current: 1,
    size: 10
}

const PageReducer: Reducer<PageState> = (state = initState, action: DemoAction<any>) => {
    switch (action.type) {
        case UPDATE_SIZE:
            return {
                ...state,
                size: action.data
            }
        case UPDATE_CURRENT:
            return {
                ...state,
                current: action.data
            }
        default:
            return {
                ...state
            }
    }
}
```

在redux中，最常用的3个类型就是 `Dispatch, Action, Reducer` 

- ```ts
  export interface Action {
      type: any
  }
  ```

- ```ts
  export interface Dispatch<S> {
      <A extends Action>(action: A): A;
  }
  ```

- ```ts
  // Reducer 类型接收一个泛型 S（就是state对应的类型）并且返回这个 S
  export type Reducer<S> = <A extends Action>(state: S, action: A) => S
  ```



## React Hooks

### useState

```ts

```



```tsx
import React, { useState } from 'react'

const Demo: React.FC = (): React.ReactElement => {
    const [count, setCount] = useState <number> (1)
    const addCount: React.ReactEventHandler<HTMLDivElement> = () => {
        setCount(count + 1)
    }
    return <div onClick={addCount}>{count}</div>
}
```



### useRef

```tsx
import React, { useRef } from 'react'

const Demo: React.FC = (): React.ReactElement => {
    const divRef = useRef <HTMLDivElement | null> (null)
    return <div ref={divRef}>123</div>
}
```





## 使用 `typescript-generator` 将java类转成ts

下面这是使用的部分maven配置，更多配置请查看 [github](https://github.com/vojtechhabarta/typescript-generator)

```xml

<plugin>
  <groupId>cz.habarta.typescript-generator</groupId>
  <artifactId>typescript-generator-maven-plugin</artifactId>
  <version>2.24.612</version>
  <executions>
    <execution>
      <id>generate</id>
      <goals>
        <goal>generate</goal>
      </goals>
      <phase>process-classes</phase>
    </execution>
  </executions>
  <configuration>
    <jsonLibrary>jackson2</jsonLibrary>
    <classes>
       <!--修改这里的类的地址--> 
      <class>com.rongyi.platform.baseorder.dto.OrderRefundDisplayDTO</class>
    </classes>
    <excludeClasses>
      <class>java.io.Serializable</class>
    </excludeClasses>
    <outputKind>module</outputKind>
    <outputFile>target/platform-base-order-server.ts</outputFile>
    <outputFileType>implementationFile</outputFileType>

  </configuration>
</plugin>
```

