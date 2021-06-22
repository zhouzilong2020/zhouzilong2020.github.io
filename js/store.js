import {
  Todo,
  TodoList,
  TasksetUpdate,
  TasksetList,
  ItemQuery,
  ItemUpdate,
  emptyItemQuery,
} from "./item.js";

const _activeTodoList = (tasksetList) => {
  const todoList = [];
  let i = tasksetList.length;
  while (i--) {
    if (tasksetList[i].active) {
      todoList.push(...tasksetList[i].todoList);
    }
  }
  return todoList;
};

const _todoList = (tasksetList) => {
  const todoList = [];
  let i = tasksetList.length;
  while (i--) {
    todoList.push(...tasksetList[i].todoList);
  }
  return todoList;
};

export default class Store {
  /**
   * @param {!string} name localstorage的数据库的key
   * @param {function()} [callback] 回调函数
   */
  constructor(name, callback) {
    /**
     * @type {Storage}
     */
    const localStorage = window.localStorage;

    /**
     * 局部的一个缓存
     * @type {TasksetList}
     */
    let liveTestsetList;

    /**
     * 从localstorage中读取本地的TasksetList
     *
     * @returns {TasksetList} Current array of todos
     */
    this.getLocalStorage = () => {
      return liveTestsetList || JSON.parse(localStorage.getItem(name) || "[]");
    };

    /**
     * 写入本地storage中
     *
     * @param {TasksetList} testsetList 需要存储的tasksetList
     */
    this.setLocalStorage = (testsetList) => {
      localStorage.setItem(
        name,
        JSON.stringify((liveTestsetList = testsetList))
      );
    };
    if (callback) {
      callback();
    }
  }

  /**
   *  初始化localstorage
   * @param {function} callback
   */
  init(callback) {
    if (this.getLocalStorage().length === 0) {
      this.setLocalStorage([
        {
          id: 1,
          name: "Tranquil",
          active: true,
          todoList: [],
        },
        {
          id: 2,
          name: "Urgent",
          active: false,
          todoList: [],
        },
        {
          id: 3,
          name: "Oh NO",
          active: false,
          todoList: [],
        },
      ]);
    }
    if (callback) {
      callback(this.getLocalStorage());
    }
  }

  /**
   * 从数据库中找到符合query条件的 todo 数据，并作为回掉函数的入参
   * TODO 集合查询！
   * @param {ItemQuery} query query条件
   * @param {function(TodoList)} callback 回掉函数
   *
   * @example
   * db.find({completed: true}, data => {
   *	 // data shall contain items whose completed properties are true
   * })
   */
  find(query, callback) {
    const tasksetList = this.getLocalStorage();
    const todoList = _activeTodoList(tasksetList);
    let k;

    const result = todoList.filter((todo) => {
      // 如果传入的是emptyQuery，则不会进入for，默认筛选全部的todo
      for (k in query) {
        if (query[k] !== todo[k]) {
          return false;
        }
      }
      return true;
    });

    let i = result.length;
    while (i--) {
      result[i].due = new Date(result[i].due);
    }
    // 反序列化
    callback(result);
  }

  /**
   * 更新一条todo
   *
   * @param {ItemUpdate} update Record with an id and a property to update
   * @param {function()} [callback] Called when partialRecord is applied
   */
  update(update, callback) {
    // 是否已经被更新，当更新发生后就不需要再循环判断了
    let updated = false;
    const id = update.id;
    const tasksetList = this.getLocalStorage();
    let toBeUpdated = null;
    let i = tasksetList.length;
    let k;

    //console.log(update);

    while (i--) {
      const todoList = tasksetList[i].todoList;
      let j = todoList.length;
      while (j--) {
        //console.log(todoList[j].id, id);
        if (todoList[j].id === id) {
          // 记录需要更新的todo
          toBeUpdated = todoList[j];
          // 如果需要从原taskset删除，插入到新的taskset中
          if (update.hasOwnProperty("tasksetId")) {
            todoList.splice(j, 1);
          }
          // 更新字段
          for (k in update) {
            // //console.log("updated");
            toBeUpdated[k] = update[k];
          }
          updated = true;
          break;
        }
      }
      if (updated) {
        break;
      }
    }
    //console.log(toBeUpdated);

    // 将taskset跟新的todo插入到新任务集合中
    if (update.hasOwnProperty("tasksetId")) {
      i = tasksetList.length;
      while (i--) {
        if (tasksetList[i].id == toBeUpdated.tasksetId) {
          tasksetList[i].todoList.push(toBeUpdated);
          break;
        }
      }
    }

    this.setLocalStorage(tasksetList);

    if (callback) {
      callback();
    }
  }

