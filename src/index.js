const cookie = window.cookie
const request = window.request
const requestPromise = util.promisify(request)

const webappUrlElem = document.getElementById("webapp_url")
const webappUrlWarning = document.getElementById("invalid_api_warning")
const startButton = document.getElementById("start_button")

// input verification rules
const webappUrlRegex = `^https:\/\/script\.google\.com\/macros\/s\/.*\/exec$`
const webappCookieKey = "webapp"


// ========== cookie IO ==========
window.onload = async () => {
    const webapp = await cookie.get(webappCookieKey)

    if (webapp) {
        populateURL(webappUrlElem, webapp)
    }
}

// ========== button logics ==========
startButton.onclick = async () => {
    startButton.classList.add('is-loading')
    disableElem(startButton)
    
    // field sanity checks
    if (!validateFields()) {
        startButton.classList.remove('is-loading')
        enableElem(startButton)
        return
    }

    // cookie the valid configs for latter uses
    cookie.set(webappCookieKey, webappUrlElem.value)

    // fetch + parse roulette information
    const currRouletteRewards = await getRouletteInfo(webappUrlElem.value)
    console.log(JSON.parse(currRouletteRewards.body))
    sessionStorage.setItem("rewardsRes", currRouletteRewards.body)

    // redirect to record.html
    window.location.replace('./recorder.html')
}


// ========== helpers ==========
const getRouletteInfo = async (url) => {
    try {
        const options = {
            redirect: "follow",
            method: "GET",
            url: url,
            headers: {
               "Content-Type": "text/plain;charset=utf-8"
            }
        }
        let response = await requestPromise(options)
        // TODO - err/data check
        return response
    } catch (err) {
        console.log("Error occured during roulette info parsing. error=" + err.toString())
    }
}

const checkFieldSanity = (targetElement, targetWarningElem, regex) => {
    // Afreehp Widget URL sanity check
    if (targetElement !== undefined && targetElement !== null &&
        targetElement.value !== undefined && targetElement.value !== null) {
        
        // content check
        let content = targetElement.value
        if (content && typeof(content) === "string" && content !== "") {    

            // URL check
            let matches = content.match(regex)
            if (matches && matches.length === 1) {
                // then it's valid
                hideElem(targetWarningElem)
                return true
            }
        }
    }

    showElem(targetWarningElem)
    return false
}

const validateFields = () => {
    return (
        // checkFieldSanity(afreehpUrlElem, afreehpUrlWarning, afreehpUrlRegex) && // Afreehp Widget URL sanity check
        checkFieldSanity(webappUrlElem, webappUrlWarning, webappUrlRegex) // Google Sheet webapp URL sanity check
    )
}

const populateURL = (targetElem, value) => {
    if (value && typeof(value) === "string" && value !== "") {
        targetElem.value = value
    }
}

const hideElem = (elem) => elem.style.display = 'none'
const showElem = (elem) => elem.style.display = ''
const enableElem = (elem) => elem.disabled = false
const disableElem = (elem) => elem.disabled = true
