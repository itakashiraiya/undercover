import React, { useEffect, useState } from "react";

export default function UndercoverApp() {
  const DEFAULT_VIEW_SECONDS = 10;

  const WORD_PAIRS = [
    ["colher", "garfo"], ["gato", "leão"], ["caneta", "lápis"], ["praia", "deserto"], ["maçã", "pêra"],
    ["violão", "piano"], ["carro", "avião"], ["café", "chá"], ["livro", "revista"], ["ponte", "túnel"],
    ["relógio", "ampulheta"], ["chave", "cadeado"], ["sapato", "bota"], ["filme", "série"], ["árvore", "arbusto"],
    ["bola", "frisbee"], ["sorvete", "bolo"], ["lago", "rio"], ["montanha", "colina"], ["óculos", "lente"],
    ["shampoo", "sabonete"], ["trem", "bonde"], ["estrela", "planeta"], ["melancia", "abacaxi"], ["cadeira", "poltrona"],
    ["vela", "lanterna"], ["mochila", "bolsa"], ["pizza", "hambúrguer"], ["neve", "chuva"], ["computador", "tablet"], ["câmera", "microfone"]
  ];

  const STORAGE_KEYS = { names: "uc_names", config: "uc_config" };

  const [config, setConfig] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.config);
    const c = raw ? JSON.parse(raw) : { numPlayers: 6, numUndercover: 1, numBlank: 1, viewSeconds: DEFAULT_VIEW_SECONDS };
    return { ...c, numPlayersInput: c.numPlayers };
  });

  const [started, setStarted] = useState(false);
  const [pair, setPair] = useState(["", ""]);
  const [roles, setRoles] = useState([]);
  const [starter, setStarter] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [seen, setSeen] = useState([]);
  const [visible, setVisible] = useState(false);
  const [askingName, setAskingName] = useState(true);
  const [names, setNames] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.names);
    return raw ? JSON.parse(raw) : Array(config.numPlayers).fill("");
  });

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Preserve order: roles are assigned in order (first undercovers, then blanks, then civils).
  const createRoles = (numPlayers, numUndercover, numBlank) => {
    const r = [];
    for (let i = 0; i < numUndercover; i++) r.push("undercover");
    for (let i = 0; i < numBlank; i++) r.push("blank");
    while (r.length < numPlayers) r.push("civil");
    return r; // no shuffle to preserve player order
  };

  const pickPair = () => WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];

  const startRound = () => {
    let np = parseInt(config.numPlayersInput);
    if (isNaN(np)) np = 6;
    np = Math.min(12, Math.max(3, np));
    setConfig(c => ({ ...c, numPlayers: np, numPlayersInput: np }));

    const newPair = pickPair();
    const newRoles = createRoles(np, config.numUndercover, config.numBlank);

    // pick a random starter among non-blank players
    const possibleStarters = newRoles.map((r, i) => (r !== "blank" ? i : null)).filter(x => x !== null);
    const starterIdx = possibleStarters[Math.floor(Math.random() * possibleStarters.length)];

    setPair(newPair);
    setRoles(newRoles);
    setStarter(starterIdx);
    setSeen(Array(np).fill(false));
    setCurrentPlayer(starterIdx);
    setAskingName(true); // prompt the starter first
    setVisible(false);
    setStarted(true);
  };

  const newGame = (resetNames = false) => {
    if (resetNames) {
      const blankNames = Array(config.numPlayers).fill("");
      setNames(blankNames);
      localStorage.setItem(STORAGE_KEYS.names, JSON.stringify(blankNames));
    }
    setStarted(false);
    setPair(["", ""]);
    setRoles([]);
    setStarter(null);
    setCurrentPlayer(0);
    setSeen([]);
    setAskingName(true);
    localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config));
  };

  const confirmName = () => {
    if ((names[currentPlayer] || "").trim() === "") return;
    // keep the name stored but don't show it publicly; hide the input
    setAskingName(false);
  };

  const viewCard = () => {
    if (seen[currentPlayer]) return;
    setVisible(true);
  };

  const nextPlayer = () => {
    setSeen(prev => {
      const copy = [...prev];
      copy[currentPlayer] = true;
      return copy;
    });
    let idx = currentPlayer;
    for (let k = 1; k <= config.numPlayers; k++) {
      const cand = (idx + k) % config.numPlayers;
      if (!seen[cand] && cand !== currentPlayer) {
        setCurrentPlayer(cand);
        setAskingName(true);
        setVisible(false);
        return;
      }
    }
    setVisible(false);
  };

  const roleOf = (i) => roles[i];
  const cardText = (i) => {
    const r = roleOf(i);
    if (r === "civil") return pair[0];
    if (r === "undercover") return pair[1];
    return "(sem palavra)";
  };

  useEffect(() => {
    setNames(prev => {
      const copy = [...prev];
      if (copy.length < config.numPlayers) return copy.concat(Array(config.numPlayers - copy.length).fill(""));
      if (copy.length > config.numPlayers) return copy.slice(0, config.numPlayers);
      return copy;
    });
  }, [config.numPlayers]);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.names, JSON.stringify(names)); }, [names]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config)); }, [config]);

  // Do NOT display stored player names on the main screen — names are only entered privately before a player's reveal.
  const anonDisplay = (i) => `Jogador ${i + 1}`;

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 to-pink-100 flex items-center justify-center p-6">
        <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-2xl">
          <h1 className="text-3xl font-bold text-center mb-4">🎭 Undercover — Configurar partida</h1>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label>Número de jogadores</label>
              <input type="number" min={3} max={12} value={config.numPlayersInput} onChange={e => {
                const val = e.target.value;
                if (val === "") setConfig(c => ({ ...c, numPlayersInput: "" }));
                else setConfig(c => ({ ...c, numPlayersInput: Math.min(12, Math.max(3, parseInt(val))) }));
              }} className="mt-1 w-full border rounded p-2" />
            </div>
            <div>
              <label>Undercover(s)</label>
              <input type="number" min={1} max={4} value={config.numUndercover} onChange={e => setConfig(c => ({ ...c, numUndercover: Math.max(1, Math.min(4, parseInt(e.target.value) || 1)) }))} className="mt-1 w-full border rounded p-2" />
            </div>
            <div>
              <label>Branco(s)</label>
              <input type="number" min={0} max={4} value={config.numBlank} onChange={e => setConfig(c => ({ ...c, numBlank: Math.max(0, Math.min(4, parseInt(e.target.value) || 0)) }))} className="mt-1 w-full border rounded p-2" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {Array.from({ length: config.numPlayers }).map((_, i) => (
              <input key={i} placeholder={`Jogador ${i + 1}`} value={names[i] || ""} onChange={e => setNames(prev => { const c = [...prev]; c[i] = e.target.value; return c; })} className="p-2 border rounded" />
            ))}
          </div>
          <button onClick={startRound} className="w-full py-3 bg-purple-500 text-white rounded-xl">Iniciar partida 🎮</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-200 flex items-center justify-center p-4">
      <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-3xl text-center">
        {/* Always show anonymous player label to avoid revealing names */}
        <h1 className="text-2xl font-semibold mb-4">É a vez de {anonDisplay(currentPlayer)}</h1>

        {starter !== null && (
          <div className="mb-4 text-lg text-gray-600">🎲 <strong>{anonDisplay(starter)}</strong> começa a rodada!</div>
        )}

        {/* If we are asking the current player to confirm their (private) name, show the prompt */}
        {askingName ? (
          <div className="space-y-3">
            <div className="text-gray-700">Digite seu nome (visível apenas a você) e confirme.</div>
            <input placeholder={`Nome do ${anonDisplay(currentPlayer)}`} value={names[currentPlayer] || ""} onChange={e => setNames(prev => { const c = [...prev]; c[currentPlayer] = e.target.value; return c; })} className="w-full p-2 border rounded" />
            <div className="flex gap-2 justify-center">
              <button onClick={confirmName} className="py-2 px-4 bg-purple-500 text-white rounded">Confirmar</button>
              <button onClick={() => { /* skip name but keep empty */ setAskingName(false); }} className="py-2 px-4 bg-gray-200 rounded">Pular</button>
            </div>
            <div className="text-sm text-gray-500">Depois de confirmar, aproxime o dispositivo para ver sua carta.</div>
          </div>
        ) : (
          <>
            {!visible ? (
              <button onClick={viewCard} className="py-3 px-6 bg-purple-500 text-white rounded-xl">Ver minha carta</button>
            ) : (
              <>
                <div className="text-3xl font-bold mb-2">{cardText(currentPlayer)}</div>
                <button onClick={nextPlayer} className="py-3 px-6 bg-pink-500 text-white rounded-xl">Próximo jogador</button>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
