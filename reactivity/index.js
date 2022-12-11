const isObject = target => target !== null && typeof target === 'object'
const convert = target => isObject(target) ? reactive(target) : target

export function reactive(target) {
  if (!isObject(target)) return
  const handler = {
    get(target, key, receiver) {
      // 收集依赖
      track(target, key)
      const result = Reflect.get(target, key, receiver)
      return convert(result)
    },
    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key)
      let result = true
      if (oldValue !== value) {
        result = Reflect.set(target, key, value, receiver)
        // 触发更新
        trigger(target, key)
      }
      return result
    },
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key)
      if (Object.prototype.hasOwnProperty.call(target, key) && result) {
        // 触发更新
        trigger(target, key)
      }
      return result
    }
  }

  return new Proxy(target, handler)
}

let activeEffect = null
export function effect(callback) {
  activeEffect = callback
  callback()
  activeEffect = null
}

// 收集依赖
let targetMap = new WeakMap()
export function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  dep.add(activeEffect)
}

// 触发更新
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep =  depsMap.get(key)
  if (dep) {
    dep.forEach(effect => effect())
  }
 }