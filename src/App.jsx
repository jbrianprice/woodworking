import { useState } from 'react'
import './App.css'
import WoodworkingCalculator from './woodworkingCalculator'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <WoodworkingCalculator />
    </>
  )
}

export default App
