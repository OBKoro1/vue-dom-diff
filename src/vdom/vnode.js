// 虚拟节点公转方法
// 用对象描述节点 节省性能 真实的节点属性太多了
export  function vnode(type, key, props, children, text) {
    return {
      type,
      props,
      key,
      children,
      text,
    }
  }
  