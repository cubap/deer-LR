/**
 * Lived Religions
 * @author Bryan Haberberger <bryan.j.haberberger@slu.edu>
 *
 */

const LR = {}
LR.local = {}
LR.local.survey={}
LR.crud = {}
LR.crud.URL = {
    BASE_ID: "http://devstore.rerum.io/v1",
    CREATE: "http://tinydev.rerum.io/app/create",
    UPDATE: "http://tinydev.rerum.io/app/update",
    DELETE:"http://tinydev.rerum.io/app/delete"
}
LR.err = {}
LR.tricks = {}
LR.ui = {}
LR.test = {}

LR.test.event = {
   "@id": "http://devstore.rerum.io/v1/id/5cee987de4b07d216aab6bfc"
}

LR.test.interviewer = {
    "@id": "http://devstore.rerum.io/v1/id/5cee975be4b07d216aab6bfa"
}

LR.test.interviewee = {
    "@id":"http://devstore.rerum.io/v1/id/5cdeb6a7e4b07d216aab6908"
}

LR.test.fillTextAreas = function(){
    let elems = document.querySelectorAll(".answer")
    for(let l=0; l<elems.length; l++){
        elems[l].value = "Answer "+l
    }
}


/** Various LR error handlers */
LR.err.generic_error = function (msg){
    alert(msg)
}


LR.err.unhandled = function(error){
    console.log("There was an unhandled error when using fetch")
    console.log(error)
    throw Error(error)
    return error
}

LR.err.handleHTTPError = function(response){
    if (!response.ok){
        let status = response.status;
        switch(status){
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
        throw Error("HTTP Error: "+response.statusText)
    }
    return response
}
/** END Error handlers */

/**
 * 
 * @param {type} id
 * @return {unresolved}
 */
LR.tricks.resolveForJSON = async function(id){
    let j = {}
    if(id){
        await fetch(id)
            .then(LR.handleHTTPError)
            .then(resp => j = resp.json())
            .catch(error => LR.err.unhandled(error))
    }
    else{
        LR.err.generic_error("No id provided to resolve for JSON.  Make sure you have an id.")
    }
    return j
}

LR.tricks.getURLVariable = function (variable){
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] == variable){return pair[1];}
    }
    return(false);
}

LR.tricks.replaceURLVariable = function (variable, value){
    var query = window.location.search.substring(1)
    var location = window.location.origin + window.location.pathname
    var vars = query.split("&");
    var variables = ""
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=")
        if(pair[0] == variable){
            var newVar = pair[0]+"="+value;
            vars[i] = newVar;
            break;
        }
    }
    variables = vars.toString()
    variables = variables.replace(/,/g, "&")
    return(location + "?"+variables)
}

LR.tricks.makeQuestions = async function(interviewerID, intervieweeID){
    let questionObjs = []
    let elems = document.querySelectorAll(".QA")
    for(let i=0; i<elems.length; i++){
        let qtext = elems[i].children[0].value
        let q={
          "@context": "https://schema.org",
          "@type":"Question",
          "text":qtext,
          "about":"http://example.org/Event1",
          "contentLocation":"http://example.org/Location1", //Although the Event would know this, it may make querying easier
          "author":interviewerID, //Perhaps the interviewer
          "contributor":intervieweeID, //Perhaps the interviewee
          "editor":"Some other person",
          "inLanguage":"en",
          "testing":"LR"
        }
        questionObjs.push(q)
    }
    return questionObjs
}

LR.tricks.makeAnswers = async function(interviewerID, intervieweeID, questions){
    let answerObjs = []
    let elems = document.querySelectorAll(".QA")
    for(let i=0; i<elems.length; i++){
        let atext = elems[i].children[1].value
        let a={
          "@context": "https://schema.org",
          "@type":"Answer",
          "text":atext,
          "parentItem":questions[i]["@id"],
          "about":"http://example.org/Event1",
          "contentLocation":"http://example.org/Location1", //Although the Event would know this, it may make querying easier
          "author":interviewerID, //Perhaps the interviewer
          "contributor":intervieweeID, //Perhaps the interviewee
          "editor":"Some other person",
          "inLanguage":"en",
          "testing":"LR"
        }
        answerObjs.push(a)
    }
    return answerObjs
}

