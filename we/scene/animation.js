
/*
 * Copyright (C) 2011 Klokan Technologies GmbH (info@klokantech.com)
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU GPL for more details.
 *
 * USE OF THIS CODE OR ANY PART OF IT IN A NONFREE SOFTWARE IS NOT ALLOWED
 * WITHOUT PRIOR WRITTEN PERMISSION FROM KLOKAN TECHNOLOGIES GMBH.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 */

/**
 * @fileoverview Movement animation.
 *
 * @author leosamu@ai2.upv.es (Leonardo Salom)
 */

goog.provide('we.scene.Animation');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.fx.Animation');
goog.require('goog.fx.AnimationQueue');
goog.require('goog.fx.easing');
goog.require('goog.math');
goog.require('we.scene.Camera');



/**
 * Creates a movement animator that manages camera animation.
 * @param {!we.scene.Scene} scene Scene.
 * @constructor
 */
we.scene.Animation = function(scene) {
    /**
   * @type {!we.scene.Scene}
   * @private
   */
    this.scene_ = scene;
};


/**
 * Acceleeration function for the animation.
 * @enum {string}
 */
we.scene.Animation.Type = {
    /**
   * diferent types of animation function.
   */
    IN: 'in',
    OUT: 'out',
    INANDOUT: 'inandout'
};


/**
 * returns an animation function chosed by a string
 * @param {string=} funct in out or inandout.
 * @return {Function} Output the animation function that will be used.
 */
we.scene.Animation.selectType = function(funct) {
    switch (funct) {
        case 'in':
            return goog.fx.easing.easeIn;
            break;
        case 'out':
            return goog.fx.easing.easeOut;
            break;
        case 'inandout':
            return goog.fx.easing.inAndOut;
            break;
        default:
            return goog.fx.easing.easeOut;
            break; 
    }
};

/**
 * Moves the camera across a path fixed via keypositions
 * @param {Array.<Array.<number>>} path path the animation should follow
 * @param {boolean} bounce decides between bounce or smooh animation
 * @param {string} type Type of the animation function in, out or inandout.
 */
we.scene.Animation.prototype.goPath = function(path, bounce, type)
{    
    /**
        * @type {boolean}
        * @private
       */
    this.bounceonpath_=bounce;
    /**
     * @type {string}
     * @private
     */
    this.type_=type;    
 
    this.goTo(path[0],bounce,type);
}



/**
 * Moves the camera to from the animation origin to the animation
 * target position
 * @param {Array.<number>} end Array for end coordinates. 
 * @param {boolean} bounce decides between bounce or smooth animation
 * @param {string=} type Type of the animation function in, out or inandout.
 */
we.scene.Animation.prototype.goTo = function(end, bounce, type)
{   
    if (this.start_!=null||this.start_)
    {
 
    }
    else
    {
 
        /**
        * @type {Array.<number>}
        * @private
        */
        this.start_ = [this.scene_.camera.getPositionDegrees()[0],this.scene_.camera.getPositionDegrees()[1],this.scene_.camera.getZoom()];
 
       
    } 

    /**
   * @type {Array.<number>}
   * @private
   */
    this.end_ = end;


    this.checkAngles_(this.start_, this.end_);
    

    /**
   * @type {number}
   * @private
   */
    this.distance_ = this.calculateDistance_(this.start_[0],this.start_[1],this.end_[0],this.end_[1]);

   
    /**
   * @type {number}
   * @private
   */

    this.duration_ = Math.min(5000,Math.max(this.distance_ * 3 ,4000)) ;
    
   
    /**
    * Acceleration function for expand/collapse animation.
    * @type {!Function}
    */
    this.accel_ = we.scene.Animation.selectType(type) || goog.fx.easing.easeOut;

    /**
    * The animation queue, we divide it in horizontal and vertical animations
    * @type {!goog.fx.AnimationParallelQueue}
    */
    this.animation_ = new goog.fx.AnimationParallelQueue();
    /**
    * Horizontal animation queue
    * @type {!goog.fx.AnimationSerialQueue}
    */
    this.horizontalanimation_ = new goog.fx.AnimationSerialQueue();
    /**
    * Vertical animation queue
    * @type {!goog.fx.AnimationSerialQueue}
    */
    this.verticalanimation_= new goog.fx.AnimationSerialQueue();

    if (bounce){
        this.bounce_();
    }
    else
    {        
        this.smooth_();
    }
   

    this.animation_.add(this.horizontalanimation_);
    this.animation_.add(this.verticalanimation_);
  
    this.start_=null;
    // Start animation.
    this.animation_.play(false);

};


/**
 * Moves the camera to from the animation origin to the animation
 * target position
 * @param {Array.<number>} start Array for end coordinates.
 * @param {Array.<number>} end Array for end coordinates. 
 * @param {boolean} bounce decides between bounce or smooth animation
 * @param {string=} type Type of the animation function in, out or inandout.
 */
we.scene.Animation.prototype.goFromTo = function(start, end, bounce, type)
{
    /**
   * @type {Array.<number>}
   * @private
   */
    this.start_ = start;

    this.goTo(end, bounce, type);

};

/**
 * Called in case the animation has bounce movement
 *
 * @private
 */
