
var FSM = {

    initial: "CLOSED",
    
    states: {
    
        "OPENED": {

            entering: "entering/anything",

            exiting: "exiting/anything",

            transitions: {
                
                "CLOSE": "CLOSED"
            }
        },
    
        "CLOSED": {

            transitions: {
                
                "OPEN": "OPENED",
                "LOCK": "LOCKED"
            },
            command: "ClosedCommand"
        },
    
        "LOCKED": {

            transitions: {
                
                "UNLOCK": "CLOSED"
            }
        }
    }
}
