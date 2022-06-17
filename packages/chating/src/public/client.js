// @ts-check

;(() => {
  const socket = new WebSocket(`ws://${window.location.host}/ws`)
  const formEl = document.getElementById('form')
  const chatsEL = document.getElementById('chats')
  /** @type {HTMLInputElement | null} */
  // @ts-ignore
  const inputEL = document.getElementById('input')

  if (!formEl || !inputEL || !chatsEL) {
    throw new Error('Init failed!')
  }

  /**
   * @typedef Chat
   * @property {string} nickname
   * @property {string} message
   */

  /**
   * @type {Chat []}
   */
  const chats = []

  const adjectives = ['멋진', '훌륭한', '친절한', '새침한']
  const animals = ['물범', '사자', '사슴', '돌고래', '독수리']

  /**
   * @param {string[]} array
   * @returns {string}
   */
  function pickRandom(array) {
    const randomIndex = Math.floor(Math.random() * array.length)
    const result = array[randomIndex]
    if (!result) {
      throw new Error('array length is 0.')
    }

    return result
  }

  const myNickname = `${pickRandom(adjectives)} ${pickRandom(animals)}`

  formEl.addEventListener('submit', (event) => {
    event.preventDefault()
    socket.send(
      JSON.stringify({
        nickname: myNickname,
        message: inputEL.value,
      })
    )
    inputEL.value = ''
  })

  socket.addEventListener('message', (event) => {
    chats.push(JSON.parse(event.data))

    chatsEL.innerHTML = ''

    chats.forEach(({ message, nickname }) => {
      const div = document.createElement('div')
      div.innerText = `${nickname}: ${message}`
      chatsEL.appendChild(div)
    })
  })
})()
