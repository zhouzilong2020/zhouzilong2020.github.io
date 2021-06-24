import { qs, $delegate, $on, $noMore } from "./helper.js";
import "./dateUtils.js";
import { TasksetList, TodoList } from "./item.js";

// toggle finish 的父节点为icon container,该节点的父节点有该list的id
const _itemId = (element) =>
  parseInt(
    element.dataset.id ||
      element.parentNode.dataset.id ||
      element.parentNode.parentNode.dataset.id ||
      element.parentNode.parentNode.parentNode.dataset.id,
    10
  );

// FIXME
const _toTasksetId = (element) =>
  element.parentNode.dataset.tasksetid || element.dataset.tasksetid;

const _active = (element) =>
  element.classList.contains("active") ||
  element.parentNode.classList.contains("active");

const _complete = (element) =>
  element.classList.contains("completed") ||
  element.parentNode.classList.contains("completed");

const _toggleId = (element) =>
  element.dataset.id ||
  element.parentNode.dataset.id ||
  element.parentNode.parentNode.dataset.id;

const _activeTasksetId = (eleList) => {
  let i = eleList.length;
  const result = [];
  while (i--) {
    if (eleList[i].classList.contains("active")) {
      result.push(eleList[i].dataset.id);
    }
  }
  return result;
};
const _clientX = (event) => event.changedTouches[0].clientX;
const _clientY = (event) => event.changedTouches[0].clientY;
const _screenH = (event) => event.view.outerHeight;
const _screenW = (event) => event.view.outerWidth;

const _hide = (element) =>
  element.classList.contains("hide") ||
  element.parentNode.classList.contains("hide");

const _text = (element) => {
  const pNode =
    element.parentNode.parentNode.querySelector("p") ||
    element.parentNode.parentNode.parentNode.querySelector("p");
  return pNode.innerText;
};

const rBtnExpandWidth = 120;
const lBtnExpandWidth = 180;

const deleteWidth = 250;

export default class View {
  /**
   * @param {!Template} template 模版生成
   */
  constructor(template) {
    this.template = template;

    this.$topToggle = qs(".top-bar .toggle");
    this.$leftCnt = qs(".top-bar .toggle .toggle-item .toggle-left");
    this.$doneCnt = qs(".top-bar .toggle .toggle-item .toggle-done");
    this.$totalCnt = qs(".top-bar .toggle .toggle-item .toggle-total");
    this.$inputBar = qs(".top-bar .input-bar");
    this.$input = qs(".top-bar .input-bar .text-input");
    this.$todoContainer = qs(".todo-container");
    this.$tasksetList = qs(".taskset-list");

    this.$functionBar = qs(".function-bar");

    // 判断当前是否已经添加了mask listener
    this.isMaskActive = false;
    this.$floatGadget = qs(".float-gadget");
    this.$mask = qs(".mask");

    this.$lastScrollCtx = null;
    this.$lastScrollBtnR = null;
    this.$lastScrollBtnL = null;
    this.startX = 0;
    this.startY = 0;

    // 记录是否第二次仍然滑动的是同一个方块，如果是，则需要额外逻辑判断
    this.isRepeteScroll = false;
    this.extraWidthForSecondScroll = 0;
  }

  // 初始化绑定操作
  init() {
    this.bindTouchStart((id, startX) => {
      if (!!this.$lastScrollCtx) {
        this.isRepeteScroll = id == this.$lastScrollCtx.dataset.id;
      } else {
        this.isRepeteScroll = false;
      }

      this.$lastScrollCtx = this.$todoContainer.querySelector(
        `[data-id="${id}"]`
      );
      this.$lastScrollBtnR = this.$todoContainer.querySelector(
        `[data-id="${id}"] .function-btn-group`
      );
      this.$lastScrollBtnL = this.$todoContainer.querySelector(
        `[data-id="${id}"] .change-task-btn-group`
      );
      // 清空transition，操作顺滑
      this.setTransition("");
      this.startX = startX;
    });

    this.bindTouchMove((movingX) => {
      let diffX = this.startX - movingX;
      // 第二次滑动同一个滑块，并且当前滑块状态为按钮展开了
      if (this.isRepeteScroll) {
        diffX += this.extraWidthForSecondScroll;
      }
      this.moveElement(diffX);
    });

    this.bindTouchEnd((endX) => {
      let diffX = this.startX - endX;
      // 第二次滑动同一个滑块，并且当前滑块状态为按钮展开了
      if (this.isRepeteScroll) {
        diffX += this.extraWidthForSecondScroll;
      }
      this.setContent(diffX);
    });

    this.bindToggleFloatGadget(this.toggleFloatGadget.bind(this));
    this.bindMaskClick(() => {
      if (this.$floatGadget.classList.contains("expand")) {
        this.collapseFloatGadget.call(this);
        this.setFloatPosition(
          this.startX,
          this.startY,
          _screenH(event),
          _screenW(event)
        );
      }
    });

    $on(this.$floatGadget, "touchstart", () => {
      this.$floatGadget.style.transition = "0s";
    });

    $on(this.$floatGadget, "touchmove", () => {
      event.preventDefault();
      const offset = -30;
      this.$floatGadget.style.left = _clientX(event) + offset + "px";
      this.$floatGadget.style.top = _clientY(event) + offset + "px";
    });

    $on(this.$floatGadget, "touchend", () => {
      const offset = -30;
      this.setFloatPosition(
        _clientX(event) + offset,
        _clientY(event) + offset,
        _screenH(event),
        _screenW(event)
      );
    });
  }

