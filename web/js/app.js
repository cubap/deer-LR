/**
 * Lived Religions
 * @author Bryan Haberberger <bryan.j.haberberger@slu.edu>
 *
 */

const LR = {}
LR.VERSION = "0.3.0"
LR.APPAGENT = "http://store.rerum.io/v1/id/5da8c165d5de6ba6e2028474"
    //Make sure these behave like DEER.URLS, AKA when it is deployed to dev, use sandbox, not lived-religion-dev or the internal back end
LR.URLS = {
    LOGIN: "login",
    LOGOUT: "logout",
    BASE_ID: "http://store.rerum.io/v1",
    DELETE: "delete",
    CREATE: "create",
    UPDATE: "update",
    OVERWRITE: "overwrite",
    QUERY: "query",
    SINCE: "http://store.rerum.io/v1/since"
}

if (typeof(Storage) !== "undefined") {
    LR.localInfo = window.localStorage
} else {
    LR.err.generic_error("Please update your browser or use a different browser, this one is not supported. Sorry for the inconvenience.")
}
LR.err = {}
LR.ui = {}
LR.utils = {}

/** Various LR error handlers */
LR.err.generic_error = function(msg) {
    alert(msg)
}

LR.err.unhandled = function(error) {
    console.log("There was an unhandled error when using fetch")
    console.log(error)
    throw Error(error)
    return error
}

LR.err.handleHTTPError = function(response) {
        if (!response.ok) {
            let status = response.status;
            switch (status) {
                case 400:
                    console.log("Bad Request")
                    break;
                case 401:
                    console.log("Request was unauthorized")
                    break;
                case 403:
                    console.log("Forbidden to make request")
                    break;
                case 404:
                    console.log("Not found")
                    break;
                case 500:
                    console.log("Internal server error")
                    break;
                case 503:
                    console.log("Server down time")
                    break;
                default:
                    console.log("unahndled HTTP ERROR")
            }
            throw Error("HTTP Error: " + response.statusText)
        }
        return response
    }
    /** END Error handlers */

LR.ui.loginFail = function() {
    LR.sessionInfo.removeItem("authorized")
    alert("The username and/or password you provided is not correct.")
}

/**
 * Remove an item from one of the Lived Religion application collections.
 * @param {String} itemID : The ID of the annotation connecting the item to the collection.
 * @param {HTMLElement} itemElement : The HTML element representing the item that needs to be removed from the DOM.
 */
LR.utils.removeCollectionEntry = async function(itemID, itemElem, collectionName) {
        let historyWildcard = { "$exists": true, "$size": 0 }
        let queryObj = {
            $or: [{
                "targetCollection": collectionName
            }, {
                "body.targetCollection": collectionName
            }],
            "__rerum.history.next": historyWildcard,
            "__rerum.generatedBy": LR.APPAGENT,
            "target": itemID
        }
        fetch(LR.URLS.QUERY, {
                method: "POST",
                mode: "cors",
                body: JSON.stringify(queryObj)
            })
            .then(response => response.json())
            .then(pointers => {
                //Remember, there may be multiple annotations that place this item in the collection.  Get rid of all of them.
                let deleteList = []
                pointers.map(ta => {
                    deleteList.push(
                        fetch(LR.URLS.DELETE, {
                            method: "DELETE",
                            mode: "cors",
                            body: ta["@id"] || ta.id
                        })
                    )
                })
                return Promise.all(deleteList)
            }).then(deletedList => {
                //Can't seem to fall into the Promise.all().catch() on 4XX, and perhaps other, errors...
                let resultList = deletedList.filter(resp => { return resp.ok })
                if (deletedList.length === resultList.length) {
                    LR.utils.broadcastEvent(undefined, "collectionItemDeleted", itemElem)
                    itemElem.remove()
                } else {
                    //We could broadcast an event to say this failed, it depends what we want to trigger in interface.
                    //This should suffice for now.
                    console.error("There was an error removing an item from the collection")
                    console.log(itemElem)
                }
            }).catch(err => {
                //We could broadcast an event to say this failed, it depends what we want to trigger in interface.
                //This should suffice for now.
                console.error("There was an error gathering information to remove an item from the collection")
                console.log(itemElem)
            })
    },

    /**
     * Broadcast a message about some event
     * DO NOT collide with DEER events.  
     */
    LR.utils.broadcastEvent = function(event = {}, type, element, obj = {}) {
        let e = new CustomEvent(type, { detail: Object.assign(obj, { target: event.target }), bubbles: true })
        element.dispatchEvent(e)
    }