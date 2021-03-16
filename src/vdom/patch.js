/**
 * @description 将虚拟节点转为真实dom节点 并插入到元素中
 * @param {object} vnode 虚拟节点
 * @param {dom} container 真实dom: 要渲染到哪个容器中
 * @return {*}
 */
export function render(vnode, container) {
  const ele = createDomElementFromVnode(vnode)
  container.appendChild(ele)
}

// 通过虚拟的对象 创建一个真实的dom元素
function createDomElementFromVnode(vnode) {
  let { type, key, props, children, text } = vnode
  // 建立虚拟节点和真实元素的映射关系 后面可以用来更新真实dom
  if (type) {
    //   标签
    vnode.domElement = document.createElement(type)
    updateProperties(vnode)
    // 递归：将子节点转成真实节点 插入到父元素中
    children.forEach((childVnode) => render(childVnode, vnode.domElement))
  } else {
    // 文本
    vnode.domElement = document.createTextNode(text)
  }
  return vnode.domElement
}

// 根据新的虚拟节点的属性 和 老的虚拟节点的属性 去更新真实的dom元素
function updateProperties(newVnode, oldProps = {}) {
  let domElement = newVnode.domElement //真实的dom元素
  let newProps = newVnode.props //  虚拟节点中的属性

  // 如果老的里面有 新的里面没有 说明属性被移除了
  for (let oldPropName in oldProps) {
    if (!newProps[oldPropName]) {
      delete domElement[oldPropName]
    }
  }

  //   如果新的里面有style 老的里面也有style style有课鞥不一样 比如老的里面有background 新的里面没有
  let newStyleObj = newProps.style || {}
  let oldStyleObj = oldProps.style || {}
  for (let propName in oldStyleObj) {
    if (!newStyleObj[propName]) {
      domElement.style[propName] = '' // 老dom元素 旧style删除
    }
  }

  // 如果老的里面没有 新的里面有 说明新增
  for (let newPropsName in newProps) {
    //   css style需要特殊处理 还有比如说@click v-bind v-model v-html等 都需要处理一下
    if (newPropsName === 'style') {
      let styleObj = newProps.style
      for (let s in styleObj) {
        domElement.style[s] = styleObj[s]
      }
    } else {
      domElement[newPropsName] = newProps[newPropsName] // 用新节点的属性覆盖老节点的属性即可 也起到更新的作用
    }
  }
}

/**
 * 新老虚拟dom 比对和更新
 * 在子节点中是递归更新属性和节点的
 */
export function patch(oldVnode, newVnode) {
  // 类型不同
  if (oldVnode.type !== newVnode.type) {
    return oldVnode.domElement.parentNode.replaceChild(
      createDomElementFromVnode(newVnode),
      oldVnode.domElement
    )
  }
  // 类型相同 文本
  if (oldVnode.text) {
    if (oldVnode.text === newVnode.text) return // 文本相同 就不更新
    return (oldVnode.domElement.textContent = newVnode.text)
  }
  // 类型一样 并且是标签  根据新节点的属性 更新老节点的属性
  let domElement = (newVnode.domElement = oldVnode.domElement)
  // 更新属性
  updateProperties(newVnode, oldVnode.props)

  /**
   * 比较儿子
   * 1. 老的有儿子 新的有儿子
   * 2. 老的有儿子 新的没儿子
   * 3. 新增了儿子
   */
  let oldChildren = oldVnode.children
  let newChildren = newVnode.children

  if (oldChildren.length > 0 && newChildren.length > 0) {
    //   比对两个儿子
    updateChildren(domElement, oldChildren, newChildren)
  } else if (oldChildren.length > 0) {
    // 老的有儿子 新的没儿子 清空老儿子
    domElement.innerHTML = ''
  } else if (newChildren.length > 0) {
    // 新的有儿子 老的没儿子 添加儿子
    for (let i = 0; i < newChildren.length; i++) {
      domElement.appendChild(createDomElementFromVnode(newChildren[i]))
    }
  }
}

/**
 * diff算法会对常见的dom操作做优化
 * 1. 前后追加
 * 2. 正序和倒序
 */