  setFloatPosition(curX, curY, screenH, screenW) {
    this.$floatGadget.style.transition = "0.4s";

    const offset = -30;
    const pos = {
      left: [0, curY],
      top: [curX, 0],
      bottom: [curX, screenH + 2 * offset],
      right: [screenW + 2 * offset, curY],
    };

    const diffX = Math.min(curX, screenW - curX);
    const diffY = Math.min(curY, screenH - curY);

    if (diffX < diffY) {
      if (curX / screenW < 0.5) {
        this.setPos(this.$floatGadget, pos["left"]);
      } else {
        this.setPos(this.$floatGadget, pos["right"]);
      }
    } else {
      if (curY / screenH > 0.5) {
        this.setPos(this.$floatGadget, pos["bottom"]);
      } else {
        this.setPos(this.$floatGadget, pos["top"]);
      }
    }

    setTimeout(() => {
      this.$floatGadget.style.transition = "0s";
    }, 400);
  }

  setPos(ele, pos) {
    ele.style.left = pos[0] + "px";
    ele.style.top = pos[1] + "px";
  }

  bindCompleteAll(handler) {
    $delegate(
      this.$floatGadget,
      [".btn-complete-all", ".btn-complete-all span"],
      "click",
      ({ target }) => {
        handler();
      },
      true
    );
  }

  changeHideBtn(hide) {
    const hideBtnIcon = this.$functionBar.querySelector(".hide-btn span");
    const hideBtn = this.$functionBar.querySelector(".hide-btn");
    if (!hide) {
      hideBtn.classList.remove("hide");
      hideBtnIcon.innerText = "expand_more";
    } else {
      hideBtn.classList.add("hide");
      hideBtnIcon.innerText = "expand_less";
    }
  }

  editItem(curText, handler) {
    const newText = prompt("please change your task here", curText);
    handler(newText);
  }

  bindToggleAllHide(handler) {
    $delegate(
      this.$functionBar,
      [".function-bar .hide-btn", ".function-bar .hide-btn span"],
      "click",
      ({ target }) => {
        // 与上一个状态取反
        handler(!_hide(target));
      },
      true
    );
  }

  bindDeleteAllComplete(handler) {
    $delegate(
      this.$floatGadget,
      [".btn-delete-all", ".btn-delete-all span"],
      "click",
      ({ target }) => {
        handler();
      },
      true
    );
  }

  /**
   * 设置全局blur效果
   * @param {string}} size
   */
  setMask(size) {
    this.$mask.style.filter = `blur(${size})`;
  }

  /**
   * mask 只能用于关掉float gadget
   */
  bindMaskClick(handler) {
    $on(this.$mask, "click", handler, true);
  }

  /**
   * 折叠float gadget
   */
  collapseFloatGadget() {
    if (this.$floatGadget.classList.contains("expand")) {
      this.$floatGadget.style.transition = "0.2s";
      this.setMask("0");
      this.$floatGadget.classList.remove("expand");
      setTimeout(() => {
        this.$floatGadget.style.transition = "0";
      }, 400);
    }
  }

