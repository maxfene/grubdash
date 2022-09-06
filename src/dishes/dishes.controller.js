const e = require("express");
const { response } = require("express");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
//Middleware Functions
function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const {data = {}} = req.body;
        if (data[propertyName]) {
            return next();
        }
        next ({status:400, message: `Must include a ${propertyName}`})
    }
}

function dishExists(req, res, next){
    const {dishId} = req.params;
    const foundDish = dishes.find(dish=> dishId === dish.id);

    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish id not found: ${dishId}`
    })
}

function validatePrice(req, res, next) {
    const {price} = req.body.data;
    if (typeof price === "number" && price > 0) {
        return next();
    } else {
        return next({
            status: 400,
            message: `invalid price: ${price}`
        })
    }
}


//Router functions "/"
function list (req, res, next) {
    res.json({data : dishes})
}

function create(req, res, next) {
    const { data: { name, description, price, image_url} = {} } = req.body;
    const newDish = {
        id: nextId(),
        name: name,
        description: description,
        price: price,
        image_url: image_url,
    }
    if (Number(newDish.price) > 0) {
    dishes.push(newDish);
    res.status(201).json({ data: newDish })
    } else {
        next({status: 400, message: "Invalid price"})
    }
}

//router functions "/:dishId"
function read (req, res, next) {
    res.json({data: res.locals.dish});
}

function update(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  if (id === dishId || typeof id === "undefined" || !id) {
  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;
  res.json({data: foundDish});
  } else {
    return next({status: 400, message: `Invalid Id: ${id}`})
  }
//   if (!isNaN(Number(price)) && Number(price) > 0) {
//   } else {
//     return next({status: 400, message: "Invalid price"})
//   }
}

module.exports = {
update: [ dishExists, bodyDataHas("name"), bodyDataHas("description"), bodyDataHas("price"), bodyDataHas("image_url"), validatePrice, update],
read: [dishExists, read],
create: [ bodyDataHas("name"), bodyDataHas("description"), bodyDataHas("price"), bodyDataHas("image_url"), create],
list,
}