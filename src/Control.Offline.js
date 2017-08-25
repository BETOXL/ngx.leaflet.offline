'use strict';

(function (factory, window) {

    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);
    } else if (typeof exports === 'object' && module.exports) {
        module.exports = factory(require('leaflet'));
    } else if (typeof window !== 'undefined') {
        if (typeof window.L === 'undefined') {
            throw 'Leaflet must be loaded first!';
        }
        factory(window.L);
    }
}(function (L) {

    /**
     * The Offline Control to be used together with the Offline Layer.
     */
    L.Control.Offline = L.Control.extend({
        options: {
            position: 'topleft',
            saveButtonHtml: 'S',
            saveButtonTitle: 'Save tiles',
            removeButtonHtml: 'R',
            removeButtonTitle: 'Remove tiles',
            minZoom: 0,
            maxZoom: 19,
            confirmSavingCallback: null,
            confirmRemovalCallback: null
        },

        /**
         * Constructor of the control.
         * 
         * @param {Object} baseLayer The Offline Layer to work together with the
         * control.
         * @param {Object} tilesDb An object that implements a certain interface
         * so it's able to serve as the database layer to save and remove the tiles.
         * @param {Object} options This is the same parameter as the Leaflet
         * Control, but it has some additions. Check the README for more.
         */
        initialize: function (baseLayer, tilesDb, options) {
            this._baseLayer = baseLayer;
            this._tilesDb = tilesDb;

            L.Util.setOptions(this, options);
        },

        /**
         * Creates the container DOM element for the control and add listeners
         * on relevant map events.
         * 
         * @param {Object} map The Leaflet map.
         * @returns {HTMLElement} The DOM element for the control.
         */
        onAdd: function (map) {
            var container = L.DomUtil.create('div', 'leaflet-control-offline leaflet-bar');

            this._createButton(this.options.saveButtonHtml, this.options.saveButtonTitle, 'save-tiles-button', container, this._saveTiles);
            this._createButton(this.options.removeButtonHtml, this.options.removeButtonTitle, 'remove-tiles-button', container, this._removeTiles);

            return container;
        },

        /**
         * Auxiliary method that creates a button DOM element.
         * 
         * @param {String} html The HTML that will be used inside the button
         * DOM element.
         * @param {String} title The title of the button DOM element.
         * @param {String} className The class name for the button DOM element.
         * @param {HTMLElement} container The container DOM element for the
         * buttons.
         * @param {Function} fn A function that will be executed when the button
         * is clicked.
         * @returns {HTMLElement} A button DOM element.
         */
        _createButton: function (html, title, className, container, fn) {
            var link = L.DomUtil.create('a', className, container);
            link.innerHTML = html;
            link.href = '#';
            link.title = title;

            L.DomEvent.disableClickPropagation(link);
            L.DomEvent.on(link, 'click', L.DomEvent.stop);
            L.DomEvent.on(link, 'click', fn, this);
            L.DomEvent.on(link, 'click', this._refocusOnMap, this);

            return link;
        },

        /**
         * The function executed when the button to save tiles is clicked.
         */
        _saveTiles: function () {
            var self = this;

            var bounds = null;
            var zoomLevels = [];
            var tileUrls = [];
            var currentZoom = this._map.getZoom();
            var latlngBounds = this._map.getBounds();

            if (currentZoom < this.options.minZoom) {
                self._baseLayer.fire('offline:below-min-zoom-error');

                return;
            }

            for (var zoom = currentZoom; zoom <= this.options.maxZoom; zoom++) {
                zoomLevels.push(zoom);
            }

            for (var i = 0; i < zoomLevels.length; i++) {
                bounds = L.bounds(this._map.project(latlngBounds.getNorthWest(), zoomLevels[i]),
                    this._map.project(latlngBounds.getSouthEast(), zoomLevels[i]));
                tileUrls = tileUrls.concat(this._baseLayer.getTileUrls(bounds, zoomLevels[i]));
            }

            var continueSaveTiles = function () {
                self._baseLayer.fire('offline:save-start', {
                    nTilesToSave: tileUrls.length
                });

                self._tilesDb.saveTiles(tileUrls).then(function () {
                    self._baseLayer.fire('offline:save-end');
                }).catch(function (err) {
                    self._baseLayer.fire('offline:save-error', {
                        error: err
                    });
                });
            };

            if (this.options.confirmSavingCallback) {
                this.options.confirmSavingCallback(tileUrls.length, continueSaveTiles);
            } else {
                continueSaveTiles();
            }
        },

        /**
         * The function executed when the button to remove tiles is clicked.
         */
        _removeTiles: function () {
            var self = this;

            var continueRemoveTiles = function () {
                self._baseLayer.fire('offline:remove-start');

                self._tilesDb.clear().then(function () {
                    self._baseLayer.fire('offline:remove-end');
                }).catch(function (err) {
                    self._baseLayer.fire('offline:remove-error', {
                        error: err
                    });
                });
            };

            if (self.options.confirmRemovalCallback) {
                self.options.confirmRemovalCallback(continueRemoveTiles);
            } else {
                continueRemoveTiles();
            }
        }
    });

    /**
     * Factory function as suggested by the Leaflet team.
     * 
     * @param {Object} baseLayer The Offline Layer to work together with the
     * control.
     * @param {Object} tilesDb An object that implements a certain interface
     * so it's able to serve as the database layer to save and remove the tiles.
     * @param {Object} options This is the same parameter as the Leaflet
     * Control, but it has some additions. Check the README for more.
     */
    L.control.offline = function (baseLayer, tilesDb, options) {
        return new L.Control.Offline(baseLayer, tilesDb, options);
    };
}, window));
