'use strict';

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./TileLayer.Offline', './Control.Offline'], factory);
    } else if (typeof exports === 'object' && module.exports) {
        module.exports = factory(require('./TileLayer.Offline'), require('./Control.Offline'));
    }
}(function (TileLayerOffline, ControlOffline) {
}));
