const cookie = window.cookie
const request = window.request
const requestPromise = util.promisify(request)

const userIdElem = document.getElementById("uid")
const nicknameElem = document.getElementById("nickname")
const selectElem = document.getElementById("roulette-option")
const warningElem = document.getElementById("result_entry_warning")
const recordButtonElem = document.getElementById("record_button")

const dataKey = "data"
const webappCookieKey = "webapp"
const webappURL = await cookie.get(webappCookieKey)

var table = null
var recordsList = []

var xhr = new XMLHttpRequest()

// ========== session IO ==========
window.onload = async () => {
	const res = sessionStorage.rewardsRes
	if (res) {
		const rewardsList = JSON.parse(res).data
		
		rewardsList.forEach((each) => {
			var option = document.createElement("option")
			option.text = each
			selectElem.add(option)
		})

		// await cookie.remove(dataKey)
		let jsonData = await cookie.get(dataKey)
		if (jsonData) {
			recordsList = JSON.parse(jsonData).records
		}

		table = new DataTable('#historyTable', {
			responsive: true,
			data: recordsList,
			order: [[0, 'desc']],
			pageLength: 50
		});

		sessionStorage.removeItem('rewardsRes')
	} else {
		window.location.replace('./index.html')
	}
}

// ========== button logics ==========
recordButtonElem.onclick = async () => {
    recordButtonElem.classList.add('is-loading')
    disableElem(recordButtonElem)
    
    // field sanity checks
    if (!validateReouletteRecord()) {
        recordButtonElem.classList.remove('is-loading')
        enableElem(recordButtonElem)
        return
    }

	const uid = userIdElem.value.trim()
	const nickname = nicknameElem.value.trim()
	const result = selectElem.value.trim()
	let now = new Date()
	let elem = [
		now.getTime() + " : " + now.toLocaleString('ko-KR', { timeZoneName: 'short' }),
		uid,
		nickname,
		result
	]
	
	table.row.add(elem).draw();
    
	// cookie the records
	recordsList = [elem, ...recordsList]
    cookie.set(dataKey, JSON.stringify({ records: recordsList }))

	await postData(userIdElem.value, nicknameElem.value, selectElem.value)

	recordButtonElem.classList.remove('is-loading')
	enableElem(recordButtonElem)
}


// ========== helpers ==========
const validateReouletteRecord = () => {
	const uid = userIdElem.value.trim()
	const reward = selectElem.value.trim()
	
	if (reward && uid !== "") {
		return true
	}

	showElem(warningElem)
	return false
}

const hideElem = (elem) => elem.style.display = 'none'
const showElem = (elem) => elem.style.display = ''
const enableElem = (elem) => elem.disabled = false
const disableElem = (elem) => elem.disabled = true

// body schema:
// {
// 	"uid": "afreehp",
// 	"nickname": "아프리카도우미",
// 	"result": "공포게임"
// }
const postData = async (uid, nickname, result) => {	
    try {
        const options = {
            redirect: "follow",
            method: "POST",
            url: webappURL,
            headers: {
				"Content-Type": "text/plain;charset=utf-8"
            },
			body: JSON.stringify({
				uid: uid,
				nickname: nickname,
				result: result
			})
        }
        let response = await requestPromise(options)
		// TODO - err/data check
        return response
    } catch (err) {
        console.log("Error occured during roulette data posting. error=" + err.toString())
    }
}