import View from "./view.js";
import Store from "./store.js";
import { emptyItemQuery } from "./item.js";

const _dueTime = (element) =>
  parseInt(element.dataset.due || element.parentNode.dataset.due, 10);

export default class Controller {
  /**
   * @param  {!Store} store A Store instance
   * @param  {!View} view A View instance
   */
  constructor(store, view) {
    this.store = store;
    this.view = view;

    this.view.bindToggleItemComplete(this.toggleItemCompleted.bind(this));
    this.view.bindAddNewTodo(this.addItem.bind(this));
    this.view.bindToggleTaskset(this.toggleTaskset.bind(this));
    this.view.bindToggleTopbar(this.toggleTopBar.bind(this));
    this.view.bindDeleteItem(this.deleteItem.bind(this));
    this.view.bindChangeItemTaskset(this.changeItemTaskset.bind(this));
    this.view.bindToggleTimebar(this.toggleItemHide.bind(this));
    this.view.bindDeleteAllComplete(this.deleteAllComplete.bind(this));
    this.view.bindToggleAllHide(this.toggleAllHide.bind(this));
    this.view.bindEditItem(this.editItem.bind(this));
    this.view.bindCompleteAll(this.completeAll.bind(this));

    this.curToggleState = "";
  }

  /**
   * 完成当前列表下的所有task
   */
  completeAll() {
    const state = this.curToggleState;
    this.store.find(
      {
        "": emptyItemQuery,
        total: emptyItemQuery,
        done: { completed: true },
        left: { completed: false },
      }[state],
      (todoList) => {
        let len = todoList.length;
        console.log("asdasdasdasd")
        todoList.forEach((todo) => {
          this.store.update(
            {
              id: todo.id,
              completed: true,
            },
            () => {
              if (--len === 0) {
                this._filter();
              }
            }
          );
        });
      }
    );
  }

  /**
   * 修改item
   * @param {number} id
   * @param {string} curText
   */
  editItem(id, curText) {
    this.view.editItem(curText, (newText) => {
      console.log(newText);
      this.store.update({ id, mes: newText }, () => {
        this.view.clearScroll();
        this._filter();
      });
    });
  }

  /**
   * 收起/展开所有item
   * @param {boolean} hide
   */
  toggleAllHide(hide) {
    event.preventDefault();
    this.view.changeHideBtn(hide);
    const state = this.curToggleState;
    this.store.find(
      {
        "": emptyItemQuery,
        total: emptyItemQuery,
        done: { completed: true },
        left: { completed: false },
      }[state],
      (todoList) => {
        const updateList = todoList.reduce((pre, cur) => {
          pre.push({
            id: cur.id,
            hide,
          });
          return pre;
        }, []);

        let samephore = updateList.length;
        updateList.forEach((cur) => {
          this.store.update(cur, () => {
            samephore--;
            if (samephore === 0) {
              this.view.clearScroll();
              this._filter();
            }
          });
        });
      }
    );
  }

  deleteAllComplete() {
    this.store.remove({ completed: true }, () => {
      this._filter();
    });
  }

  toggleItemHide(leftDay) {
    const state = this.curToggleState;
    this.store.find(
      {
        "": emptyItemQuery,
        total: emptyItemQuery,
        done: { completed: true },
        left: { completed: false },
      }[state],
      (todoList) => {
        const updateList = todoList.reduce((pre, cur) => {
          if (cur.due.LeftDay() === leftDay) {
            pre.push({
              id: cur.id,
              hide: !!!cur.hide,
            });
          }
          return pre;
        }, []);
        // console.log(updateList)
        let samephore = updateList.length;
        updateList.forEach((cur) => {
          this.store.update(cur, () => {
            samephore--;
            if (samephore === 0) {
              this.view.clearScroll();
              this._filter();
            }
          });
        });
      }
    );
  }

  init() {
    this.view.init();
    this.store.init(this.view.renderTaskset.bind(this.view));
    this._filter();
  }

  changeItemTaskset(id, tasksetId) {
    this.store.update({ id, tasksetId }, () => {
      this.view.clearScroll();
      this._filter();
    });
  }

  toggleTopBar(toggleId) {
    this.curToggleState = toggleId;
    this.view.clearScroll();
    this.view.toggleTopBar(toggleId);
    this._filter();
  }

  /**
   * 删除一条记录
   *
   * @param {!number} id
   */
  deleteItem(id) {
    this.store.remove({ id }, () => {
      // FIXME可以直接从view删除 不需要重新访存
      this._filter();
    });
  }

  toggleTaskset(id, active) {
    this.store.updateTaskset({ id, active }, () => {
      this.view.clearScroll();
      this.view.toggleTaskset(id);
      this._filter();
    });
  }

  /**
   * 插入一条新的todo
   *
   * @param {!string} mes todo的内容
   * @param {!number} tasksetId todo所属的taskset
   * @param {!Date} due todo的截止日期
   */
  addItem(mes, tasksetId, due) {
    if (!!!due) {
      due = new Date(Date.now() - Math.random() * 100100000);
    }
    this.store.insert(
      {
        id: Date.now(),
        mes,
        due,
        tasksetId,
        completed: false,
        hide: false,
      },
      () => {
        this.view.clearScroll();
        this.view.clearNewTodo();
        this._filter();
      }
    );
  }

  /**
   * 更新item的完成情况
   *
   * @param {!number} id
   * @param {!boolean} completed
   */
  toggleItemCompleted(id, completed) {
    this.store.update({ id, completed }, () => {
      this.view.clearScroll();
      this._filter();
    });
  }

  /**
   * 根据当前页面状态重新查找数据进行渲染
   * TODO 增量式渲染
   * @param {!boolean} 强制刷新
   */
  _filter(force) {
    const state = this.curToggleState;
    // if (
    //   force ||
    //   this._lastActiveRoute !== "" ||
    //   this._lastActiveRoute !== route
    // ) {
    this.store.find(
      {
        "": emptyItemQuery,
        total: emptyItemQuery,
        done: { completed: true },
        left: { completed: false },
      }[state],
      (res) => {
        this.view.renderItem.call(this.view, res);
      }
    );

    // 全局任务清单
    this.store.countTodo(this.view.setStatistic.bind(this.view));
    // 当前toggle下的任务集合数量
    this.store.countTaskset(
      {
        "": emptyItemQuery,
        total: emptyItemQuery,
        done: { completed: true },
        left: { completed: false },
      }[state],
      this.view.setTasksetStatistic.bind(this.view)
    );
  }
}
