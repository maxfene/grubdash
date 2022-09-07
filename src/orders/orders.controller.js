const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

    //Middleware Functions

//verifies order exists
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    
    if(foundOrder) {
        res.locals.order = foundOrder;
        next();
    };
    next({
        status: 404,
        message: `Dish not found ${orderId}`,
    });
}

//checks for necessary order properties; deliverTo, mobileNumber, and dishes are required; dishes must be an array with length greater than one; dish quantity has to be a number greater than zero.
function validateOrder(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    
    const requiredProps = ["deliverTo", "mobileNumber", "dishes"];
    for (const prop of requiredProps) {
        if (!req.body.data[prop]) {
            next({ status: 400, message: `A '${prop}' property is required.` });
        }
    }
    if (!Array.isArray(dishes)) {
      return res.status(400).json({ error: "dishes must be an array" });
    }
    if (dishes.length < 1) {
      return res.status(400).json({ error: "dishes must be greater than one" });
    }
    
    for (const index in dishes) {
        if (typeof dishes[index].quantity !== "number") {
          return res.status(400).json({
            error: `Dish ${index} must have a quantity`,
          });
        }
        if (dishes[index].quantity < 1) {
          return res.status(400).json({
            error: `Dish ${index} quantity must be greater than 0`,
          });
        }
    }
    
    next();
}

// checking new order for valid properties before update
function validateUpdate(req, res, next) {
    const { orderId } = req.params;
    const orderStatus = ['pending', 'preparing', 'out-for-delivery', 'delivered'];
    let newOrder = req.body.data;
    if(!newOrder.status || !orderStatus.includes(newOrder.status)) {
        return next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, or delivered`,
        });
    };
    if(!newOrder.id) newOrder.id = orderId;
    if(newOrder.id != orderId) {
        //throw error
        return next({
            status: 400,
            message: `Order id ${newOrder.id} does not match the route link!`
        });
    };
    next();
}


    //Router Functions
//lists all orders
function list (req, res, next) {
    res.json({ data: orders });
}

//creates new order
function create(req, res, next) {
    let newOrder = req.body.data;
    newOrder.id = nextId();
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

//returns a specific order
function read(req, res, next) {
    const { orderId } = req.params;
    res.json({ data: res.locals.order });
}

//updates an existing order
function update(req, res, next) {
    const { orderId } = req.params;
    let newOrder = req.body.data;
    if(!newOrder.id) newOrder.id = orderId;
    res.json({ data: newOrder });
}

//deletes an order if order status is pending
function remove(req, res, next) {
    if(res.locals.order.status !== 'pending') {
        return next({
            status: 400,
            message: `Order is no longer pending.`,
        });
    };
    const index = orders.indexOf(res.locals.order);
    orders.splice(index, 1);
    res.sendStatus(204).json({ data: res.locals.order });
}

module.exports = {
    read: [orderExists, read],
    update: [orderExists, validateOrder, validateUpdate, update],
    list,
    create: [validateOrder, create],
    delete: [orderExists, remove]
}