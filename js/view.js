import { qs, $delegate, $on } from "./helper.js";
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

const _toTasksetId = (element) =>
  (element.classList[0] || element.parentNode.classList[0])[4];

const _active = (element) =>
  element.classList.contains("active") ||
  element.parentNode.classList.contains("active");

const _complete = (element) =>
  element.classList.contains("completed") ||
  element.parentNode.classList.contains("completed");

const _dueTime = (element) =>
  parseInt(element.dataset.due || element.parentNode.dataset.due, 10);

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



const rBtnExpandWidth = 80;
const lBtnExpandWidth = 180;

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

    this.$lastScrollCtx = null;
    this.$lastScrollBtnR = null;
    this.$lastScrollBtnL = null;
    this.startX = 0;

    // 记录是否第二次仍然滑动的是同一个方块，如果是，则需要额外逻辑判断
    this.isRepeteScroll = false;
    this.extraWidthForSecondScroll = 0;
  }

  // 初始化绑定操作
  init() {
    this.bindToggleTimebar((leftDay) => {
      const todoList = this.$todoContainer.querySelectorAll(".todo-item");
      const changeVisibilityIdList = [];
      for (var i = 0, len = todoList.length; i < len; i++) {
        var itemLeftDay = _dueTime(todoList[i]);
        if (leftDay === itemLeftDay) {
          // 将该item的display 设置为none
          changeVisibilityIdList.push(todoList[i]);
        }
      }
      this.setTodoItemVisibility(changeVisibilityIdList);
    });

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
        `[data-id="${id}"] .delete-btn`
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
        ".todo-item .change-task-btn-group",
        ".todo-item .change-task-btn-group div",
        ".todo-item .change-task-btn-group div span",
      ],
      "click",
      ({ target }) => {
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
    this.$lastScrollBtnR.firstElementChild.style.transition = sec;
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

    // 判断右边按钮是否需要进行展开
    if (rBtnMoveX >= 0.618 * rBtnExpandWidth) {
      this.$lastScrollBtnR.firstElementChild.setAttribute(
        "style",
        `font-size:24px;opacity:1 `
      );
    } else {
      this.$lastScrollBtnR.firstElementChild.setAttribute(
        "style",
        `font-size:0px;opacity:0 `
      );
    }
  }

  /**
   * 滑动结束时，判断最终的滑动效果
   * @param {number} diffX
   */
  setContent(diffX) {
    this.setTransition("0.6s");
    if (rBtnExpandWidth * 4 < diffX) {
      this.$lastScrollBtnR.click();
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
      [".todo-item .delete-btn", ".todo-item .delete-btn span"],
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
        console.log(target);
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
   * 将剩余日期等于这个数值的全部隐藏
   *
   * @param {HTMLElement} eleList
   */
  setTodoItemVisibility(eleList) {
    let i = eleList.length;
    while (i--) {
      if (eleList[i].classList.contains("hide")) {
        eleList[i].classList.remove("hide");
      } else {
        eleList[i].classList.add("hide");
      }
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

    todoList.sort((a, b) => {
      return a.due.LeftDay() - b.due.LeftDay();
    });

    todoList.reduce(
      (pre, cur) => {
        if (pre.due.getDate() !== cur.due.getDate()) {
          this.$todoContainer.innerHTML += this.template.TimeBar(cur.due);
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