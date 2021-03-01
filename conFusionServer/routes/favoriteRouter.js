const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const Favorites = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
    .get((req, res, next) => {
        Favorites.find({})
            .populate('user')
            .populate('dish')
            .then((Favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(Favorites);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(fav => {
                if (fav != null) {
                    req.body.map(x => fav.dish.push(x._id)); // add all from post
                    let uniq_dish = fav.dish.filter((x, i, a) => a.indexOf(x) == i) // get uniq
                    console.log(uniq_dish);
                    Favorites.findByIdAndUpdate(fav._id,
                        { $set: { user: req.user._id, dish: uniq_dish } }, { new: true })
                        .populate('user')
                        .populate('dish')
                        .then(fav => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(fav);

                        }, (err) => next(err))
                        .catch((err) => next(err))
                } else {
                    Favorites.create({ user: req.user._id, dish: req.body.map(x => x._id) })
                        .then(fav => {
                            Favorites.findById(fav._id)
                                .populate('user')
                                .populate('dish')
                                .then(fav => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(fav);
                                })
                        }, (err) => next(err))
                        .catch((err) => next(err))
                }
            })
    })
    .delete(authenticate.verifyUser, (req, res, next) => {
        Favorites.remove({ user: req.user._id })
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));
    });
favoriteRouter.route('/:dishId')
    .post(authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(fav => {
                if (fav != null) {
                    fav.dish.push(req.params.dishId)
                    fav.save()
                        .then(fav => {
                            Favorites.findById(fav._id)
                                .populate('user')
                                .populate('dish')
                                .then(fav => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(fav);
                                })
                        }, (err) => next(err))
                } else {
                    Favorites.create({ user: req.user._id, dish: [req.params.dishId] })
                        .then(fav => {
                            Favorites.findById(fav._id)
                                .populate('user')
                                .populate('dish')
                                .then(fav => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(fav);
                                })
                        }, (err) => next(err))
                        .catch((err) => next(err))
                }
            })
    })
    .delete(authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(fav => {
                fav.dish.pull(req.params.dishId);
                fav.save()
                    .then(fav => {
                        Favorites.findById(fav._id)
                            .populate('user')
                            .populate('dish')
                            .then(fav => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(fav);
                            })
                    }, (err) => next(err))
            })
    });
module.exports = favoriteRouter;