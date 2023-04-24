const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const { format, isValid, parse } = require("date-fns");
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");

const initializeDBServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => console.log("server Started"));
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDBServer();
// Converted to expected OUtput
const convertToOutput = (data) => {
  return {
    id: data.id,
    todo: data.todo,
    priority: data.priority,
    status: data.status,
    category: data.category,
    dueDate: data.due_date,
  };
};

// middleware logger function

const logger = (request, response, next) => {
  const { todo, priority, status, category, dueDate } = request.body;
  console.log(request.body);
  const validDate = parse(dueDate, "yyyy-MM-dd", new Date());
  const is_valid = isValid(validDate);

  if (
    priority !== undefined &&
    status !== undefined &&
    category !== undefined &&
    dueDate !== undefined
  ) {
    if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
      response.status(400).send("Invalid Todo Status");
    } else if (
      priority !== "HIGH" &&
      priority !== "LOW" &&
      priority !== "MEDIUM"
    ) {
      response.status(400).send("Invalid Todo Priority");
    } else if (
      category !== "HOME" &&
      category !== "WORK" &&
      category !== "LEARNING"
    ) {
      response.status(400).send("Invalid Todo Category");
    } else if (is_valid === false) {
      response.status(400).send("Invalid Due Date");
    } else {
      next();
    }
  }
};
// logger2 funtion
const logger2 = (request, response, next) => {
  const { todo, priority, status, category, dueDate } = request.body;
  console.log(request.body);
  const validDate = parse(dueDate, "yyyy-MM-dd", new Date());
  const is_valid = isValid(validDate);

  if (status !== undefined) {
    if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
      response.status(400).send("Invalid Todo Status");
    } else {
      next();
    }
  } else if (priority !== undefined) {
    if (priority !== "HIGH" && priority !== "LOW" && priority !== "MEDIUM") {
      response.status(400).send("Invalid Todo Priority");
    } else {
      next();
    }
  } else if (category !== undefined) {
    if (category !== "HOME" && category !== "WORK" && category !== "LEARNING") {
      response.status(400).send("Invalid Todo Category");
    } else {
      next();
    }
  } else if (dueDate !== undefined) {
    if (is_valid === true) {
      next();
    } else {
      response.status(400).send("Invalid Due Date");
    }
  } else {
    next();
  }
};

// get Todo Details

app.get("/todos/", async (request, response) => {
  const {
    priority,
    status,
    category,
    due_date,
    todo,
    search_q = "",
  } = request.query;
  if (status !== undefined && priority !== undefined) {
    const selectQuery = `select * from todo
    where status='${status}'
    and 
    priority = '${priority}';`;
    const todoArray = await db.all(selectQuery);
    response.status(200).send(todoArray.map((obj) => convertToOutput(obj)));
  } else if (category !== undefined && status !== undefined) {
    const selectQuery = `select * from todo
    where category='${category}'
    and 
    status = '${status}';`;
    const todoArray = await db.all(selectQuery);
    response.status(200).send(todoArray.map((obj) => convertToOutput(obj)));
  } else if (category !== undefined && priority !== undefined) {
    const selectQuery = `select * from todo
    where category='${category}'
    and 
    priority = '${priority}';`;
    const todoArray = await db.all(selectQuery);
    response.status(200).send(todoArray.map((obj) => convertToOutput(obj)));
  } else if (priority !== undefined) {
    if (priority === "HIGH" || priority === "LOW" || priority == "MEDIUM") {
      const selectQuery = `select * from todo
                        where 
                priority = '${priority}';`;
      const todoArray = await db.all(selectQuery);
      response.status(200).send(todoArray.map((obj) => convertToOutput(obj)));
    } else {
      response.status(400).send("Invalid Todo Priority");
    }
  } else if (status !== undefined) {
    if (status === "IN PROGRESS" || status === "TO DO" || status === "DONE") {
      const selectQuery = `select * from todo
    where 
    status = '${status}';`;
      const todoArray = await db.all(selectQuery);
      response.status(200).send(todoArray.map((obj) => convertToOutput(obj)));
    } else {
      response.status(400).send("Invalid Todo Status");
    }
  } else if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      const selectQuery = `select * from todo
    where 
    category = '${category}';`;
      const todoArray = await db.all(selectQuery);
      response.status(200).send(todoArray.map((obj) => convertToOutput(obj)));
    } else {
      response.status(400).send("Invalid Todo Category");
    }
  } else {
    const selectQuery = `select * from todo
    where 
    todo like '%${search_q}%';`;
    const todoArray = await db.all(selectQuery);
    response.status(200).send(todoArray.map((obj) => convertToOutput(obj)));
  }
});

//Fetch todo based on TOdo ID
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoDetail = `select * from todo
    where id = ${todoId};`;
  const detail = await db.get(getTodoDetail);
  console.log(detail);
  // response.send(detail);
  response.status(200).send({
    id: detail.id,
    todo: detail.todo,
    priority: detail.priority,
    status: detail.status,
    category: detail.category,
    dueDate: detail.due_date,
  });
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  const validDate = parse(date, "yyyy-MM-dd", new Date());
  const is_valid = isValid(validDate);
  // console.log(is_valid);
  if (is_valid === true) {
    const d = format(new Date(date), "yyyy-MM-dd");
    const selectQuery = `select * from todo where
  due_date = '${d}';`;
    const detail = await db.all(selectQuery);
    response.send(detail.map((obj) => convertToOutput(obj)));
  } else {
    response.status(400).send("Invalid Due Date");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `delete from todo where id =${todoId};`;
  await db.run(deleteTodo);
  response.status(200).send("Todo Deleted");
});

app.post("/todos", logger, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  console.log(request.body);
  const insertTodo = `insert into todo
  (id, todo,priority, status, category, due_date)values
  (${id},'${todo}', '${priority}', '${status}', "${category}", '${dueDate}');`;
  await db.run(insertTodo);
  response.send("Todo Successfully Added");
});

//Update API
app.put("/todos/:todoId", logger2, async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, category, status, dueDate } = request.body;
  if (todo !== undefined) {
    output = "Todo";
  } else if (priority !== undefined) {
    output = "Priority";
  } else if (status !== undefined) {
    output = "Status";
  } else if (dueDate !== undefined) {
    output = "Due Date";
  } else if (category !== undefined) {
    output = "Category";
  }
  const updateTodo = `update todo
    set
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}',
    category = '${category}',
    due_date = '${dueDate}'
    where id = ${todoId};`;
  await db.run(updateTodo);
  response.send(`${output} Updated`);
});

module.exports = app;