  /**
   * 隐藏、现实float gadget
   */
  toggleFloatGadget() {
    const offset = -30;
    this.startX = event.clientX + offset;
    this.startY = event.clientY + offset;

    if (!this.$floatGadget.classList.contains("expand")) {
      this.setMask("2px");
      this.$floatGadget.style.transition = "0.4s";
      this.$floatGadget.style.top = "50%";
      this.$floatGadget.style.left = "50%";
      setTimeout(() => {
        this.$floatGadget.style.transition = "0.2s";
        this.$floatGadget.classList.add("expand");
        setTimeout(() => {
          this.$floatGadget.style.transition = "0s";
        }, 200);
      }, 400);
    } else {
      this.setMask("0");
      this.$floatGadget.classList.remove("expand");
    }
  }

  /**
   * 绑定toggle gadget 事件
   * @param {function}} handler
   */
  bindToggleFloatGadget(handler) {
    $on(this.$floatGadget, "click", handler, true);
  }

  /**
   * 绑定修改todo
   * @param {function} handler
   * @param {boolean} verbose
   */
  bindEditItem(handler, verbose) {
    $delegate(
      this.$todoContainer,
      [
        ".todo-item .function-btn-group .edit-btn",
        ".todo-item .function-btn-group .edit-btn span",
      ],
      "click",
      ({ target }) => {
        handler(_itemId(target), _text(target));
      },
      true,
      !!verbose
    );
  }

  /**
   * 绑定切换todo的任务集合
   * @param {function} handler
   * @param {boolean} verbose
   */
  bindChangeItemTaskset(handler, verbose) {
    $delegate(
      this.$todoContainer,
      [
        ".todo-item .change-task-btn-group div",
        ".todo-item .change-task-btn-group div span",
      ],
      "click",
      ({ target }) => {
        console.log(target);
        console.log(_toTasksetId(target));
        handler(_itemId(target), _toTasksetId(target));
      },
      true,
      !!verbose
    );
  }

  /**
   * 清空当前记录的滑动信息
   */
  clearScroll() {
    this.$lastScrollCtx = null;
  }

  /**
   * 为所有滑动元素添加transition
   * @param {string} sec
   */
  setTransition(sec) {
    this.$lastScrollBtnR.style.transition = sec;
    this.$lastScrollBtnL.style.transition = sec;
    this.$lastScrollCtx.style.transition = sec;
  }

  /**
   * 将元素滑动某一个距离
   * @param {number} diffX
   */
  moveElement(diffX) {
    const rBtnMoveX = Math.max(0, diffX);
    this.$lastScrollBtnR.style.right = `${-rBtnMoveX}px`;
    this.$lastScrollBtnR.style.width = `${rBtnMoveX}px`;

    // 指数衰减效果，如果已经达到了最大的右滑动距离，仍然可以向右滑动一小段距离
    let lBtnMoveX = Math.max(Math.min(0, diffX), -lBtnExpandWidth);
    if (diffX < -lBtnExpandWidth) {
      // 滑动衰减效果
      lBtnMoveX -= Math.log10(1 - diffX / lBtnExpandWidth) * 40;
    }
    this.$lastScrollBtnL.style.left = `${lBtnMoveX}px`;
    this.$lastScrollBtnL.style.width = `${-lBtnMoveX}px`;

    // 滑动方向，判断展开按钮的位置
    if (diffX > 0) {
      this.$lastScrollCtx.style.left = `${-diffX}px`;
    } else {
      this.$lastScrollCtx.style.left = `${-lBtnMoveX}px`;
    }

    const editBtn = this.$lastScrollBtnR.querySelector(".edit-btn");
    //达到右滑动删除临界点！
    if (rBtnMoveX >= deleteWidth) {
      editBtn.style.transition = "0.2s";
      setTimeout(() => {
        editBtn.style.width = "50px";
        editBtn.style.transition = "0";
      }, 20);
    } else {
      editBtn.style.width = "100%";
    }
  }

  /**
   * 滑动结束时，判断最终的滑动效果
   * @param {number} diffX
   */
  setContent(diffX) {
    this.setTransition("0.6s");

    const editBtn = this.$lastScrollBtnR.querySelector(".edit-btn");
    const deleteBtn = this.$lastScrollBtnR.querySelector(".delete-btn");

    //达到右滑动删除临界点！
    if (diffX < deleteWidth) {
      editBtn.style.width = "100%";
    }

    if (deleteWidth < diffX) {
      deleteBtn.click();
    } else if (rBtnExpandWidth * 0.618 <= diffX) {
      // 左滑动, 大于按钮的0.618时候认为全部展开
      this.extraWidthForSecondScroll = rBtnExpandWidth;
      diffX = rBtnExpandWidth;
    } else if (diffX <= -lBtnExpandWidth * 0.618) {
      // 右滑动，大于按钮的0.618时候认为全部展开
      this.extraWidthForSecondScroll = -lBtnExpandWidth;
      diffX = -lBtnExpandWidth;
    } else {
      this.extraWidthForSecondScroll = 0;
      diffX = 0;
    }
    this.moveElement(diffX);
  }

