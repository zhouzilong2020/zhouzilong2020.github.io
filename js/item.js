/**
 * @typedef {!{id: number, completed: boolean, mes: string, due: Date,hide:boolean, tasksetId:number}}
 */
export var Todo;

/**
 * @typedef {!{id: number,  name: string, active: number, todoList:TodoList}}
 */
export var Taskset;

/**
 * @typedef {!Array<Todo>}
 */
export var TodoList;

/**
 * @typedef {!Array<Taskset>}
 */
export var TasksetList;

/**
 * Enum containing a known-empty record type, matching only empty records unlike Object.
 *
 * @enum {Object}
 */
const Empty = {
  Record: {},
};

/**
 * Empty ItemQuery type, based on the Empty @enum.
 *
 * @typedef {Empty}
 */
export var EmptyItemQuery;

/**
 * Reference to the only EmptyItemQuery instance.
 *
 * @type {EmptyItemQuery}
 */
export const emptyItemQuery = Empty.Record;

/**
 * @typedef {!({id: number}|{completed: boolean}|{hide: boolean}|{tasksetId: number}|EmptyItemQuery)}
 */
export var ItemQuery;

/**
 * @typedef {!({id: number, mes: string}|{id: number, completed: boolean}|{id: number, hide: boolean}|{id: number, task: boolean})}
 */
export var ItemUpdate;

/**
 * @typedef {!({id: number, active: boolean})}
 */
export var TasksetUpdate;
