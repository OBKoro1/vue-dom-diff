import { vnode } from './vnode.js'

/**
 * @description 根据dom的属性 类型 孩子 产生一个虚拟dom
 * @param {string} type 类型
 * @param {object} props 节点属性
 * @param {array} children 所有孩子
 * @return {*}
 */
export default function createElement(type, props, ...children) {
  let key
  if (props.key) {
    key = props.key
    delete props.key
  }

  // 将所有元素都转为虚拟dom  方便统一操作
  children = children.map((child) => {
    if (typeof child === 'string') {
      return vnode(undefined, undefined, undefined, undefined, child)
    } else {
      return child
    }
  })

  return vnode(type, key, props, children)
}
