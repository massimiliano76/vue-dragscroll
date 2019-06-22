import u from './utils'

const POINTER_START_EVENTS = ['mousedown', 'touchstart']
const POINTER_MOVE_EVENTS = ['mousemove', 'touchmove']
const POINTER_END_EVENTS = ['mouseup', 'touchend']

let init = function (el, binding, vnode) {
  // Default parameters
  let target = el // the element to apply the dragscroll on
  let active = true // enable/disable dragscroll

  // config type: boolean
  // Example: v-dragscroll="true" or v-dragscroll="false"
  if (typeof binding.value === 'boolean') {
    active = binding.value
  } else if (typeof binding.value === 'object') {
    // config type: object
    // Example: v-dragscroll="{ active: true , target: "child" }"

    // parameter: target
    if (typeof binding.value.target === 'string') {
      target = el.querySelector(binding.value.target)
      if (!target) {
        console.error('There is no element with the current target value.')
      }
    } else if (typeof binding.value.target !== 'undefined') {
      console.error('The parameter "target" should be be either \'undefined\' or \'string\'.')
    }

    // parameter: active
    if (typeof binding.value.active === 'boolean') {
      active = binding.value.active
    } else if (typeof binding.value.active !== 'undefined') {
      console.error('The parameter "active" value should be either \'undefined\', \'true\' or \'false\'.')
    }
  } else if (typeof binding.value !== 'undefined') {
    // Throw an error if invalid parameters
    console.error('The passed value should be either \'undefined\', \'true\' or \'false\' or \'object\'.')
  }
  var reset = function () {
    let lastClientX, lastClientY, pushed
    let isDragging = false
    let isClick = false // workaround to handle click event from touch

    target.md = function (e) {
      e.preventDefault()
      let isMouseEvent = e instanceof window.MouseEvent
      // The coordinates of the mouse pointer compared to the page when the mouse button is clicked on an element
      let pageX = isMouseEvent ? e.pageX : e.touches[0].pageX
      let pageY = isMouseEvent ? e.pageY : e.touches[0].pageY
      let clickedElement = document.elementFromPoint(pageX - window.pageXOffset, pageY - window.pageYOffset)

      let hasNoChildDrag = binding.arg === 'nochilddrag'
      let hasFirstChildDrag = binding.arg === 'firstchilddrag'
      let isEl = clickedElement === target
      let isFirstChild = clickedElement === target.firstChild
      let isDataDraggable = hasNoChildDrag ? typeof clickedElement.dataset.dragscroll !== 'undefined' : typeof clickedElement.dataset.noDragscroll === 'undefined'

      if (!isEl && (!isDataDraggable || (hasFirstChildDrag && !isFirstChild))) {
        return
      }

      pushed = 1
      // The coordinates of the mouse pointer compared to the viewport when the mouse button is clicked on an element
      lastClientX = isMouseEvent ? e.clientX : e.touches[0].clientX
      lastClientY = isMouseEvent ? e.clientY : e.touches[0].clientY
      if (e.type === 'touchstart') {
        isClick = true
      }
    }

    target.mu = function (e) {
      pushed = 0
      if (isDragging) {
        u.emitEvent(vnode, 'dragscrollend')
      }
      isDragging = false
      if (e.type === 'touchend' && isClick === true) {
        // this workaround enable click will using touch
        e.target.click()
        isClick = false
      } else {
        e.target.focus()
      }
    }

    target.mm = function (e) {
      let isMouseEvent = e instanceof window.MouseEvent
      let newScrollX, newScrollY
      let eventDetail = {}
      if (pushed) {
        // pushed
        // Emit start event
        if (!isDragging) {
          u.emitEvent(vnode, 'dragscrollstart')
        }
        isDragging = true

        // when we reach the end or the begining of X or Y
        let isEndX = ((target.scrollLeft + target.clientWidth) >= target.scrollWidth) || target.scrollLeft === 0
        let isEndY = ((target.scrollTop + target.clientHeight) >= target.scrollHeight) || target.scrollTop === 0

        // get new scroll dimentions
        newScrollX = (-lastClientX + (lastClientX = isMouseEvent ? e.clientX : e.touches[0].clientX))
        newScrollY = (-lastClientY + (lastClientY = isMouseEvent ? e.clientY : e.touches[0].clientY))

        if (binding.modifiers.pass) {
          // compute and scroll
          target.scrollLeft -= binding.modifiers.y ? -0 : newScrollX
          target.scrollTop -= binding.modifiers.x ? -0 : newScrollY
          if (target === document.body) {
            target.scrollLeft -= binding.modifiers.y ? -0 : newScrollX
            target.scrollTop -= binding.modifiers.x ? -0 : newScrollY
          }

          // if one side reach the end scroll window
          if (isEndX || binding.modifiers.y) {
            window.scrollBy(-newScrollX, 0)
          }
          if (isEndY || binding.modifiers.x) {
            window.scrollBy(0, -newScrollY)
          }
        } else {
          // disable one scroll direction in case x or y is specified
          if (binding.modifiers.x) newScrollY = -0
          if (binding.modifiers.y) newScrollX = -0

          // compute and scroll
          target.scrollLeft -= newScrollX
          target.scrollTop -= newScrollY
          if (target === document.body) {
            target.scrollLeft -= newScrollX
            target.scrollTop -= newScrollY
          }
        }

        // // disable one scroll direction in case x or y is specified
        // if (binding.modifiers.x) newScrollY = -0
        // if (binding.modifiers.y) newScrollX = -0

        // // compute and scroll
        // el.scrollLeft -= newScrollX
        // el.scrollTop -= newScrollY
        // if (el === document.body) {
        //   el.scrollLeft -= newScrollX
        //   el.scrollTop -= newScrollY
        // }

        // // pass scroll when max reached
        // if (binding.modifiers.pass) {
        //   // if one side reach the end scroll window
        //   if (isEndX) {
        //     window.scrollBy(-newScrollX, 0)
        //   }
        //   if (isEndY) {
        //     window.scrollBy(0, -newScrollY)
        //   }
        // }

        // Emit events
        eventDetail.deltaX = -newScrollX
        eventDetail.deltaY = -newScrollY
        u.emitEvent(vnode, 'dragscrollmove', eventDetail)
      }
    }

    u.addEventListeners(target, POINTER_START_EVENTS, target.md)

    u.addEventListeners(window, POINTER_END_EVENTS, target.mu)

    u.addEventListeners(window, POINTER_MOVE_EVENTS, target.mm)
  }
  // if value is undefined or true we will init
  if (active) {
    if (document.readyState === 'complete') {
      reset()
    } else {
      window.addEventListener('load', reset)
    }
  } else {
    // if value is false means we disable
    // window.removeEventListener('load', reset)
    u.removeEventListeners(target, POINTER_START_EVENTS, target.md)
    u.removeEventListeners(window, POINTER_END_EVENTS, target.mu)
    u.removeEventListeners(window, POINTER_MOVE_EVENTS, target.mm)
  }
}

export default {
  bind: function (el, binding, vnode) {
    init(el, binding, vnode)
  },
  update: function (el, binding, vnode, oldVnode) {
    // update the component only if the parameters change
    if (JSON.stringify(binding.value) !== JSON.stringify(binding.oldValue)) {
      init(el, binding, vnode)
    }
  },
  unbind: function (el, binding, vnode) {
    let target = el
    u.removeEventListeners(target, POINTER_START_EVENTS, target.md)
    u.removeEventListeners(window, POINTER_END_EVENTS, target.mu)
    u.removeEventListeners(window, POINTER_MOVE_EVENTS, target.mm)
  }
}
