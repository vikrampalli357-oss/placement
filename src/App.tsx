import { Chat } from './components/Chat'

export default function App() {
  return (
    <div className="shell single">
      <div className="glow" aria-hidden="true" />
      <div className="main">
        <Chat />
      </div>
    </div>
  )
}
