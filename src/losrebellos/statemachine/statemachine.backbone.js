/*
 *
 * @author Benoit Vinay
 *
 * ben@benoitvinay.com
 * http://www.benoitvinay.com
 *
 */



//////////////////////////////////////////////////////////////////////////////////////////
// Events
//////////////////////////////////////////////////////////////////////////////////////////

losrebellos.StateEvent = (function() {

    function StateEvent() {

        // nothing
    }


    // constants

    StateEvent.FSM_STARTED    = "StateEvent/fsm/started";
    StateEvent.FSM_STOPPED    = "StateEvent/fsm/stopped";

    StateEvent.ACTION         = "StateEvent/action";
    StateEvent.CHANGED        = "StateEvent/changed";


    return StateEvent;
})();



//////////////////////////////////////////////////////////////////////////////////////////
// StateMachine for Backbone.js
//
// dispatcher is for events
// params is an Array of what is passed to a command
//////////////////////////////////////////////////////////////////////////////////////////
losrebellos.BackboneStateMachine = (function() {

    // constructor

    BackboneStateMachine.prototype = new losrebellos.StateMachine();
    function BackboneStateMachine(options) {

        // super:
        // options param is not pass to it

        losrebellos.StateMachine.apply(this);


        // params

        options = options || {};

        _dispatcher = options.dispatcher || _.extend({}, Backbone.Events);
    }


    // dispatcher

    var _dispatcher = null;

    BackboneStateMachine.prototype.getDispatcher = function() {

        return _dispatcher;
    }


    // methods

    BackboneStateMachine.prototype.onStart = function(state, data) {

        _dispatcher.on(losrebellos.StateEvent.ACTION, this.onAction, this);

        _dispatcher.trigger(losrebellos.StateEvent.FSM_STARTED, this, state, data);
    }

    BackboneStateMachine.prototype.onStop = function(state, data) {

        _dispatcher.off(losrebellos.StateEvent.ACTION, this.onAction, this);

        _dispatcher.trigger(losrebellos.StateEvent.FSM_STOPPED, this, state, data);
    }


    BackboneStateMachine.prototype.onExiting = function(previousState) {

        _dispatcher.trigger(previousState.exiting, this, previousState);
    }

    BackboneStateMachine.prototype.onEntering = function(newState, newData) {

        _dispatcher.trigger(newState.entering, this, newState, newData);
    }

    BackboneStateMachine.prototype.onStateChanged = function(currentState, currentData) {

        _dispatcher.trigger(currentState.name, this, currentState, currentData);
        _dispatcher.trigger(losrebellos.StateEvent.CHANGED, this, currentState, currentData);
    }


    BackboneStateMachine.prototype.onCommand = function(state, data) {

        var CommandClass = window[this.currentState.command];
        var command = new CommandClass();
        command.execute.apply(this, [this, _dispatcher, state, data]);  // parameters: [stateMachine, dispatcher, state, data]
        delete command;
    }


    return BackboneStateMachine;
})();
