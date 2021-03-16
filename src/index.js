import { h, render, patch } from './vdom'

// jsx 通过loader转化的结果就是如下 虚拟节点生成
const oldVnode = h(
  'div',
  {},
  h('li', { style: { background: 'red' }, key: 'A' }, 'A'),
  h('li', { style: { background: 'yellow' }, key: 'B' }, 'B'),
  h('li', { style: { background: 'blue' }, key: 'C' }, 'C'),
  h('li', { style: { background: 'green' }, key: 'D' }, 'D')
)

// render 将虚拟节点转为真实的dom节点 最后插入到元素中
const app = document.querySelector('#app')
render(oldVnode, app)

let newVnode = h(
  'div',
  { id: 'b' },
  h('li', { style: { background: 'green' }, key: 'G' }, 'G'),
  h('li', { style: { background: 'red' }, key: 'C' }, 'C1'),
  h('li', { style: { background: 'yellow' }, key: 'A' }, 'A'),
  h('li', { style: { background: 'blue' }, key: 'E' }, 'E'),
  h('li', { style: { background: 'blue' }, key: 'F' }, 'F'),
)

setTimeout(() => {
  // 虚拟dom不需要手动操作dom
  patch(oldVnode, newVnode)
}, 2000)

// 实现虚拟dom 是一个js对象 用来描述dom节点
// createElement h

/**
 *
 * <div id='wrapper' a="1">
 *   <span style="color: red">hello</span>
 *   zf
 * </div>
 *
 */

// 虚拟dom vnode
// {
//     type: 'div',
//     props: { id: 'wrapper', a: 1},
//     children: [
//         { type: 'span', props: { style: {color: 'red'} },children:[]},
//         { type: '', props: '', children: [], text: 'koro' }
//     ]
// }