LR.tricks.makeReplyActions = function(interviewerID, intervieweeID, questions, answers){
    let RAobjs = []
    if(questions.length !== answers.length){
        return Error("The parameters' lengths do not match.")
    }
    for(let i=0; i<questions.length; i++){
        let question = questions[i]
        let answer = answers[i]
        let RA = {
          "@context": "https://schema.org",
          "@type": "ReplyAction",
          "agent": {
            "@type": "Person",
            "id": interviewerID
          },
          "recipient": {
            "@type": "Person",
            "id": intervieweeID
          },
          "resultComment": {
            "@type":"Answer",
            "id":answer["@id"],
            "parentItem":{
               "@type":"Question",
               "id":question["@id"],
               "text":question.text
            },
            "text":answer.text,   
          },
          "testing":"LR"
        }
        RAobjs.push(RA)
    }
    
    return RAobjs
}

LR.tricks.makeConversation = function(interviewerID, intervieweeID, QAset){
    let newConvo
    if(LR.local.survey["@id"]){
        //One is already made and in memory
        newConvo = LR.local.survey
    }
    else{
        //No conversation loaded up, this will be a new one.  Must construct.
        let elems = document.querySelectorAll(".convoMetadata")
        newConvo={
          "@context": "https://schema.org/",
          "@type": "Conversation",
          "hasPart":QAset,
          "testing":"LR"
        }
        //map hidden inputs to the conversation object as simple key - val pairs
        for(let i=0; i<elems.length; i++){
           let k = elems[i].getAttribute("my-key")
           let v = elems[i].value
           newConvo[k]=v
        }
    }
    return newConvo
}


/** LR -> RERUM proxy calls */

/**
 * Call to the LR proxy API into RERUM API to create this object in the data store
 * @param {type} obj
 * @return {JSON of the object created}
 */
LR.crud.create = async function (obj){
    delete obj.__isdirty
    let url = LR.crud.URL.CREATE
    let jsonReturn = {}
    return await fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(obj) // body data type must match "Content-Type" header
    })
    .then(LR.handleHTTPError)
    .then(resp => resp.json())
    .catch(error => LR.err.unhandled(error))
    
}

/**
 * Call to the LR proxy API into RERUM API to PUT update this object in the data store
 * Note this means the entire object will be represented under this new body.  
 * @param {type} obj
 * @return {JSON representing the new state of the object updated}
 */
LR.crud.update = async function (obj){
    delete obj.__isdirty
    let url = LR.crud.URL.UPDATE
    return await fetch(url, {
        method: "PUT", 
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(obj) // body data type must match "Content-Type" header
    })
    .then(LR.handleHTTPError)
    .then(resp => resp.json())
    .catch(error => LR.err.unhandled(error))
}

/**
 * Call to the LR proxy API into RERUM API to PATCH update this object in the data store
 * Note only keys that match keys in this body will be updated.  All other parts of the body
 * will be ignored.  
 * @param {type} obj
 * @return {JSON representing the new state of the object updated}
 */
// LR.crud.patchUpdate = async function (obj){
//     let url = "patch"
//     let jsonReturn = {}
//     await fetch(url, {
//         method: "PATCH", 
//         headers: {
//             "Content-Type": "application/json; charset=utf-8"
//         },
//         body: JSON.stringify(obj) // body data type must match "Content-Type" header
//     })
//     .then(LR.handleHTTPError)
//     .then(resp => jsonReturn = resp.json().new_obj_state)
//     .catch(error => LR.err.unhandled(error))
//     return jsonReturn
// }

/**
 * Call to the LR proxy API into RERUM API to mark this object as deleted in RERUM.
 * @param {type} obj
 * @return {JSON representing the new state of the object updated}
 */
LR.crud.delete = async function (obj){
    let url = LR.crud.URL.DELETE
    let jsonReturn = {};
    return await fetch(url, {
        method: "DELETE", 
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(obj) // body data type must match "Content-Type" header
    })
    .then(LR.handleHTTPError)
    .then(resp => resp.json())
    .catch(error => LR.err.unhandled(error))
}

/**
 * Call to the LR proxy API into RERUM API to query for objecrts in the data store. 
 * Note all objects that have matching key:val pairs in the query will be returned,
 * including history.  
 * @param {type} obj
 * @return {JSON representing the new state of the object updated}
 */
// LR.crud.query = async function (obj){
//     let url = "query"
//     let jsonReturn = {}
//     await fetch(url, {
//         method: "POST", 
//         headers: {
//             "Content-Type": "application/json; charset=utf-8"
//         },
//         body: JSON.stringify(obj) // body data type must match "Content-Type" header
//     })
//     .then(LR.handleHTTPError)
//     .then(resp => jsonReturn = resp.json())
//     .catch(error => LR.err.unhandled(error))
//     return jsonReturn
// }