  /**
   * 绑定滑动开始事件
   * @param {function} handler
   * @param {boolean} verbose
   */
  bindTouchStart(handler, verbose) {
    $delegate(
      this.$todoContainer,
      [".todo-item", ".todo-item .finish-icon", ".todo-item p"],
      "touchstart",
      ({ target }) => {
        handler(_itemId(target), _clientX(event));
      },
      true,
      !!verbose
    );
  }

  /**
   * 绑定滑动进行事件
   * @param {function} handler
   * @param {boolean} verbose
   */
  bindTouchMove(handler, verbose) {
    $delegate(
      this.$todoContainer,
      [".todo-item", ".todo-item .finish-icon", ".todo-item p"],
      "touchmove",
      ({ target }) => {
        handler(_clientX(event));
      },
      true,
      !!verbose
    );
  }

  /**
   * 绑定滑动结束事件
   * @param {function} handler
   * @param {boolean} verbose
   */
  bindTouchEnd(handler, verbose) {
    $delegate(
      this.$todoContainer,
      [".todo-item", ".todo-item .finish-icon", ".todo-item p"],
      "touchend",
      ({ target }) => {
        handler(_clientX(event));
      },
      true,
      !!verbose
    );
  }

  /**
   * 绑定顶部toggle
   * @param {function} handler handle function
   * @param {!boolean} verbose 打印事件冒泡和捕获信息
   */
  bindToggleTopbar(handler, verbose) {
    $delegate(
      this.$topToggle,
      [".toggle-item", ".toggle-item span", ".toggle-item p"],
      "click",
      ({ target }) => {
        handler(_toggleId(target));
      },
      true,
      !!verbose
    );
  }

  /**
   * 绑定任务集toggle
   * @param {function} handler handle function
   * @param {!boolean} verbose 打印事件冒泡和捕获信息
   */
  bindToggleTaskset(handler, verbose) {
    $delegate(
      this.$tasksetList,
      [".taskset-item", ".taskset-item span", ".taskset-item p"],
      "click",
      ({ target }) => {
        // 当前状态取反为下一个状态
        handler(_itemId(target), !_active(target));
      },
      true,
      !!verbose
    );
  }

  /**
   * TODO 绑定新添加一个todo
   * @param {function} handler handle function
   * @param {!boolean} verbose 打印事件冒泡和捕获信息
   */
  bindAddNewTodo(handler, verbose) {
    const eventHandler = (event) => {
      if (event.code == "Enter") {
        const mes = this.$input.value;
        const curTaskset = _activeTasksetId(this.$tasksetList.children);

        if (
          curTaskset.length > 1 ||
          curTaskset.length <= 0 ||
          mes.length == 0
        ) {
          // 仅能有一个在这里！
          alert(
            "A task can only be added to one taskset, please toggle one taskset and try again!"
          );
          return;
        } else if (curTaskset.length === 1) {
          handler(mes, curTaskset[0]);
        }
      }
    };
    $on(this.$inputBar.querySelector("span"), "click", eventHandler, true);
    $on(this.$input, "keyup", eventHandler, true);
  }

  /**
   * 绑定toggle todo
   * @param {function} handler handle function
   * @param {!boolean} verbose 打印事件冒泡和捕获信息
   */
  bindToggleItemComplete(handler, verbose) {
    $delegate(
      this.$todoContainer,
      [
        ".todo-item",
        ".todo-item .finish-icon",
        // ".todo-item .finish-icon::after",
        ".todo-item p",
      ],
      "click",
      ({ target }) => {
        // 当前complete状态取反为下一个状态
        //console.log(_itemId(target));
        handler(_itemId(target), !_complete(target));
      },
      true,
      !!verbose
    );
  }

