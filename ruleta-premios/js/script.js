// Elementos del DOM
const userForm = document.getElementById("user-form")
const userNameInput = document.getElementById("user-name")
const submitNameBtn = document.getElementById("submit-name")
const nameError = document.getElementById("name-error")
const changeNameContainer = document.getElementById("change-name-container")
const changeNameBtn = document.getElementById("change-name")
const playerInfo = document.getElementById("player-info")
const displayName = document.getElementById("display-name")
const alreadyPlayed = document.getElementById("already-played")
const monthlyLimitMsg = document.getElementById("monthly-limit")
const spinButton = document.getElementById("spin-button")
const winnersTable = document.getElementById("winners-table")
const winnersList = document.getElementById("winners-list")
const noWinners = document.getElementById("no-winners")
const resultModal = document.getElementById("result-modal")
const resultTitle = document.getElementById("result-title")
const resultMessage = document.getElementById("result-message")
const closeModal = document.getElementById("close-modal")
const currentMonthEl = document.getElementById("current-month")
const totalMonthEl = document.getElementById("total-month")
const progressBar = document.getElementById("progress-bar")

// Constantes
const MONTHLY_LIMIT = 100000
const USER_MONTHLY_LIMIT = 15000

// Variables globales
let theWheel
let userName = ""
let storedName = ""
let canPlay = true
let winners = []
let isSpinning = false
let monthlyTotal = 0
let userMonthlyTotal = {}
let currentMonth = ""
let currentYear = ""
let isNewUser = false

// Inicializar la ruleta
function initWheel() {
  theWheel = new Winwheel({
    numSegments: 10,
    outerRadius: 170,
    textFontSize: 16,
    textOrientation: "curved",
    textAlignment: "outer",
    textMargin: 10,
    textFontFamily: "Poppins",
    textFontWeight: "bold",
    textStrokeStyle: "white",
    textLineWidth: 3,
    textFillStyle: "white",
    drawMode: "code",
    segments: [
      { text: "1.000", fillStyle: "#EF4444" },
      { text: "2.000", fillStyle: "#3B82F6" },
      { text: "Vuelve mañana", fillStyle: "#6B7280" },
      { text: "5.000", fillStyle: "#10B981" },
      { text: "1.000", fillStyle: "#EF4444" },
      { text: "Vuelve mañana", fillStyle: "#6B7280" },
      { text: "2.000", fillStyle: "#3B82F6" },
      { text: "1.000", fillStyle: "#EF4444" },
      { text: "10.000", fillStyle: "#F59E0B" },
      { text: "5.000", fillStyle: "#10B981" },
    ],
    animation: {
      type: "spinToStop",
      duration: 5,
      spins: 8,
      callbackFinished: alertPrize,
    },
    pins: {
      number: 10,
      fillStyle: "silver",
      outerRadius: 5,
    },
  })

  // Dibujar el triángulo indicador
  drawTriangle()
}

// Dibujar el triángulo indicador
function drawTriangle() {
  const ctx = theWheel.ctx
  ctx.strokeStyle = "white"
  ctx.fillStyle = "#E5E7EB"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(170, 0)
  ctx.lineTo(190, 0)
  ctx.lineTo(180, 20)
  ctx.lineTo(170, 0)
  ctx.stroke()
  ctx.fill()
}

// Obtener el mes y año actual
function getCurrentMonthYear() {
  const date = new Date()
  const month = date.toLocaleString("es-ES", { month: "long" })
  const year = date.getFullYear()
  return {
    monthName: month.charAt(0).toUpperCase() + month.slice(1),
    month: date.getMonth(),
    year: year,
  }
}

