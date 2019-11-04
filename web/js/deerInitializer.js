/**
 * @module DEER Data Encoding and Exhibition for RERUM (DEER)
 * @author Patrick Cuba <cubap@slu.edu>

 * This code should serve as a basis for developers wishing to
 * use TinyThings as a RERUM proxy for an application for data entry,
 * especially within the Eventities model.
 * @see tiny.rerum.io
 */

// Identify an alternate config location or only overwrite some items below.
import { default as DEER } from 'https://centerfordigitalhumanities.github.io/deer/releases/alpha-0.9/deer-config.js'

// Identify a UTILS package
import { default as UTILS } from 'https://centerfordigitalhumanities.github.io/deer/releases/alpha-0.9/deer-utils.js'

// Overwrite or add certain values to the configuration to customize.

//Add one of my own templates
DEER.TEMPLATES.sense = function(obj, options = {}) {
    try {
        //if I use key that doesn't exist, I get a blank, which is better than a breaking error 
        let kind = `<h3>${UTILS.getValue(obj.kind)}</h3>`
        let location = `<dd>Location:${UTILS.getValue(obj.location)}</dd>`
        let religiousTradition = `<dd>Religion:${UTILS.getValue(obj.religious_tradition)}</dd>`
        let gender = `<dd>Gender:${UTILS.getValue(obj.demographic.gender)}</dd>`
        let age = `<dd>Age:${UTILS.getValue(obj.demographic.age)}</dd>`
        let use = `<dd>Use:${UTILS.getValue(obj.typical_use)}</dd>`
            //If I use a obj.xyz that doesn't exist a breaking error occurs...

        let senseTemplate = `<div>`

        senseTemplate += `<div>${kind}</div>`
        senseTemplate += `<div>${location}</div>`
        senseTemplate += `<div>${religiousTradition}</div>`
        senseTemplate += `<div>${gender}</div>`
        senseTemplate += `<div>${age}</div>`
        senseTemplate += `<div>${use}</div>`

        senseTemplate += `</div>`
        return senseTemplate
    } catch (err) {
        return null
    }
    return null
}

//Overwrite the internal person template with a more robust one
DEER.TEMPLATES.person = function(obj, options = {}) {
        try {
            let tmpl = `<h2>${UTILS.getLabel(obj)}</h2>`
            let depiction = UTILS.getValue(obj.depiction) || "https://via.placeholder.com/200?text=No+photo+available"
            let dob = ["Date of birth", UTILS.getValue(obj.birthDate) || "unrecorded"]
            let email = ["Email", UTILS.getValue(obj.email) || "unrecorded"]
            let phone = ["Telephone Number", UTILS.getValue(obj.telephone) || "unrecorded"]
            let religion = ["Religion", UTILS.getValue(obj["religious_tradition"]) || "unrecorded"]
            let gender = ["Gender", UTILS.getValue(obj.gender) || "unrecorded"]
            let edu = ["Education", UTILS.getValue(obj.education) || "unrecorded"]
            let nationality = ["Nationality", UTILS.getValue(obj.nationality) || "unrecorded"]
            let description = ["Description", UTILS.getValue(obj.description) || "unrecorded"]
            tmpl += `<img src=${depiction} alt='portrait' class="pull-right">
            <dl>
            ${[dob,email,phone,religion,gender,edu,nationality,description].reduce((a,b)=>a+=`<dt>${b[0]}<dt>
            <dd>${b[1]}</dd>
            </dl>`,``)}`
        return tmpl
    } catch (err) {
        return null
    }
}

/**
 * Create a select dropdown containing Places.  
 * @param {type} obj
 * @param {type} options
 * @return {tmpl}
 */
DEER.TEMPLATES.locationsAsDropdown = function(obj, options = {}) {
    try {
        let tmpl = `<select oninput="document.getElementById('loc').value=this.selectedOptions[0].value" deer-key-x="location">`
        let allPlacesInCollection = UTILS.getValue(obj.itemListElement)
        for (let place of allPlacesInCollection) {
            tmpl += `<option deer-id="${place['@id']}" value="${place['@id']}">${UTILS.getLabel(place)}</option>`
        }
        tmpl += `</select>`
        return tmpl
    } catch (err) {
        return null
    }
}

/**
 * Create a select area that is populated by some set or list of people.
 * @param {type} obj
 * @param {type} options
 * @return {tmpl}
 */
DEER.TEMPLATES.personMulti = function(obj, options = {}) {
    try {
        let allPeopleInCollection = UTILS.getValue(obj.itemListElement)
        let tmpl = ``
        tmpl += `<select deer-key-x="contributor" multiple="" disabled oninput="this.previousElementSibling.value=JSON.stringify(Array.from(this.selectedOptions).map(e=>e.value))">
            <optgroup label="Researchers"> `
        for (let person of allPeopleInCollection) {
            tmpl += `<option deer-id="${person['@id']}" value="${person['@id']}">${UTILS.getLabel(person)}</option>`
        }
        tmpl += `</optgroup></select>`
        return tmpl
    } catch (err) {
        return null
    }
}

/**
 * TODO Really this is the "data submission" template.  As far as it goes, this is the only "Event" recorded so far.  
 * This is very basic and does not contain the information describing the Event.  It needs to be built out as we begin to #14
 * describe an experience.  
 * 
 * @param {type} obj
 * @param {type} options
 * @return {default.TEMPLATES.Event.tmpl, String}
 */
DEER.TEMPLATES.Event = function(obj, options = {}) {
        try {
            let tmpl = `<h2>${UTILS.getLabel(obj)}</h2><dl>`
            let contr_people = UTILS.stringifyArray(UTILS.getArrayFromObj(obj.contributor, null), DEER.DELIMETERDEFAULT)
            let researchers = `<dt>Researchers Involved</dt><dd>${contr_people}</dd>`
            let date = `<dt>Associated Date</dt><dd>${UTILS.getValue(obj.startDate, [], "string")}</dd>`
            let place = `<dt>Location</dt><dd>${UTILS.getValue(obj.location, [], "string")}</dd>`
            tmpl += place + date + researchers
            return tmpl
        } catch (err) {
            return null
        }
    }
   
    DEER.URLS = {
        BASE_ID: "http://store.rerum.io/v1",
        CREATE: "create",
        UPDATE: "update",
        QUERY: "query",
        OVERWRITE: "overwrite",
        DELETE: "delete",
        SINCE: "http://store.rerum.io/v1/since"
    }

// Render is probably needed by all items, but can be removed.
// CDN at https://centerfordigitalhumanities.github.io/deer/releases/
import { default as renderer, initializeDeerViews } from 'https://centerfordigitalhumanities.github.io/deer/releases/alpha-0.9/deer-render.js'

// Record is only needed for saving or updating items.
// CDN at https://centerfordigitalhumanities.github.io/deer/releases/
import { default as record, initializeDeerForms } from 'https://centerfordigitalhumanities.github.io/deer/releases/alpha-0.9/deer-record.js'

// fire up the element detection as needed
initializeDeerViews(DEER)
    //Need to make the form initializer wait on view initializer, these cannot run syncronously.  
initializeDeerForms(DEER)