// TODO: 这里才是diff的核心方法 diff算法
function updateChildren(parent, oldChildren, newChildren) {
  let oldStartIndex = 0
  let oldStartVnode = oldChildren[0]
  let oldEndIndex = oldChildren.length - 1
  let oldEndVnode = oldChildren[oldEndIndex]
  let map = createMapByKeyToIndex(oldChildren)

  let newStartIndex = 0
  let newStartVnode = newChildren[0]
  let newEndIndex = newChildren.length - 1
  let newEndVnode = newChildren[newEndIndex]

  /**
   * diff算法比较流程
   * 1. 新的vnode头和旧vnode头比较
   * 2. 新的vnode尾和旧vnode尾比较
   * 3. 新vnode头跟旧vnode尾比较
   * 4. 新vnode尾跟旧vnode头比较
   * 5. map映射暴力比对
   */

  // 判断老的孩子和新的孩子 谁先结束就停止循环
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (!oldStartVnode) {
      oldStartVnode = oldChildren[++oldStartIndex]
    } else if (!oldEndVnode) {
      oldEndVnode = oldChildren[--oldEndIndex]
    } else if (isSameVnode(oldStartVnode, newStartVnode)) {
      // 1. 新的vnode头和旧vnode头比较
      patch(oldStartVnode, newStartVnode) // 递归比对属性和子节点
      // 更新节点 当前比较的指针
      oldStartVnode = oldChildren[++oldStartIndex]
      newStartVnode = newChildren[++newStartIndex]
    } else if (isSameVnode(oldEndVnode, newEndVnode)) {
      // 2. 新的vnode尾和旧vnode尾比较
      patch(oldEndVnode, newEndVnode) // 递归比对属性和子节点
      oldEndVnode = oldChildren[--oldEndIndex]
      newEndVnode = newChildren[--newEndIndex]
    } else if (isSameVnode(oldStartVnode, newEndVnode)) {
      // 3. 新vnode头跟旧vnode尾比较
      patch(oldStartVnode, newEndVnode)
      // 不是都处于头或者尾 需要移动节点
      // 将老头移动到新的尾里面 因为是新节点是在尾部
      parent.insertBefore(
        oldStartVnode.domElement,
        oldEndVnode.domElement.nextSiblings
      )
      oldStartVnode = oldChildren[++oldStartIndex]
      newEndVnode = newChildren[--newEndVnode]
    } else if (isSameVnode(oldEndVnode, newStartVnode)) {
      // 4. 新vnode尾跟旧vnode头比较
      patch(oldEndVnode, newStartVnode)
      // 将旧的尾移到头部 排列 newChildren那样
      parent.insertBefore(oldEndVnode.domElement, oldStartVnode.domElement)
      oldEndVnode = oldChildren[--oldEndIndex]
      newStartVnode = newChildren[++newStartIndex]
    } else {
      // 5. map映射暴力比对
      // 通过新的节点的key去老的映射表中查找 如果存在就复用 不存在就创建插入
      let index = map[newStartVnode.key]
      if (index == null) {
        // 如果没有找到key 将新节点插入到老节点指针前面
        parent.insertBefore(
          createDomElementFromVnode(newStartVnode),
          oldStartVnode.domElement
        )
      } else {
        //   找到key 将老节点直接复用 移动到 老的开始的节点后面
        let toMoveVnode = oldChildren[index]
        patch(toMoveVnode, newStartVnode)
        parent.insertBefore(toMoveVnode.domElement, oldStartVnode.domElement)
        oldChildren[index] = undefined
      }
      // 更新新节点的指针
      newStartVnode = newChildren[++newStartIndex]
    }
  }
  // 新节点的开始指针只有小于或者等于新节点的结束指针 才说明有剩余 处理剩余情况
  if (newStartIndex <= newEndIndex) {
    //   还有新节点未添加
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      // 判断是添加到 开头还是末尾
      let before =
        newChildren[newEndIndex + 1] == null
          ? null // 下一个没有的话 就是添加到末尾
          : newChildren[newEndIndex + 1].domElement // 有下一个说明是添加到开头
      parent.insertBefore(createDomElementFromVnode(newChildren[i]), before)
    }
  }
  //   老的开始 和老的结束 中间还有节点 将其删掉
  if (oldStartIndex <= oldEndIndex) {
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      // 可能被暴力比对移动了 变成undefined
      if (oldChildren[i]) {
        parent.removeChild(oldChildren[i].domElement)
      }
    }
  }
}

// TODO：如果循环中使用索引当key 如果你删掉了第一个 实际上是把后面的全都更新属性和内容变为前面的第一个 删掉的是最后一个
// TODO: 比如你的 input checkbbox选中第一个 后面再元素添加到第一个 第一个元素会被选中 因为input没有更新 采取复用了

/**
 * @description oldVnode key的映射表 用于暴力比对
 * @param {Array} oldChildren oldVnode数组
 * @return {map} 映射表
 */
function createMapByKeyToIndex(oldChildren) {
  let map = {}
  for (let i = 0; i < oldChildren.length; i++) {
    let current = oldChildren[i]
    // 有key即存入 值为index 用于找到oldVnode
    if (current.key) {
      map[current.key] = i
    }
  }
  return map
}

/**
 * @description 判断两个节点是否为同一个节点
 * @param {*} oldVnode
 * @param {*} newVnode
 * @return {Boolean}
 */
function isSameVnode(oldVnode, newVnode) {
  return oldVnode.type === newVnode.type && oldVnode.key === newVnode.key
}