// Cargar datos guardados
function loadSavedData() {
  // Obtener el mes y año actual
  const { monthName, month, year } = getCurrentMonthYear()
  currentMonth = monthName
  currentYear = year
  currentMonthEl.textContent = `${monthName} ${year}`

  // Cargar ganadores
  const savedWinners = localStorage.getItem("winners")
  if (savedWinners) {
    winners = JSON.parse(savedWinners)
    updateWinnersTable()
  }

  // Cargar total mensual
  const savedMonthlyData = localStorage.getItem("monthlyData")
  if (savedMonthlyData) {
    const monthlyData = JSON.parse(savedMonthlyData)

    // Si el mes guardado es diferente al actual, reiniciar los datos
    if (monthlyData.month !== month || monthlyData.year !== year) {
      monthlyTotal = 0
      userMonthlyTotal = {}

      // Guardar los nuevos datos mensuales
      saveMonthlyData(month, year)
    } else {
      monthlyTotal = monthlyData.total || 0
      userMonthlyTotal = monthlyData.userTotal || {}
    }
  } else {
    // Inicializar datos mensuales
    saveMonthlyData(month, year)
  }

  // Actualizar la interfaz con los datos mensuales
  updateMonthlyStats()

  // Verificar si el usuario ya ha jugado hoy
  const userData = localStorage.getItem("userData")
  if (userData) {
    const parsedUserData = JSON.parse(userData)
    storedName = parsedUserData.name

    const today = new Date().toISOString().split("T")[0]
    if (parsedUserData.lastPlayed === today) {
      canPlay = false
    } else {
      canPlay = true
    }

    // Verificar si puede cambiar el nombre
    if (canPlay && !hasWonThisMonth(storedName)) {
      changeNameContainer.classList.remove("hidden")
    }
  }
}

// Guardar datos mensuales
function saveMonthlyData(month, year) {
  const monthlyData = {
    month: month,
    year: year,
    total: monthlyTotal,
    userTotal: userMonthlyTotal,
  }

  localStorage.setItem("monthlyData", JSON.stringify(monthlyData))
}

// Actualizar estadísticas mensuales
function updateMonthlyStats() {
  totalMonthEl.textContent = `$${monthlyTotal.toLocaleString()}`

  // Actualizar barra de progreso
  const percentage = Math.min((monthlyTotal / MONTHLY_LIMIT) * 100, 100)
  progressBar.style.width = `${percentage}%`

  // Cambiar color según el porcentaje
  if (percentage >= 90) {
    progressBar.style.backgroundColor = "var(--red)"
  } else if (percentage >= 70) {
    progressBar.style.backgroundColor = "var(--yellow)"
  } else {
    progressBar.style.backgroundColor = "var(--primary)"
  }
}

// Verificar si el usuario ha ganado en el mes actual
function hasWonThisMonth(name) {
  const { month, year } = getCurrentMonthYear()

  return winners.some((winner) => {
    const winDate = new Date(winner.date)
    return winner.name === name && winDate.getMonth() === month && winDate.getFullYear() === year
  })
}

// Verificar si el usuario es nuevo (no ha ganado nunca)
function isUserNew(name) {
  return !winners.some((winner) => winner.name === name)
}

// Actualizar la tabla de ganadores
function updateWinnersTable() {
  if (winners.length > 0) {
    winnersTable.classList.remove("hidden")
    noWinners.classList.add("hidden")

    // Limpiar la tabla
    winnersList.innerHTML = ""

    // Agregar ganadores a la tabla (los más recientes primero)
    const sortedWinners = [...winners].reverse()
    sortedWinners.slice(0, 20).forEach((winner) => {
      const row = document.createElement("tr")

      const nameCell = document.createElement("td")
      nameCell.textContent = winner.name
      nameCell.style.fontWeight = "500"

      const prizeCell = document.createElement("td")
      prizeCell.textContent = winner.prize

      const dateCell = document.createElement("td")
      dateCell.textContent = winner.date

      row.appendChild(nameCell)
      row.appendChild(prizeCell)
      row.appendChild(dateCell)

      winnersList.appendChild(row)
    })
  } else {
    winnersTable.classList.add("hidden")
    noWinners.classList.remove("hidden")
  }
}

