
/**
 * @fileoverview Object serving as level 2 cache for given TileProvider.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.TileCache');

goog.require('goog.debug.Logger');
goog.require('goog.structs');
goog.require('goog.structs.Map');

goog.require('we.texturing.Tile');
goog.require('we.texturing.Tile.State');
goog.require('we.texturing.TileProvider');



/**
 * Object serving as level 2 cache for the TileProvider.
 * @param {!we.texturing.TileProvider} tileprovider TileProvider to be cached.
 * @constructor
 */
we.texturing.TileCache = function(tileprovider) {
  this.tileMap_ = new goog.structs.Map();
  this.setTileProvider(tileprovider);
};


/**
 * Change TileProvider on-the-fly
 * @param {!we.texturing.TileProvider} tileprovider TileProvider to be set.
 */
we.texturing.TileCache.prototype.setTileProvider = function(tileprovider) {
  this.tileProviderResetTime_ = goog.now();
  this.tileProvider_ = tileprovider;
  this.tileProvider_.tileLoadedHandler = goog.bind(this.tileLoaded_, this);
  this.tileMap_.clear();
};


/**
 * @type {we.texturing.TileProvider}
 * @private
 */
we.texturing.TileCache.prototype.tileProvider_ = null;


/**
 * @type {number}
 * @private
 */
we.texturing.TileCache.prototype.tileProviderResetTime_ = 0;


/**
 * @type {goog.structs.Map}
 * @private
 */
we.texturing.TileCache.prototype.tileMap_ = null;


/**
 * @type {!function(we.texturing.Tile)}
 */
we.texturing.TileCache.prototype.tileCachedHandler = goog.nullFunction;


/**
 * Returns the tile from cache if available.
 * @param {string} key Key.
 * @return {we.texturing.Tile} Tile from cache.
 */
we.texturing.TileCache.prototype.getTileFromCache = function(key) {
  return /** @type {we.texturing.Tile} */ (this.tileMap_.get(key));
};


/**
 * Returns tile from cache or starts loading it if not available
 * @param {number} zoom Zoom.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number} requestTime Time of the request, used as priority.
 * @return {!we.texturing.Tile} Requested tile.
 */
we.texturing.TileCache.prototype.retrieveTile = function(zoom, x, y,
                                                         requestTime) {
  var key = we.texturing.Tile.createKey(zoom, x, y);
  var tile = this.getTileFromCache(key);
  if (!goog.isDefAndNotNull(tile)) {
    tile = this.tileProvider_.loadTile(zoom, x, y, requestTime);
    this.tileMap_.set(key, tile);
  } else {
    tile.requestTime = requestTime;
  }
  return tile;
};


/**
 * Callback for loaded tiles.
 * @param {!we.texturing.Tile} tile Loaded tile.
 * @private
 */
we.texturing.TileCache.prototype.tileLoaded_ = function(tile) {
  // To prevent caching late-arriving tiles.
  if (tile.requestTime < this.tileProviderResetTime_) {
    if (goog.DEBUG) {
      we.texturing.TileCache.logger.info('Ignoring late tile..');
    }
    return;
  }
  //TODO: something smarter !!
  /*if (this.tileMap_.getCount() > 32) {
    goog.structs.forEach(this.tileMap_,
        function(value, key, col) {goog.dispose(value);});
    this.tileMap_.clear();
  }*/

  this.tileCachedHandler(tile);
};

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.texturing.TileCache.logger =
      goog.debug.Logger.getLogger('we.texturing.TileCache');
}