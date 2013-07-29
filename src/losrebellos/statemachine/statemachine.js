/*
 *
 * @author Benoit Vinay
 *
 * ben@benoitvinay.com
 * http://www.benoitvinay.com
 *
 */



//////////////////////////////////////////////////////////////////////////////////////////
// State
//////////////////////////////////////////////////////////////////////////////////////////
losrebellos.State = (function() {

    // constructor

    function State(name, data) {

        this.name = name;

        this.entering = data.entering;
        this.exiting = data.exiting;

        this.transitions = {};

        this.command = data.command;


        // parse transitions

        for(var i in data.transitions) {
            
            this.defineTransition(i, data.transitions[i]);
        }
    }

    
    // methods

    State.prototype.defineTransition = function(action, target) {
        
        this.transitions[action] = target;
    }
    
    State.prototype.removeTransition = function(action) {
        
        if(this.transitions[action] !== undefined) {
        
            delete this.transitions[action];
        }
    }

    State.prototype.removeTransitionByTargettedState = function(state) {
        
        for(var i in this.transitions) {

            if(state === this.transitions[i]) {

                delete this.transitions[i];
            }
        }
    }


    return State;
})();



//////////////////////////////////////////////////////////////////////////////////////////
// State machine
//////////////////////////////////////////////////////////////////////////////////////////
losrebellos.StateMachine = (function() {

    // constructor

    function StateMachine(options) {

        if(options) {

            for(var key in options) {

                this[key] = options[key];
            }
        }
    
        this.started = false;

        this.initialState;
        this.previousState;

        this.currentState;
        this.currentData;

        this.states = {};
    }

        
    //////////////////////////////////////////////////
    // start
    StateMachine.prototype.start = function(data) {

        if(this.started) {

            console.log("- statemachine is already started: ", this.currentState);

            return;
        }

        console.log("- statemachine started: ", this.initialState);
        
        this.onStart(this.initialState, data);

        _transitionTo(this, this.initialState, data);

        this.started = true;
    }
    // stop
    StateMachine.prototype.stop = function() {
    
        if(!this.started) {

            console.log("- statemachine is not started");

            return;
        }

        this.onStop(this.currentState, this.currentData);
        this.started = false;
    
        console.log("- statemachine stopped");
    }

    
    //////////////////////////////////////////////////
    // register state
    StateMachine.prototype.registerState = function(state, isInitial) {
        
        if(this.states[state.name] !== undefined) {
            
            return false;
        }
        
        this.states[state.name] = state;
        
        if(isInitial) {
        
            this.initialState = state;
        }
        
        return true;
    }
    
    // remove state
    StateMachine.prototype.removeState = function(stateName) {

        var state;
        for(var i in this.states) {

            var state = this.states[i];
            state.removeTransitionByTargettedState(stateName);
        }

        if(this.states[stateName] !== undefined) {
        
            delete this.states[stateName];
            return true;
        }
        
        return false;
    }

    
    //////////////////////////////////////////////////
    // transition
    StateMachine.prototype.onAction = function(action, data) {

        // if transition is in progress
        if(!_hasTransitioned) {

            // we add the action to the queue
            _actionDataQueue.push({ action: action, data: data });

            // cancel the change
            return;
        }
        
        var target = this.currentState.transitions[action];
        var newState = this.states[target];
        
        if(target !== undefined && newState !== undefined && this.currentState.name !== newState.name) {
            
            _transitionTo(this, newState, data);
        }
    }

    
    //////////////////////////////////////////////////
    // transition to new state
    var _transitionTo = function(stateMachine, newState, data) {

        _hasTransitioned = false;

        // exiting
        if(stateMachine.currentState !== undefined && stateMachine.currentState.exiting !== undefined) {
            
            stateMachine.onExiting(stateMachine.currentState);
        }
        
        // entering
        if(newState.entering !== undefined) {
            
            stateMachine.onEntering(newState);
        }
        
        // previous state
        stateMachine.previousState = stateMachine.currentState;
        
        // new state
        stateMachine.currentState = newState;
        stateMachine.currentData = data;
        stateMachine.onStateChanged(newState, data);

        // command
        if(newState.command !== undefined && newState.command !== "") {

            stateMachine.onCommand(newState, data);
        }

        // transition complete
        _hasTransitioned = true;

        // next in queue
        _transitionToAction(stateMachine);
    }

    
    //////////////////////////////////////////////////
    // force state: naughty.
    StateMachine.prototype.forceTransition = function(target, data) {

        _transitionTo(this, this.states[target], data);
    }

    
    //////////////////////////////////////////////////
    // action queue
    // allow to be sure that we have completely transitioned to the targetted state
    var _hasTransitioned = true;
    var _actionDataQueue = [];
    var _transitionToAction = function(stateMachine) {

        if(_actionDataQueue !== undefined && _actionDataQueue.length > 0) {

            var actionData = _actionDataQueue.shift();
            var target = stateMachine.currentState.transitions[actionData.action];

            if(target === undefined) {

                _transitionToAction(stateMachine);
            }
            else {

                stateMachine.onAction(actionData.action, actionData.data);
            }
        }
    }


    //////////////////////////////////////////////////
    // override this methods:
    // this.onStart = function(state) {}
    // this.onStop = function(state) {}
    // this.onExiting = function(state) {}
    // this.onEntering = function(newState, newData) {}
    // this.onStateChanged = function(currentState, currentData) {}
    // this.onCommand = function(currentState, currentData) {}


    //////////////////////////////////////////////////
    // execute command
    // (can be overridden)
    StateMachine.prototype.onCommand = function(state, data) {

        var CommandClass = window[this.currentState.command];
        var command = new CommandClass();
        command.execute.apply(this, [this, state, data]);   // command parameters: [stateMachine, state, data]
        delete command;
    }


    return StateMachine;
})();



//////////////////////////////////////////////////////////////////////////////////////////
// Injector
//////////////////////////////////////////////////////////////////////////////////////////
losrebellos.StateMachineInjector = (function() {

    // constructor

    function StateMachineInjector(fsm) {
        
        this.fsm = fsm;
    }
    

    // inject

    StateMachineInjector.prototype.inject = function(stateMachine) {

        if(this.fsm.initial === undefined) {

            console.log("You need an initial state in your fsm.");
        }
        
        var count = 0;
        var state;
        for(var i in this.fsm.states) {
        
            state = new losrebellos.State(i, this.fsm.states[i]);
            stateMachine.registerState(state, (this.fsm.initial === state.name));

            count++;
        }

        console.log("- " + count + " states: ", stateMachine.states);
    }


    return StateMachineInjector;
})();



//////////////////////////////////////////////////////////////////////////////////////////
// Factory
// usefull if you're lazy
//////////////////////////////////////////////////////////////////////////////////////////
losrebellos.fsmFactory = function(fsm, options, StateMachineClass) {

    var _stateMachine = new (StateMachineClass || losrebellos.StateMachine)(options);
    var _injector = new losrebellos.StateMachineInjector(fsm);
    _injector.inject(_stateMachine);

    return _stateMachine;
}
