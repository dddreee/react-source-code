import verifyPlainObject from './v5.1.2/src/utils/verifyPlainObject'

function wrapMapToPropsConstant(getConstant) {
  return function initConstantSelector(dispatch, options) {
    const constant = getConstant(dispatch, options)

    function constantSelector() { return constant }
    constantSelector.dependsOnOwnProps = false 
    return constantSelector
  }
}

function getDependsOnOwnProps(mapToProps) {
  return (mapToProps.dependsOnOwnProps !== null && mapToProps.dependsOnOwnProps !== undefined)
    ? Boolean(mapToProps.dependsOnOwnProps)
    : mapToProps.length !== 1
}

function wrapMapToPropsFunc(mapToProps, methodName) {
  return function initProxySelector(dispatch, { displayName }) {
    const proxy = function mapToPropsProxy(stateOrDispatch, ownProps) {
      return proxy.dependsOnOwnProps
        ? proxy.mapToProps(stateOrDispatch, ownProps)
        : proxy.mapToProps(stateOrDispatch)
    }

    // allow detectFactoryAndVerify to get ownProps
    proxy.dependsOnOwnProps = true

    proxy.mapToProps = function detectFactoryAndVerify(stateOrDispatch, ownProps) {
      proxy.mapToProps = mapToProps
      proxy.dependsOnOwnProps = getDependsOnOwnProps(mapToProps)
      let props = proxy(stateOrDispatch, ownProps)

      if (typeof props === 'function') {
        proxy.mapToProps = props
        proxy.dependsOnOwnProps = getDependsOnOwnProps(props)
        props = proxy(stateOrDispatch, ownProps)
      }

      if (process.env.NODE_ENV !== 'production') 
        verifyPlainObject(props, displayName, methodName)

      return props
    }

    return proxy
  }
}

function whenMapStateToPropsIsFunction(mapStateToProps) {
  return (typeof mapStateToProps === 'function')
    ? wrapMapToPropsFunc(mapStateToProps, 'mapStateToProps')
    : undefined
}

function whenMapStateToPropsIsMissing(mapStateToProps) {
  return (!mapStateToProps)
    ? wrapMapToPropsConstant(() => ({}))
    : undefined
}
const defaultMapStateToPropsFactories = [
  whenMapStateToPropsIsFunction,
  whenMapStateToPropsIsMissing
]


function match(arg, factories, name) {
  for (let i = factories.length - 1; i >= 0; i--) {
    const result = factories[i](arg)
    if (result) return result
  }

  return (dispatch, options) => {
    throw new Error(`Invalid value of type ${typeof arg} for ${name} argument when connecting component ${options.wrappedComponentName}.`)
  }
}


const mapStateToProps = state => {
  return {
    visible: state.Merchant.visible
  }
}

/**
 * const initMapStateToProps = match(mapStateToProps, defaultMapStateToPropsFactories, 'xxxxx')
 * 
 * match ?????????? defaultMapStateToPropsFactories
 */

const result1 = whenMapStateToPropsIsMissing(mapStateToProps) // undefined

const result2 = whenMapStateToPropsIsFunction(mapStateToProps) // wrapMapToPropsFunc(mapStateToProps, 'mapStateToProps')

if (!result1 && !result2) {
  throw new Error('xxxxx')
}

// ??????????????? wrapMapToPropsFunc(mapStateToProps)


// ?????? initMapStateToProps ????????????
const initMapStateToProps = function initProxySelector (dispatch, { displayName }) {
  const proxy = function mapToPropsProxy(stateOrDispatch, ownProps) {
    return proxy.dependsOnOwnProps
      ? proxy.mapToProps(stateOrDispatch, ownProps)
      : proxy.mapToProps(stateOrDispatch)
  }

  // allow detectFactoryAndVerify to get ownProps
  proxy.dependsOnOwnProps = true

  proxy.mapToProps = function detectFactoryAndVerify(stateOrDispatch, ownProps) {
    proxy.mapToProps = mapStateToProps
    proxy.dependsOnOwnProps = getDependsOnOwnProps(mapStateToProps)
    let props = proxy(stateOrDispatch, ownProps)

    if (typeof props === 'function') {
      proxy.mapToProps = props
      proxy.dependsOnOwnProps = getDependsOnOwnProps(props)
      props = proxy(stateOrDispatch, ownProps)
    }

    if (process.env.NODE_ENV !== 'production') 
      verifyPlainObject(props, displayName, methodName)

    return props
  }

  return proxy
}





/**
 * ***********************************************************************************************
 * ***********************************************************************************************
 * ***********************************************************************************************
 * initMapDispatchToProps
 * ***********************************************************************************************
 */
import { bindActionCreators } from 'redux'
// import { wrapMapToPropsConstant, wrapMapToPropsFunc } from './wrapMapToProps'

export function whenMapDispatchToPropsIsFunction(mapDispatchToProps) {
  return (typeof mapDispatchToProps === 'function')
    ? wrapMapToPropsFunc(mapDispatchToProps, 'mapDispatchToProps')
    : undefined
}

export function whenMapDispatchToPropsIsMissing(mapDispatchToProps) {
  return (!mapDispatchToProps)
    ? wrapMapToPropsConstant(dispatch => ({ dispatch }))
    : undefined
}

export function whenMapDispatchToPropsIsObject(mapDispatchToProps) {
  return (mapDispatchToProps && typeof mapDispatchToProps === 'object')
    ? wrapMapToPropsConstant(dispatch => bindActionCreators(mapDispatchToProps, dispatch))
    : undefined
}
const mapDispatchToPropsFactories = [
  whenMapDispatchToPropsIsFunction,
  whenMapDispatchToPropsIsMissing,
  whenMapDispatchToPropsIsObject
]

/**
 * const initMapDispatchToProps = match(mapDispatchToProps, mapDispatchToPropsFactories, 'mapDispatchToProps')
 * ?????? mapDispatchToProps ?????????????????? mapStateToProps ????????????????????????????????? wrapMapToPropsFunc ???????????? initProxySelector ??????
 * ?????? mapDispatchToProps ????????????????????? wrapMapToPropsConstant ?????????????????? initConstantSelector
 */
 function wrapMapToPropsConstant(getConstant) {
  return function initConstantSelector(dispatch, options) {
    const constant = getConstant(dispatch, options)

    function constantSelector() { return constant }
    constantSelector.dependsOnOwnProps = false 
    return constantSelector
  }
}
// ???????????????????????? mapDispatchToProps ??????????????????
const initMapDispatchToProps =  wrapMapToPropsConstant(dispatch => bindActionCreators(mapDispatchToProps, dispatch))

/**
 * ***********************************************************************************************
 * ***********************************************************************************************
 * ***********************************************************************************************
 * selectorFactory
 * ??? ??????state dispatch ownedProps .... ???????????????props??????
 * ***********************************************************************************************
 */
 export default function finalPropsSelectorFactory(dispatch, {
  initMapStateToProps,
  initMapDispatchToProps,
  initMergeProps,
  ...options
}) {
  const mapStateToProps = initMapStateToProps(dispatch, options)
  const mapDispatchToProps = initMapDispatchToProps(dispatch, options)
  const mergeProps = initMergeProps(dispatch, options)

  if (process.env.NODE_ENV !== 'production') {
    verifySubselectors(mapStateToProps, mapDispatchToProps, mergeProps, options.displayName)
  }

  const selectorFactory = options.pure
    ? pureFinalPropsSelectorFactory
    : impureFinalPropsSelectorFactory

  return selectorFactory(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    dispatch,
    options
  )
}