  /**
   * 更新一条todo
   *
   * @param {TasksetUpdate} update Record with an id and a property to update
   * @param {function()} [callback] Called when partialRecord is applied
   */
  updateTaskset(update, callback) {
    const id = update.id;
    const tasksetList = this.getLocalStorage();
    let i = tasksetList.length;
    let k;
    while (i--) {
      if (tasksetList[i].id === id) {
        for (k in update) {
          tasksetList[i][k] = update[k];
        }
        break;
      }
    }
    this.setLocalStorage(tasksetList);
    if (callback) {
      callback();
    }
  }

  /**
   * 插入一条todo
   *
   * @param {Todo} todo Item to insert
   * @param {function()} [callback] Called when item is inserted
   */
  insert(todo, callback) {
    const tasksetList = this.getLocalStorage();
    let i = tasksetList.length;
    while (i--) {
      if (tasksetList[i].id == todo.tasksetId) {
        //console.log(tasksetList[i]);
        tasksetList[i].todoList.push(todo);
        //console.log(tasksetList[i]);
        break;
      }
    }
    this.setLocalStorage(tasksetList);
    if (callback) {
      callback();
    }
  }

  /**
   * 删除一个任务，这不一定是按照id，比如删除所有已完成
   *
   * @param {ItemQuery} query Query matching the items to remove
   * @param {function(TasksetList)|function()} [callback] Called when records matching query are removed
   */
  remove(query, callback) {
    const tasksetList = this.getLocalStorage();
    let i = tasksetList.length;
    let k;
    while (i--) {
      const todoList = tasksetList[i].todoList;
      let j = todoList.length;
      // 遍历当前任务集中的todolist
      while (j--) {
        //console.log(j);
        for (k in query) {
          //console.log(query[k], todoList[j][k]);
          if (query[k] === todoList[j][k]) {
            // 更新todoList
            todoList.splice(j, 1);
          }
        }
      }
    }
    this.setLocalStorage(tasksetList);

    if (callback) {
      callback(tasksetList);
    }
  }

  /**
   * 统计全局任务清单
   *
   * @param {function(number, number, number)} callback total, left, completed
   */
  countTodo(callback) {
    const allTodo = _todoList(this.getLocalStorage());
    const total = allTodo.length;
    let i = total;
    let completed = 0;
    while (i--) {
      completed += allTodo[i].completed;
    }
    //console.log(completed);
    callback(total, total - completed, completed);
  }

  /**
   * 为每一个task list统计符合条件的todo数量
   *
   * @param {ItemQuery} query query条件
   * @param {function(Object)} callback 回掉函数
   */
  countTaskset(query, callback) {
    const todoList = _todoList(this.getLocalStorage());
    let k;
    const cnt = {};
    const result = todoList.filter((todo) => {
      // 如果传入的是emptyQuery，则不会进入for，默认筛选全部的todo
      for (k in query) {
        if (query[k] !== todo[k]) {
          return false;
        }
      }
      return true;
    });
    // 统计todo各个任务数量
    result.forEach((todo) => {
      if (!cnt.hasOwnProperty(todo.tasksetId)) {
        cnt[todo.tasksetId] = 1;
      } else {
        cnt[todo.tasksetId]++;
      }
    });
    if (callback) {
      callback(cnt);
    }
  }
}
