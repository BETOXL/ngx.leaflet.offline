# ngx.leaflet.offline [![License: GPLv2](https://img.shields.io/badge/License-GPLv2-blue.svg)](https://opensource.org/licenses/GPL-2.0) [![npm version](https://badge.fury.io/js/ngx.leaflet.offline.svg)](https://badge.fury.io/js/ngx.leaflet.offline)
A Leaflet library that downloads map tiles and uses them offline.
Check out the demo at https://betoxl.github.io/ngx.leaflet.offline/index.html .

Example: https://github.com/BETOXL/offlinemap-angular-example

## Inspiration
This library was heavily inspired and based on the [leaflet.offline](https://github.com/allartk/leaflet.offline) library by Allart Kooiman.
I decided to create a new one because the ideas I had were diverging too much from what ```leaflet.offline``` proposes to do.

The biggest change I made was removing the dependency on [localForage](https://github.com/localForage/localForage) and introducing a new parameter that makes you able to give your own implementantion of a database layer to save, retrieve and delete the map tiles however you like as long as it implements the same interface (more on that below).

## Dependencies
- [Leaflet](https://github.com/Leaflet/Leaflet) (v1.1.0)

## Install

If you use ```npm```, you can install ```ngx.leaflet.offline``` by running:
```npm install ngx.leaflet.offline```

If you don't use a package manager, simply download a file from the ```dist/``` folder and include it in your application.

## Guide

### Database Layer

When creating both the ```OfflineControl``` and the ```OfflineLayer```, you need to pass an object that will act as the database layer when saving, retrieving and deleting map tiles.
The object **must** implement the following interface.

| Method      | Parameters      | Returns                                                                                       |
| ----------- | --------------- | --------------------------------------------------------------------------------------------- |
| 'getItem'   | key: String     | Promise. The result of the promise must be a Blob, File or MediaStream representing the image |
| 'saveTiles' | tileUrls: Array | Promise. The result is ignored                                                                |
| 'clear'     | None            | Promise. The result is ignored                                                                |

### Layer API

When creating the ```OfflineLayer```, you need to pass the URL from where the map tiles will be retrieved, the database layer object and the options parameter.
There are no special options for the ```OfflineLayer```, they are the same as the [TileLayer options](http://leafletjs.com/reference-1.2.0.html#tilelayer-option) from Leaflet.

### Control API

When creating the ```OfflineControl```, you need to pass the ```OfflineLayer```, the database layer object and the options parameter.
The options parameter is defined as follows:

| Option                   | Type     | Default        | Description                                                                        |
| ------------------------ | -------- | -------------- | ---------------------------------------------------------------------------------- |
| 'position'               | String   | 'topleft'      | [Control options](http://leafletjs.com/reference-1.2.0.html#control-position)      |
| 'saveButtonHtml'         | String   | 'S'            | The HTML that will be displayed as the save button                                 |
| 'saveButtonTitle'        | String   | 'Save tiles'   | The title that will be used for the save button                                    |
| 'removeButtonHtml'       | String   | 'R'            | The HTML that will be displayed as the remove button                               |
| 'removeButtonTitle'      | String   | 'Remove tiles' | The title that will be used for the remove button                                  |
| 'minZoom'                | Number   | 0              | The save operation won't start when trying to save map tiles below this zoom level |
| 'maxZoom'                | Number   | 19             | The save operation will not save map tiles beyond this zoom level                  |
| 'confirmSavingCallback'  | Function | null           | A function to be executed before the save operation starts                         |
| 'confirmRemovalCallback' | Function | null           | A function to be executed before the remove operation starts                       |

The callbacks should implement the following interface.

| Method                    | Parameters                                        | Returns                                                                      |
| ------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| 'confirmSavingCallback'   | nTilesToSave: Number, continueSaveTiles: Function | Whatever. Remember to call ```continueSaveTiles``` to resume the operation   |
| 'confirmRemovalCallback'  | continueRemoveTiles: Function                     | Whatever. Remember to call ```continueRemoveTiles``` to resume the operation |

### Events

Events fired by the ```OfflineControl``` on the ```OfflineLayer```. Assume that ```tilesDb``` is the database layer object.

| Event                          | Data                   | Description                                                                     |
| ------------------------------ | ---------------------- | ------------------------------------------------------------------------------- |
| 'offline:below-min-zoom-error' | undefined              | Fired when trying to save below minimum zoom level                              |
| 'offline:save-start'           | {nTilesToSave: Number} | Fired when the save operation starts but before calling ```tilesDb.saveTiles``` |
| 'offline:save-end'             | undefined              | Fired when the promise from ```tilesDb.saveTiles``` finishes successfully       |
| 'offline:save-error'           | {error: Error}         | Fired when the promise from ```tilesDb.saveTiles``` finishes with an error      |
| 'offline:remove-start'         | undefined              | Fired when the remove operation starts but before calling ```tilesDb.clear```   |
| 'offline:remove-end'           | undefined              | Fired when the promise from ```tilesDb.clear``` finishes successfully           |
| 'offline:remove-error'         | {error: Error}         | Fired when the promise from ```tilesDb.clear``` finishes with an error          |

## Example

Creating the database layer object.

```javascript
var tilesDb = {
    getItem: function (key) {
        // return Promise that has the image Blob/File/Stream.
    },

    saveTiles: function (tileUrls) {
        // return Promise.
    },

    clear: function () {
        // return Promise.
    }
};
```

Creating the ```OfflineLayer```.

```javascript
var map = L.map('map-id');
var offlineLayer = L.tileLayer.offline('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', tilesDb, {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abc',
    minZoom: 13,
    maxZoom: 19,
    crossOrigin: true
});
```

Creating the ```OfflineControl```.

```javascript
var offlineControl = L.control.offline(offlineLayer, tilesDb, {
    saveButtonHtml: '<i class="fa fa-download" aria-hidden="true"></i>',
    removeButtonHtml: '<i class="fa fa-trash" aria-hidden="true"></i>',
    confirmSavingCallback: function (nTilesToSave, continueSaveTiles) {
        if (window.confirm('Save ' + nTilesToSave + '?')) {
            continueSaveTiles();
        }
    },
    confirmRemovalCallback: function (continueRemoveTiles) {
        if (window.confirm('Remove all the tiles?')) {
            continueRemoveTiles();
        }
    },
    minZoom: 13,
    maxZoom: 19
});
```

Adding both of them to the map.

```javascript
offlineLayer.addTo(map);
offlineControl.addTo(map);
```

For a more complete example, check the demo code inside the ```gh-pages``` branch.
