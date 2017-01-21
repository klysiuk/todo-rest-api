# TODO REST API SAMPLE

This small pet project was developed by me as an attempt to master backend side.

It’s based on **MongoDB** and **Koa.js** framework. Has **REST architecture** and **error handling**. Also **token based authentication**.
There are still areas to improve - add extra checkings to make server work more error proof, develop more rich schemas.

## What it can do

Here is the list of available calls, extracted from code.

```
// user management
app.use(route.post('/user/signup', userManagement.signup));
app.use(route.post('/user/signin', userManagement.signin));

app.use(route.get('/todos',controllers.getTodosList));
app.use(route.post('/todos',controllers.addTodo));
app.use(route.put('/todos',controllers.unsupportedOperation({
	status: 400,
	text: 'Not possible to PUT the todo list. You can update todo by concrete id'
})));
app.use(route.delete('/todos',controllers.removeAllTodos));
app.use(route.get('/todos/:id', controllers.getTodo));
app.use(route.post('/todos/:id', controllers.unsupportedOperation({
	status: 400,
	text: 'Not possible to POST to existent todo. If you want to update it use PUT method'
})));
app.use(route.put('/todos/:id', controllers.updateTodo));
app.use(route.delete('/todos/:id',controllers.removeTodo));
app.use(route.get('/tags', controllers.getTags));
```

### Prerequisites

To work with this project you have to install mongoDB (see https://docs.mongodb.com).
If you don't want to use default parameters listed below, then modify dbConfig part in config.js with desired database parameters.

```
dbConfig: {
	host: "localhost",
	port: 27017,
	dbName: "todo"
}
```

### Installing

Then do typical commands

```
git clone https://github.com/klysiuk/todo-rest-api.git
npm install
```

### How to work with API

#### Run

Inside project 
```
node index.js
```
*I recommend to use POSTMAN app to work with API.*

*App works with json, so with every request there needs to have* **Content-Type: application/json** *header provided.*

#### Sign up

As this app has token based authentication, you have to signup first.

```
POST http://localhost:3000/user/signup
{"name”:”yourname”,”password”:”yourpassword”}
```

#### Sign in

Then it’s time to sign in with the same request body

```
POST http://localhost:3000/user/sigin
{"name”:”yourname”,”password”:”yourpassword”}
```

#### Create todo list

At last it’s time to create first todolist (do not forget about **X-Access-Token** and **Content-Type** headers )

```
POST http://localhost:3000/todos 

{
	"name": "shoppinglist",
	"description": "buy today!",
	"priority": "high",
	"category": "daily",
	"items": [
		{
			"name": "milk",
			"status": "new",
			"priority": "medium"
		}
	]
}
```

In response you will get **_id** of created todo list.
You can PUT,DELETE,GET this list by _id. (See [What it can do](https://github.com/klysiuk/todo-rest-api#what-it-can-do) section above)