LR.crud.createOrUpdate = async function(conversation){
    //A conversation will have Questions, Answers and ReplyActions that all need updating
    //Once complete, if there has been a create or update, the conversation needs created/updated. otherwise, do nothing. 
    let mustUpdateConvo = false
    let isnewQA
    let convo = JSON.parse(JSON.stringify(conversation))
    let isnewconvo = !conversation.hasOwnProperty("@id") || conversation["@id"]==""
    let update = document.getElementById("theSurvey").getAttribute("survey_id")== ""
    //we are just waiting for them all to complete, each one isn't waiting on the last. 
    for(let x=0; x<convo.hasPart.length; x++){
        let elem = document.querySelectorAll(".QA")[x].children[1]
        let QAorRA = convo.hasPart[x]
        isnewQA = !QAorRA.hasOwnProperty("@id") || QAorRA["@id"]==""
        if(isnewQA){
            let newq = await LR.crud.create(QAorRA.resultComment.parentItem)
            newq = newq.new_obj_state
            QAorRA.resultComment.parentItem = newq
            let newa = await LR.crud.create(QAorRA.resultComment)
            newa=newa.new_obj_state
            QAorRA.resultComment = newa
            let createdObj = await LR.crud.create(QAorRA)
            createdObj = createdObj.new_obj_state
            createdObj.__isdirty=false
            elem.setAttribute("survey_id", createdObj["@id"])
            convo.hasPart[x] = createdObj
            conversation.__isnew = true
        }
        else{
            if(QAorRA.__isdirty){
                let newText = elem.value
                let a2up = JSON.parse(JSON.stringify(QAorRA.resultComment))
                a2up.text = newText
                let updatedA = await LR.crud.update(a2up)
                updatedA=updatedA.new_obj_state
                QAorRA.resultComment = updatedA
                let updatedObj = await LR.crud.update(QAorRA)
                updatedObj = updatedObj.new_obj_state
                elem.setAttribute("survey_id", updatedObj["@id"])
                convo.hasPart[x] = updatedObj
                conversation.__isdirty = true
            }
        }
    }
    
    await Promise.all(convo.hasPart).then(async function(){
        if(isnewconvo){
            convo = await LR.crud.create(convo)
            convo = convo.new_obj_state
        }
        else{
            convo = await LR.crud.update(convo)
            convo = convo.new_obj_state
        }
        convo.__isdirty=false
        LR.local.survey = convo
        document.getElementById("theSurvey").setAttribute("survey_id", LR.local.survey["@id"])
    })

    return convo
}

LR.ui.dirtyEvent = function(){
    let answerAreas = document.getElementsByClassName("answer")
    for(let e = 0; e<answerAreas.length; e++){
        let area = answerAreas[e]
        if (area.addEventListener) {
          area.addEventListener('input', function() {
            if(LR.local.survey["@id"]&&area.getAttribute("dirty") === "false"){
                 LR.local.makeDirty(area)   
            }
           
          }, false)
        } 
        else if (area.attachEvent) {
          area.attachEvent('onpropertychange', function() {
            if(LR.local.survey["@id"]&&area.getAttribute("dirty") === "false"){
                 LR.local.makeDirty(area)   
            }
          })
        }
    }
}

LR.ui.submitSurvey = async function(){
     //Question
    //Is a schema.org JSON-LD Question and/or AskAction
    let newConversation
    let interviewerID 
    let intervieweeID 
    let questions
    let answers
    let qaSet
    if(LR.local.survey["@id"]){
        newConversation = await LR.crud.createOrUpdate(LR.local.survey)
    }
    else{
        interviewerID = document.getElementById("meta_author").value
        intervieweeID = document.getElementById("meta_contributor").value
        conversation = {}
        questions = await LR.tricks.makeQuestions(interviewerID, intervieweeID) 
        answers = await LR.tricks.makeAnswers(interviewerID, intervieweeID, questions) 
        qaSet = await LR.tricks.makeReplyActions(interviewerID, intervieweeID, questions, answers)
        conversation = await LR.tricks.makeConversation(interviewerID, intervieweeID, qaSet)
        //Is a Survey a https://schema.org/Conversation/ ?  I think that would be fair to say.  A conversation aggregates Comments like
        newConversation = await LR.crud.createOrUpdate(conversation)
    }
    document.getElementById("theSurvey").setAttribute("survey_id", newConversation["@id"])
    LR.local.removeDirty()
    return newConversation 
}

LR.ui.populateQA = function(survey){
    let elems = document.querySelectorAll(".QA")
    let survey_QAs = survey.hasPart
    for(let l=0; l<elems.length; l++){
        elems[l].children[1].setAttribute("dirty", "false")
        elems[l].children[1].value = survey_QAs[l].resultComment.text
        elems[l].children[1].setAttribute("survey_id",survey_QAs[l]["@id"])
    }
}

