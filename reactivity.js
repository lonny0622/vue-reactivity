//保证只有一个活动的effect
let activeEffect = null
//用于保存不同对象的depsMap
const targetMap = new WeakMap()
/**
 *
 * @param {function} eff
 */
function effect(eff) {
    activeEffect = eff
    activeEffect()
    activeEffect = null
}

/**
 * @description 将effect保存到dep
 * @param {Object} target
 * @param {string} key
 */
function track(target,key){
    //只有在有activeEffect时才继续
    if(activeEffect){
        //先获取到指定对象的depsMap
        let depsMap = targetMap.get(target)
        //如果不存在则添加一个
        if(!depsMap){
            targetMap.set(target,(depsMap = new Map()))
        }
        let dep = depsMap.get(key)
        //如果该属性的dep还没有被映射上去，我们将这个dep映射到depsMap
        if(!dep){
            depsMap.set(key,(dep = new Set()))
        }
        //并存储effect
        dep.add(activeEffect)
    }
}
/**
 * @description 重新计算
 * @param target
 * @param key
 */
function trigger( target,key) {
    //先获取指定对象的depsMap，没有就直接返回
    const depsMap = targetMap.get(target)
    if(!depsMap) return
    //首先我们要通过key获取这个属性的dep
    let dep  = depsMap.get(key)
    if(dep){
        //遍历dep运行里面的effect
        dep.forEach(effect=> {
            effect()
        })
    }
}

/**
 * @description 响应式处理
 * @param target 需要实现响应式处理的对象
 * @returns {boolean|any}
 */
function reactive(target){
    const handler = {
        get(target, key, receiver) {
            let result = Reflect.get(target, key, receiver)
            track(target,key)
            return result
        },
        set(target, key, value, receiver) {
            let oldValue = target[key]
            let result = Reflect.set(target, key, value, receiver)
            //只有新旧值不同时才需要调用
            if(oldValue!==value){
                trigger(target,key)
            }
            return result
        }
    }
    return new Proxy(target,handler)
}

/**
 *
 * @param  raw
 * @returns {{value}|*}
 */
function ref(raw){
    const r = {
        get value(){
            track(r,'value')
            return raw
        },
        set value(newVal){
            if(raw!==newVal){
                raw = newVal
                trigger(r,'value')
            }

        }
    }
    return r
}

/**
 * @description 计算属性
 * @param {function} getter
 * @returns {{value}}
 */
function computed(getter) {
    let result = ref()
    effect(()=>result.value = getter())
    return result
}
let product = reactive({price:5,quantity:2})
let total = 0
let salePrice = ref(0)
effect(()=>{
    total = salePrice.value*product.quantity
})
effect(()=>{
    salePrice.value = product.price*0.9
})
console.log(`total = ${total} salePrice = ${salePrice.value }`)//total = 9 salePrice = 4.5
product.quantity = 3
console.log(`total = ${total} salePrice = ${salePrice.value}`)//total = 13.5 salePrice = 4.5
product.price = 10
console.log(`total = ${total} salePrice = ${salePrice.value}`)//total = 27 salePrice = 9