// Manejar el envío del nombre
function handleNameSubmit() {
  const name = userNameInput.value.trim()

  if (!name) {
    return
  }

  if (storedName && name !== storedName) {
    // Verificar si el usuario ha ganado en el mes actual
    if (hasWonThisMonth(storedName)) {
      nameError.textContent = "Es necesario que acumules los premios con un solo nombre de usuario durante todo el mes"
      nameError.innerHTML += `<p class="mt-2">Nombre registrado: <strong>${storedName}</strong></p>`
      nameError.classList.remove("hidden")
    } else {
      // Si no ha ganado este mes, permitir cambiar el nombre
      storedName = name
      const userData = {
        name: name,
        lastPlayed: "",
      }
      localStorage.setItem("userData", JSON.stringify(userData))
      showPlayerInfo()
    }
  } else {
    userName = name
    if (!storedName) {
      storedName = name
      // Verificar si es un usuario nuevo
      isNewUser = isUserNew(name)
      // Guardar el nombre del usuario
      const userData = {
        name: name,
        lastPlayed: "",
      }
      localStorage.setItem("userData", JSON.stringify(userData))
    }
    showPlayerInfo()
  }
}

// Mostrar información del jugador
function showPlayerInfo() {
  userForm.classList.add("hidden")
  playerInfo.classList.remove("hidden")
  displayName.textContent = storedName || userName

  // Verificar si el usuario ha alcanzado su límite mensual
  const userTotal = userMonthlyTotal[storedName] || 0

  if (!canPlay) {
    alreadyPlayed.classList.remove("hidden")
    monthlyLimitMsg.classList.add("hidden")
    spinButton.disabled = true
  } else if (userTotal >= USER_MONTHLY_LIMIT && monthlyTotal < MONTHLY_LIMIT) {
    alreadyPlayed.classList.add("hidden")
    monthlyLimitMsg.classList.remove("hidden")
    spinButton.disabled = true
  } else if (monthlyTotal >= MONTHLY_LIMIT && !isNewUser) {
    // Si se alcanzó el límite mensual pero no es un usuario nuevo
    alreadyPlayed.classList.add("hidden")
    monthlyLimitMsg.textContent = "Se ha alcanzado el límite mensual de $100,000. Vuelve el próximo mes."
    monthlyLimitMsg.classList.remove("hidden")
    spinButton.disabled = true
  } else {
    alreadyPlayed.classList.add("hidden")
    monthlyLimitMsg.classList.add("hidden")
    spinButton.disabled = false
  }
}

// Cambiar nombre
function handleChangeName() {
  storedName = ""
  localStorage.removeItem("userData")
  userNameInput.value = ""
  nameError.classList.add("hidden")
  changeNameContainer.classList.add("hidden")
  playerInfo.classList.add("hidden")
  userForm.classList.remove("hidden")
}

// Determinar si el usuario puede ganar un premio
function canWinPrize() {
  // Verificar si es un usuario nuevo y si se ha alcanzado el límite mensual
  if (isNewUser && monthlyTotal >= MONTHLY_LIMIT) {
    return true // Los usuarios nuevos pueden ganar una vez incluso si se alcanzó el límite
  }

  // Verificar si se ha alcanzado el límite mensual
  if (monthlyTotal >= MONTHLY_LIMIT) {
    return false
  }

  // Verificar si el usuario ha alcanzado su límite mensual
  const userTotal = userMonthlyTotal[storedName] || 0
  if (userTotal >= USER_MONTHLY_LIMIT) {
    return false
  }

  return true
}