we.scene.Animation.prototype.bounce_ = function()
{
    var altA_ = [this.start_[2]];

    var altB_ = [this.end_[2]];   

    var altMax_ = [Math.max(4,Math.min(altA_[0],altB_[0]) - ((this.distance_/12000) *
        this.scene_.earth.getCurrentTileProvider().getMaxZoomLevel()) - 0.8) ];    
    /**
   * @type {number}
   * @private
   */
    this.durationUp_=(altA_[0] - altMax_[0])/0.002;
    
    /**
   * @type {number}
   * @private
   */
    this.durationDown_=(altB_[0] - altMax_[0])/0.002;

    //create the go up animation and call for the go down at the end of
    var v1 = new goog.fx.Animation(altA_,
        altMax_,
        this.durationUp_,
        goog.fx.easing.inAndOut);
    var v2 = new goog.fx.Animation(altMax_,
        altMax_,
        this.duration_,
        goog.fx.easing.inAndOut);
    var v3 = new goog.fx.Animation(altMax_,
        altB_,
        this.durationDown_,
        goog.fx.easing.easeOut);

    this.verticalanimation_.add(v1);
    this.verticalanimation_.add(v2);
    this.verticalanimation_.add(v3);

    var events = [goog.fx.Animation.EventType.BEGIN,
    goog.fx.Animation.EventType.ANIMATE,
    goog.fx.Animation.EventType.END];

    goog.events.listen(v1, events, this.onVerticalAnimate_, false, this);
    goog.events.listen(v2, events, this.onVerticalAnimate_, false, this);
    goog.events.listen(v3, events, this.onVerticalAnimate_, false, this);
    goog.events.listen(v3, goog.fx.Animation.EventType.END, this.onEnd_, false, this);

    var h1 = new goog.fx.Animation(this.start_,
        this.start_,
        this.durationUp_,
        this.accel_);
    
    var h2 = new goog.fx.Animation(this.start_,
        this.end_,
        this.duration_,
        this.accel_);

    var h3 = new goog.fx.Animation(this.end_,
        this.end_,
        this.durationDown_,
        this.accel_);

    this.horizontalanimation_.add(h1);
    this.horizontalanimation_.add(h2);
    this.horizontalanimation_.add(h3);

    goog.events.listen(h1, events, this.onHorizontalAnimate_, false, this);
    goog.events.listen(h2, events, this.onHorizontalAnimate_, false, this);
    goog.events.listen(h3, events, this.onHorizontalAnimate_, false, this);
    goog.events.listen(h3, goog.fx.Animation.EventType.END, this.onEnd_, false, this);
        
    


};

/**
 * Called in case the animation has smooth movement
 *
 * @private
 */
we.scene.Animation.prototype.smooth_ = function()
{    
    //create the vertical animation
    var v1 = new goog.fx.Animation([this.start_[2]],
        [this.end_[2]],
        this.duration_,
        this.accel_);

    this.verticalanimation_.add(v1);

    var events = [goog.fx.Animation.EventType.BEGIN,
    goog.fx.Animation.EventType.ANIMATE,
    goog.fx.Animation.EventType.END];

    goog.events.listen(v1, events, this.onVerticalAnimate_, false, this);

    var h1 = new goog.fx.Animation(this.start_,
        this.end_,
        this.duration_,
        this.accel_);

    this.horizontalanimation_.add(h1);

    goog.events.listen(h1, events, this.onHorizontalAnimate_, false, this);
    goog.events.listen(h1, goog.fx.Animation.EventType.END, this.onEnd_, false, this);

};



/**
 * Called during animation
 *
 * @param {goog.events.Event} e The event.
 * @private
 */
we.scene.Animation.prototype.onHorizontalAnimate_ = function(e) {
    //we move the camera to animate it.     
    this.scene_.camera.setPositionDegrees(e.x, e.y); 
    
};

/**
 * Called during animation
 *
 * @param {goog.events.Event} e The event.
 * @private
 */
we.scene.Animation.prototype.onVerticalAnimate_ = function(e) {
    //we move the camera to animate it.   
    this.scene_.camera.setZoom(e.x);
 
};

/**
 * Called at end of current animation and starts next step of a path if required
 *
 * @param {goog.events.Event} e The event.
 * @private
 */
we.scene.Animation.prototype.onEnd_ = function(e) {    
 
    /*/this.animation_.stop(false);
    if (this.path_.length>1)
    {
 
        goog.array.removeAt(this.path_, 0);
        this.start_=this.end_;
        this.goTo(this.path_[0],this.bounceonpath_,this.type_);
    }
    else
        {
 
            this.start_=null;
        }*/
};

/**
 * modifies start and end angles so the animation goes throuhgt the sortest
 * path
 *
 * @param {Array.<number>} start Array for end coordinates.
 * @param {Array.<number>} end Array for end coordinates.
 * @private
 */
we.scene.Animation.prototype.checkAngles_ = function(start, end) {

    start[0] = goog.math.modulo(start[0] , 360);

    start[1] = goog.math.modulo(start[1] , 360);

    end[0] = goog.math.modulo(end[0] , 360);

    end[1] = goog.math.modulo(end[1] , 360);

    var dif0 = start[0] - end[0];
    var dif1 = start[1] - end[1];

    if (dif0 < -180)
    {
        //modify one of the angles
        this.start_[0] += 360;
    }else if (dif0 > 180)
    {
        this.end_[0] += 360;
    }

    if (dif1 < -180)
    {
        //modify one of the angles
        this.start_[1] += 360;
    } else if (dif1 > 180)
{
        this.end_[1] += 360;
    }

};

/**
* @param {number} lat1.
* @param {number} lon1.
* @param {number} lat2.
* @param {number} lon2.
* @return {number}
* @private
*/
we.scene.Animation.prototype.calculateDistance_ = function(lat1,lon1,lat2,lon2)
{
    var radius = 6371;
    var dLat = goog.math.toRadians(lat2-lat1);
    var dLon = goog.math.toRadians(lon2-lon1);
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(goog.math.toRadians(lat1)) *   Math.cos(goog.math.toRadians(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    var c =  2 * Math.asin(Math.sqrt(a));
    return radius * c;

};