  /**
   * 绑定删除todo item
   * @param {function} handler
   * @param {boolean} verbose
   */
  bindDeleteItem(handler, verbose) {
    $delegate(
      this.$todoContainer,
      [
        ".todo-item .function-btn-group .delete-btn",
        ".todo-item .function-btn-group .delete-btn span",
      ],
      "click",
      ({ target }) => {
        // 当前complete状态取反为下一个状态
        handler(_itemId(target));
        //console.log("delete");
      },
      true,
      !!verbose
    );
  }
  /**
   * 绑定toggle 时间轴，隐藏或者展示中间的task
   * @param {function} handler handle function
   * @param {!boolean} verbose 打印事件冒泡和捕获信息
   */
  bindToggleTimebar(handler, verbose) {
    $delegate(
      this.$todoContainer,
      [".time-bar", ".time-bar span", ".time-bar div"],
      "click",
      ({ target }) => {
        handler(_itemId(target));
      },
      true,
      !!verbose
    );
  }

  /**
   * toggle顶部的筛选框
   *
   * @param {!number} id toggle-item ID
   */
  toggleTopBar(id) {
    const toggleList = this.$topToggle.children;
    let i = toggleList.length;
    while (i--) {
      if (toggleList[i].dataset.id == id) {
        if (!toggleList[i].classList.contains("active")) {
          toggleList[i].classList.add("active");
        }
      } else {
        if (toggleList[i].classList.contains("active")) {
          toggleList[i].classList.remove("active");
        }
      }
    }
  }

  /**
   * toggle任务集合是否被选中
   *
   * @param {!number} id Taskset ID
   */
  toggleTaskset(id) {
    const tasksetItem = this.$tasksetList.querySelector(`[data-id="${id}"]`);

    if (tasksetItem.classList.contains("active")) {
      tasksetItem.classList.remove("active");
    } else {
      tasksetItem.classList.add("active");
    }
  }

  /**
   * toggle task的完成状态
   *
   * @param {!number} id Item ID
   */
  toggleItemCompleted(id) {
    //console.log("view", id);
    const listItem = this.$todoContainer.querySelector(`[data-id="${id}"]`);
    //console.log(listItem);
    if (!listItem) {
      return;
    }
    if (listItem.classList.contains("completed")) {
      listItem.classList.remove("completed");
    } else {
      listItem.classList.add("completed");
    }
  }

  clearNewTodo() {
    this.$input.value = "";
  }

  /**
   * 根据传入的TodoList 渲染页面
   *
   * @param {TodoList} todoList
   */
  renderItem(todoList) {
    // TODO 增量式更新
    this.$todoContainer.innerHTML = "";
    // TODO 按照不同顺序排列
    // TODO 按照优先级排列
    // 排序规则
    //  1. due 少的优先
    //  2. 未完成优先
    //  3. 后添加的优先

    //  1. due 少的优先
    todoList.sort((a, b) => {
      return a.due.LeftDay() - b.due.LeftDay();
    });
    //  TODO 2.未完成的优先
    //  TODO 3. 后添加的优先

    todoList.reduce(
      (pre, cur) => {
        if (pre.due.getDate() !== cur.due.getDate()) {
          this.$todoContainer.innerHTML += this.template.TimeBar(
            cur.due,
            cur.completed
          );
        }
        this.$todoContainer.innerHTML += this.template.Todo(cur);
        return cur;
      },
      { due: new Date(0) }
    );
  }

  /**
   * 根据传入的TasksetList 渲染页面, 仅在首次渲染时候有效！
   *
   * @param {TasksetList} tasksetList
   */
  renderTaskset(tasksetList) {
    this.$tasksetList.innerHTML = "";
    tasksetList.reduce((pre, cur) => {
      this.$tasksetList.innerHTML += this.template.Taskset(cur);
    }, 0);
  }

  /**
   * 进行数据统计
   * @param {TodoList} todoList
   */
  setTasksetStatistic(cnt) {
    // 重置顶部数字
    const taskList = this.$tasksetList.children;
    let i = taskList.length;
    while (i--) {
      taskList[i].querySelector(".task-cnt").innerText = 0;
    }

    for (let k in cnt) {
      const $cnt = (this.$tasksetList.querySelector(
        `[data-id="${k}"] .task-cnt`
      ).innerText = cnt[k]);
    }
  }

  /**
   * 进行数据统计
   * @param {number} total
   * @param {number} left
   * @param {number} done
   */
  setStatistic(total, left, done) {
    this.$leftCnt.innerText = left;
    this.$doneCnt.innerText = done;
    this.$totalCnt.innerText = total;
  }
}