// Girar la ruleta
function startSpin() {
  if (isSpinning || !canPlay) return

  isSpinning = true
  spinButton.disabled = true
  spinButton.textContent = "Girando..."

  // Determinar si el usuario puede ganar un premio
  const canWin = canWinPrize()

  // Generar un número aleatorio para determinar el resultado
  let stopAt

  if (!canWin) {
    // Si no puede ganar, hacer que caiga en "Vuelve mañana"
    // Los segmentos "Vuelve mañana" están en las posiciones 2 y 5 (índices 1 y 4)
    const vuelveSegments = [1, 4] // Índices de los segmentos "Vuelve mañana"
    const randomIndex = Math.floor(Math.random() * vuelveSegments.length)
    const segmentIndex = vuelveSegments[randomIndex]

    // Calcular un ángulo aleatorio dentro del segmento seleccionado
    const segmentStartAngle = theWheel.segments[segmentIndex + 1].startAngle
    const segmentEndAngle = theWheel.segments[segmentIndex + 1].endAngle
    const segmentSizeInDegrees = segmentEndAngle - segmentStartAngle
    const randomOffset = Math.random() * segmentSizeInDegrees

    stopAt = segmentStartAngle + randomOffset
  } else {
    // Si puede ganar, generar un resultado aleatorio
    stopAt = Math.floor(Math.random() * 360)
  }

  // Configurar la animación
  theWheel.animation.stopAngle = stopAt

  // Marcar que el usuario ha jugado hoy
  const today = new Date().toISOString().split("T")[0]
  const userData = {
    name: storedName || userName,
    lastPlayed: today,
  }
  localStorage.setItem("userData", JSON.stringify(userData))
  canPlay = false

  // Iniciar la animación
  theWheel.startAnimation()
}

// Extraer el valor numérico del premio
function getPrizeValue(prizeText) {
  if (prizeText === "Vuelve mañana") {
    return 0
  }

  // Extraer solo los números del texto del premio
  return Number.parseInt(prizeText.replace(/\D/g, ""))
}

// Mostrar el premio
function alertPrize(indicatedSegment) {
  isSpinning = false
  spinButton.textContent = "¡Girar la Ruleta!"

  const result = indicatedSegment.text
  const prizeValue = getPrizeValue(result)

  if (result === "Vuelve mañana") {
    resultTitle.textContent = "Hoy no ganaste"
    resultMessage.textContent = "Pero vuelve mañana, todos los días hay una oportunidad esperándote."
  } else {
    // Actualizar totales mensuales
    monthlyTotal += prizeValue
    userMonthlyTotal[storedName] = (userMonthlyTotal[storedName] || 0) + prizeValue

    // Si era un usuario nuevo, ya no lo es
    if (isNewUser) {
      isNewUser = false
    }

    // Guardar datos mensuales
    const { month, year } = getCurrentMonthYear()
    saveMonthlyData(month, year)

    // Actualizar estadísticas
    updateMonthlyStats()

    // Animación de celebración
    startConfetti()

    resultTitle.textContent = `¡Felicidades! Ganaste $${prizeValue.toLocaleString()}`
    resultMessage.textContent = "¡Vuelve mañana para seguir ganando!"

    // Guardar al ganador en la lista
    const today = new Date()
    const formattedDate = today.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    const newWinner = {
      name: storedName || userName,
      prize: `$${prizeValue.toLocaleString()}`,
      date: formattedDate,
    }

    winners.push(newWinner)
    localStorage.setItem("winners", JSON.stringify(winners))
    updateWinnersTable()
  }

  // Mostrar el modal
  resultModal.classList.remove("hidden")

  // Actualizar la interfaz
  alreadyPlayed.classList.remove("hidden")
}

// Iniciar confeti
function startConfetti() {
  // Confeti tradicional
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  })

  // Estrellas doradas
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#FFD700", "#FFC800", "#E6B800"],
      shapes: ["star"],
    })
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#FFD700", "#FFC800", "#E6B800"],
      shapes: ["star"],
    })
  }, 250)

  // Monedas de oro
  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 90,
      spread: 100,
      origin: { y: 0.6, x: 0.5 },
      colors: ["#FFD700", "#FFC800"],
      shapes: ["circle"],
      scalar: 1.5,
    })
  }, 500)
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  initWheel()
  loadSavedData()

  submitNameBtn.addEventListener("click", handleNameSubmit)
  changeNameBtn.addEventListener("click", handleChangeName)
  spinButton.addEventListener("click", startSpin)
  closeModal.addEventListener("click", () => {
    resultModal.classList.add("hidden")
  })

  // Si ya hay un nombre guardado, mostrar la información del jugador
  if (storedName) {
    showPlayerInfo()
  }
})