LR.ui.resumeSurvey = async function(surveyID){

    let surveyObj = await LR.tricks.resolveForJSON(surveyID)
    LR.local.survey = surveyObj
    let eventID = surveyObj.about
    let interviewerID = surveyObj.author
    let intervieweeID = surveyObj.contributor
    document.getElementById("interviewee").classList.remove("hidden")
    document.getElementById("noInterviewee").classList.add("hidden")

    document.getElementById("interviewer").classList.remove("hidden")
    document.getElementById("noInterviewer").classList.add("hidden")

    document.getElementById("event").classList.remove("hidden")
    document.getElementById("noEvent").classList.add("hidden")
    document.getElementById("provideSurvey").classList.add("hidden")

    document.getElementById("theSurvey").classList.remove("hidden")

    document.getElementById("meta_about").value = eventID
    document.getElementById("meta_author").value = interviewerID
    document.getElementById("meta_contributor").value = intervieweeID
    //Should probably store interviewer and interviewee id somewhere easy to gather.  
    //Should probably display the event title
    LR.ui.displayEventInfo(eventID)
    LR.ui.displayNames(interviewerID, intervieweeID)
    LR.ui.populateQA(surveyObj)
}

LR.ui.startSurvey = async function(event){
    //Make sure we have all prerequisite information, then hide/show next pieces
    let resumeID = document.getElementById("survey_id").value
    let intervieweeID = document.getElementById("interviewee_id").value
    let interviewerID = document.getElementById("interviewer_id").value
    let eventID = document.getElementById("event_id").value
    LR.local.removeDirty() // everything starts off clean
    LR.ui.dirtyEvent()

    if(resumeID){
        LR.ui.resumeSurvey(resumeID)
        return true
    }
    else{
        if(typeof intervieweeID !== "string" || "" === intervieweeID){
            return false
        }
        if(typeof interviewerID !== "string" || "" === interviewerID){
            return false
        }
        if(typeof eventID !== "string" || "" === eventID){
            return false
        }
    }
    

    document.getElementById("interviewee").classList.remove("hidden")
    document.getElementById("noInterviewee").classList.add("hidden")

    document.getElementById("interviewer").classList.remove("hidden")
    document.getElementById("noInterviewer").classList.add("hidden")

    document.getElementById("event").classList.remove("hidden")
    document.getElementById("noEvent").classList.add("hidden")
    document.getElementById("provideSurvey").classList.add("hidden")

    document.getElementById("theSurvey").classList.remove("hidden")

    document.getElementById("meta_about").value = eventID
    document.getElementById("meta_author").value = interviewerID
    document.getElementById("meta_contributor").value = intervieweeID
    //Should probably store interviewer and interviewee id somewhere easy to gather.  
    //Should probably display the event title
    LR.ui.displayEventInfo(eventID)
    LR.ui.displayNames(interviewerID, intervieweeID)
    return true
}

LR.ui.displayEventInfo = async function(id){
    // let eventObj = await LR.tricks.resolveForJSON(id)
    // LR.test.event = eventObj
    // let eventTitle = eventObj.name
    // let eventLoc = eventObj.location
    // document.getElementById("eventTitle").innerHtml = eventTitle+" at "+location
    document.getElementById("eventDeer").setAttribute("deer-id", id)
}

LR.ui.displayNames = async function(interviewer, interviewee){
    // let interviewerObj = await LR.tricks.resolveForJSON(interviewer)
    // let intervieweeObj = await LR.tricks.resolveForJSON(interviewee)
    // LR.test.interviewer = interviewerObj
    // LR.test.interviewee = intervieweeObj
    // document.getElementById("interviewerName").innerHtml = "Interview performed by "+interviewerObj.name
    // document.getElementById("intervieweeName").innerHtml = "asking "+intervieweeObj.name
    document.getElementById("interviewerDeer").setAttribute("deer-id", interviewer)
    document.getElementById("intervieweeDeer").setAttribute("deer-id", interviewee)
}


LR.local.makeDirty = function(html){
    let items = LR.local.survey.hasPart
    let id = html.getAttribute("survey_id")
    html.setAttribute("dirty", "true")
    for(let l=0; l<items.length; l++){
        if(!items[l].__isdirty && items[l]["@id"] === id){
            items[l].__isdirty = true
            return true
        }
    }
    return false
}

LR.local.removeDirty = function(){
    let elems = document.querySelectorAll(".answer")
    for(let l=0; l<elems.length; l++){
        elems[l].setAttribute("dirty", "false")
    }
}





