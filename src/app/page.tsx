"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { BrowserProvider, Contract } from "ethers"
import { contractAddress, contractABI } from "../contractconfig"

type Coin = {
  id: string; 
  name: string; 
  symbol: string 
}
type Winner = {
  winningGuess: string;
  margin: string;
  actualValue?: string
  address: string
}

const DECIMALS = 1e18

export default function Home() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(false)
  const [coin, setCoin] = useState<Coin | null>(null)
  const [guess, setGuess] = useState("")
  const [winner, setWinner] = useState<Winner | null>(null)
  const [error, setError] = useState<string>()
  const timer = useRef<NodeJS.Timeout>()

  // Conneting the user's wallet and MetaMask account
  const getContract = async () => {
    const provider = new BrowserProvider((window as any).ethereum, "any") // Connects to metamask
    await provider.send("eth_requestAccounts", []) // requests permission for use
    const signer = await provider.getSigner() // Fetches signer to sign transactions in the smart contract (write only)
    return new Contract(contractAddress, contractABI, signer) // creates a smart contract instance for SimpleCoinGuessGame
  }

  // fetches a random coin from coingecko
  const fetchCoins = () =>
    fetch("https://api.coingecko.com/api/v3/coins/list")
      .then((r) => r.json())
      .then(setCoins)
      .catch((e) => setError(e.message))

  // fecthes the price of the radom fetched coin from coingecko
  const fetchPrice = (id: string) =>
    fetch(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&market_data=true`)
      .then((r) => r.json())
      .then((c) => parseFloat(c.market_data.current_price.usd))

  // saftey net handle function
  const handle = async (fn: () => Promise<void>) => {
    setError(undefined)
    setLoading(true)
    try {
      await fn()
    } catch (e: any) {
      setError(e.message || String(e))
      setActive(false)
    } finally {
      setLoading(false)
    }
  }

  // fetch coins on mount
  useEffect(() => {
    fetchCoins()
  }, [])

  // Listen on the timer dependency, set 10s timer if game is active
  useEffect(() => {
    if (active) {
      timer.current = setTimeout(() => endGame(), 15_000)
    }
    return () => clearTimeout(timer.current)
  }, [active])

  const startGame = useCallback(() => {
    if (!coins.length) return
    handle(async () => {
      setWinner(null)
      const pick = coins[Math.floor(Math.random() * coins.length)] // Picks a random coin from the coingecko list
      setCoin(pick)
      const price = await fetchPrice(pick.id)
      const c = await getContract() // re-establishing the connection to the already-deployed contract on-chain.
      await (await c.startGame(BigInt(price * DECIMALS))).wait()
      setActive(true)
    })
  }, [coins])

  const submitGuess = useCallback(() => {
    const val = parseFloat(guess)
    if (isNaN(val) || val < 0) return setError("Invalid guess")
    handle(async () => {
      const c = await getContract()
      await (await c.submitGuess(BigInt(val * DECIMALS))).wait() // .wait ensures the tx was mined on the chain

    })
  }, [guess])

  const endGame = useCallback(() => {
    if (!active) return
    handle(async () => {
      clearTimeout(timer.current!)
      const c = await getContract()
      await (await c.endGame()).wait()
      const [g, m, a, w] = await c.getWinner()
      setWinner({
        winningGuess: (Number(g) / DECIMALS).toFixed(6),
        margin: (Number(m) / DECIMALS).toFixed(6),
        actualValue: (Number(a) / DECIMALS).toFixed(6),
        address: w
      })
      setActive(false)
    })
  }, [active])

   
  const reset = async () => {
    setLoading(true)
    setError(undefined)
    try {
      const c = await getContract()
      const activeOnChain = await c.active()
      if (activeOnChain) {
        await (await c.endGame()).wait()
      }
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setActive(false)
      setWinner(null)
      setCoin(null)
      setGuess("")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Coin Price Guesser</h1>

      {!active && !winner && (
        <button
          className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          onClick={startGame}
          disabled={loading}
        >
          {loading ? "Starting…" : "Start Game"}
        </button>
      )}

      {active && coin && (
        <div className="p-4 border rounded space-y-3">
          <div>
            Guess the USD price of <strong>{coin.name}</strong>
          </div>
          <input
            type="number"
            min="0"
            step="0.000001"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading}
          />
          <button
            className="w-full py-2 bg-green-600 text-white rounded disabled:opacity-50"
            onClick={submitGuess}
            disabled={loading || !guess}
          >
            {loading ? "Submitting…" : "Submit Guess"}
          </button>
          <p className="text-sm text-gray-500 text-center">Ends in ~15s</p>
        </div>
      )}

      {winner && coin && (
        <div className="p-4 bg-white text-black border border-black rounded space-y-2">
          <div className="font-medium">Actual Price$ ({coin.name}): <span className="font-mono">${winner.actualValue}</span></div>
          <div className="font-medium">Winning Guess: <span className="font-mono">${winner.winningGuess}</span></div>
          <div className="font-medium">Margin: <span className="font-mono">${winner.margin}</span></div>
          <div className="font-medium">Winners Address: <span className="font-mono">{winner.address}</span></div>
          <button
            className="w-full py-2 mt-2 bg-black text-white rounded disabled:opacity-50"
            onClick={startGame}
            disabled={loading}
          >
            Play Again
          </button>
        </div>
      )}

      <button
        className="w-full py-2 bg-red-600 text-white rounded disabled:opacity-50"
        onClick={reset}
        disabled={loading}
      >
        Reset State
      </button>
    </div>
  )
}
