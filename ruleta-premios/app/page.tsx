"use client"

import { useState, useEffect, useRef } from "react"
import { Wheel } from "react-custom-roulette"
import confetti from "canvas-confetti"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Definición de tipos
type Winner = {
  name: string
  prize: string
  date: string
}

type UserData = {
  name: string
  lastPlayed: string
}

export default function RuletaPage() {
  // Estado para la ruleta y el juego
  const [mustSpin, setMustSpin] = useState(false)
  const [prizeNumber, setPrizeNumber] = useState(0)
  const [winners, setWinners] = useState<Winner[]>([])
  const [userName, setUserName] = useState("")
  const [storedName, setStoredName] = useState("")
  const [canPlay, setCanPlay] = useState(false)
  const [showNameError, setShowNameError] = useState(false)
  const [nameErrorMessage, setNameErrorMessage] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [resultMessage, setResultMessage] = useState({ title: "", message: "" })
  const [isNameEntered, setIsNameEntered] = useState(false)
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Datos de la ruleta
  const data = [
    { option: "1.000", style: { backgroundColor: "#EF4444", textColor: "white" } },
    { option: "2.000", style: { backgroundColor: "#3B82F6", textColor: "white" } },
    { option: "Vuelve mañana", style: { backgroundColor: "#6B7280", textColor: "white" } },
    { option: "5.000", style: { backgroundColor: "#10B981", textColor: "white" } },
    { option: "1.000", style: { backgroundColor: "#EF4444", textColor: "white" } },
    { option: "Vuelve mañana", style: { backgroundColor: "#6B7280", textColor: "white" } },
    { option: "2.000", style: { backgroundColor: "#3B82F6", textColor: "white" } },
    { option: "1.000", style: { backgroundColor: "#EF4444", textColor: "white" } },
    { option: "10.000", style: { backgroundColor: "#F59E0B", textColor: "white" } },
    { option: "5.000", style: { backgroundColor: "#10B981", textColor: "white" } },
  ]

  // Cargar datos guardados al iniciar
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Cargar ganadores previos
      const savedWinners = localStorage.getItem("winners")
      if (savedWinners) {
        setWinners(JSON.parse(savedWinners))
      }

      // Verificar si el usuario ya ha jugado hoy
      const userData = localStorage.getItem("userData")
      if (userData) {
        const parsedUserData: UserData = JSON.parse(userData)
        setStoredName(parsedUserData.name)

        const today = new Date().toISOString().split("T")[0]
        if (parsedUserData.lastPlayed === today) {
          setCanPlay(false)
        } else {
          setCanPlay(true)
        }
      } else {
        setCanPlay(true)
      }
    }
  }, [])

  // Función para verificar si el usuario ha ganado en el mes actual
  const hasWonThisMonth = (name: string) => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    return winners.some((winner) => {
      const winDate = new Date(
        winner.date.split(" de ")[2] +
          "-" +
          getMonthNumber(winner.date.split(" de ")[1]) +
          "-" +
          winner.date.split(" de ")[0],
      )
      return winner.name === name && winDate.getMonth() === currentMonth && winDate.getFullYear() === currentYear
    })
  }

  // Función para verificar si el usuario puede cambiar su nombre
  const canChangeName = () => {
    if (!storedName) return false

    // Solo puede cambiar el nombre si puede jugar (al día siguiente)
    if (!canPlay) return false

    // Verificar si ha ganado en el mes actual
    return !hasWonThisMonth(storedName)
  }

  // Función auxiliar para convertir nombre de mes a número
  const getMonthNumber = (monthName: string) => {
    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ]
    const monthIndex = months.indexOf(monthName.toLowerCase())
    return (monthIndex + 1).toString().padStart(2, "0")
  }

  // Función para verificar el nombre del usuario
  const handleNameSubmit = () => {
    if (!userName.trim()) {
      return
    }

    if (storedName && userName !== storedName) {
      // Verificar si el usuario ha ganado en el mes actual
      if (hasWonThisMonth(storedName)) {
        setNameErrorMessage("Es necesario que acumules los premios con un solo nombre de usuario durante todo el mes")
        setShowNameError(true)
      } else {
        // Si no ha ganado este mes, permitir cambiar el nombre
        setStoredName(userName)
        const userData: UserData = {
          name: userName,
          lastPlayed: "",
        }
        localStorage.setItem("userData", JSON.stringify(userData))
        setIsNameEntered(true)
      }
    } else {
      setIsNameEntered(true)
      if (!storedName) {
        setStoredName(userName)
        // Guardar el nombre del usuario
        const userData: UserData = {
          name: userName,
          lastPlayed: "",
        }
        localStorage.setItem("userData", JSON.stringify(userData))
      }
    }
  }

  // Función para iniciar el giro de la ruleta
  const handleSpinClick = () => {
    if (!canPlay || mustSpin || !isNameEntered) return

    // Generar un número aleatorio para determinar el resultado
    const newPrizeNumber = Math.floor(Math.random() * data.length)
    setPrizeNumber(newPrizeNumber)
    setMustSpin(true)

    // Marcar que el usuario ha jugado hoy
    const today = new Date().toISOString().split("T")[0]
    const userData: UserData = {
      name: storedName || userName,
      lastPlayed: today,
    }
    localStorage.setItem("userData", JSON.stringify(userData))
    setCanPlay(false)
  }

  // Función que se ejecuta cuando la ruleta termina de girar
  const handleStopSpinning = () => {
    setMustSpin(false)

    // Determinar si el usuario ganó o perdió
    const result = data[prizeNumber].option

    if (result === "Vuelve mañana") {
      setResultMessage({
        title: "Hoy no ganaste",
        message: "Pero vuelve mañana, todos los días hay una oportunidad esperándote.",
      })
    } else {
      // Animación de celebración mejorada
      // Confeti tradicional
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      // Estrellas doradas (confeti en forma de estrella)
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

      // Monedas de oro (confeti circular dorado)
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

      setResultMessage({
        title: `¡Felicidades! Ganaste ${result}`,
        message: "¡Vuelve mañana para seguir ganando!",
      })

      // Guardar al ganador en la lista
      const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
      const newWinner: Winner = {
        name: storedName || userName,
        prize: result,
        date: today,
      }

      const updatedWinners = [...winners, newWinner]
      setWinners(updatedWinners)
      localStorage.setItem("winners", JSON.stringify(updatedWinners))
    }

    // Mostrar el resultado después de que la ruleta se detenga
    setShowResult(true)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-center mb-8">Ruleta de Premios</h1>

      {isNameEntered ? (
        <div className="text-center mb-8">
          <p className="text-xl">
            Jugando como: <strong>{storedName || userName}</strong>
          </p>
          {!canPlay && <p className="text-red-500 mt-2">Ya has jugado hoy. Vuelve mañana para otra oportunidad.</p>}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Ingresa tu nombre para jugar</h2>
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Tu nombre"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleNameSubmit}>Listo</Button>
          </div>

          {showNameError && (
            <div className="mt-4 p-4 bg-yellow-100 rounded-md">
              <p>{nameErrorMessage}</p>
              <p className="mt-2">
                Nombre registrado: <strong>{storedName}</strong>
              </p>
            </div>
          )}

          {canPlay && storedName && canChangeName() && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStoredName("")
                  localStorage.removeItem("userData")
                  setUserName("")
                  setShowNameError(false)
                }}
              >
                Cambiar nombre
              </Button>
              <p className="text-sm text-gray-500 mt-2">Puedes cambiar tu nombre porque no has ganado este mes.</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col items-center mb-12">
        <div className="mb-8 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]">
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={data}
            onStopSpinning={handleStopSpinning}
            spinDuration={0.5}
            backgroundColors={["#3e3e3e", "#df3428"]}
            textColors={["#ffffff"]}
            outerBorderColor="#f2f2f2"
            outerBorderWidth={5}
            innerBorderColor="#f2f2f2"
            innerBorderWidth={20}
            radiusLineColor="#dddddd"
            radiusLineWidth={2}
            fontSize={16}
            perpendicularText={true}
          />
        </div>

        <Button
          onClick={handleSpinClick}
          disabled={!canPlay || mustSpin || !isNameEntered}
          size="lg"
          className="px-8 py-6 text-xl"
        >
          {mustSpin ? "Girando..." : "¡Girar la Ruleta!"}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Ganadores Recientes</h2>
        {winners.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Premio</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {winners.map((winner, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{winner.name}</TableCell>
                    <TableCell>{winner.prize}</TableCell>
                    <TableCell>{winner.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">Aún no hay ganadores. ¡Sé el primero!</p>
        )}
      </div>

      {/* Diálogo de resultado */}
      <AlertDialog open={showResult} onOpenChange={setShowResult}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">{resultMessage.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">{resultMessage.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center mt-4">
            <Button onClick={() => setShowResult(false)}>Cerrar</Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
