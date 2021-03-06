import "./item.js";
export default class Template {
  /**
   * add a new day bar to the list
   * @param {Date} dueDay
   * @param {boolean} completed
   * @returns
   */
  TimeBar(dueDay, completed) {
    const leftDay = dueDay.LeftDay();
    return `<div class="time-bar ${
      leftDay <= 0 && !!!completed ? "over-due" : " "
    }"  data-id="${leftDay}" class="">
          <span class="date">${dueDay.Format(
            "yyyy/MM/dd"
          )} ${dueDay.GetDay()}</span>
          <div class="left-day-cnt">
            <span class="num">${leftDay}</span>
            <span class="text">d left</span>
          </div>
        </div>`;
  }

  /**
   * add a new to do task to the list
   * @param {Taskset} taskset
   * @returns
   */
  Taskset(taskset) {
    return `<div data-id="${taskset.id}" class="taskset-item${
      taskset.active ? " active" : ""
    }">
    <span class="material-icons top-icon">class</span>
    <p class="taskset-name">${taskset.name}</p>
    <p class="task-cnt">${taskset.leftCnt}</p>
    <span class="icon">tasks</span>
  </div>`;
  }

  /**
   * add a new day bar to the list
   * @param {Todo} Todo
   * @returns
   */
  Todo(todo) {
    return `<div data-id="${todo.id}"  data-due="${todo.due.LeftDay()}"  
    class="todo-item ${
      (!!todo.completed ? " completed" : "") + (!!todo.hide ? " hide" : "")
    }">
  <div class="icon-container ${
    "taskset-" + todo.tasksetId
  }"><div class="finish-icon"></div></div>
  <p>${todo.mes}</p>
  <div class="function-btn-group btn-group">
    <div class="edit-btn btn">
      <span class="material-icons" >edit</span>
    </div>
    <div class="delete-btn btn">
        <span class="material-icons" >delete</span>
    </div>
  </div>
  <div class="change-task-btn-group btn-group">
    <div data-tasksetId="1" class=" btn btn-1">
      <span class="material-icons" style="opacity: 1; transition: 0.2s">sentiment_very_satisfied</span>
    </div>
    <div  data-tasksetId="2" class="btn btn-2">
      <span  class="material-icons" style="opacity: 1; transition: 0.2s">sentiment_satisfied</span>
    </div>
    <div data-tasksetId="3" class="btn btn-3">
      <span  class="material-icons" style="opacity: 1; transition: 0.2s">sentiment_very_dissatisfied</span>
    </div>
  </div>
  
</div>`;
  }
}
