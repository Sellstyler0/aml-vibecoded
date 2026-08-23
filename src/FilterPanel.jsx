export default function FilterPanel({ filters, defaultOpen = true, actions = null }) {
  const {
    topMin,
    setTopMin,
    topMax,
    setTopMax,
    topBounds,
    pool,
    modeType,
    setModeType,
    addedModes,
    clearModes,
    addQuery,
    setAddQuery,
    addMode,
    removeMode,
    addSuggestions,
    gameType,
    setGameType,
    addedGames,
    clearGames,
    addGameQuery,
    setAddGameQuery,
    addGame,
    removeGame,
    gameSuggestions,
    gameCounts,
  } = filters

  return (
    <div className="game-settings">
      <details open={defaultOpen} className="settings-details">
        <summary className="settings-toggle">Mode selection</summary>
        <div className="game-settings-body">
          <div className="settings-row">
            <label className="settings-field">
              <span>Top range</span>
              <div className="settings-range">
                <input
                  type="number"
                  min="1"
                  value={topMin}
                  onChange={(e) => setTopMin(e.target.value)}
                  placeholder={String(topBounds.min)}
                  aria-label="Minimum rank"
                />
                <span className="settings-sep">–</span>
                <input
                  type="number"
                  min="1"
                  value={topMax}
                  onChange={(e) => setTopMax(e.target.value)}
                  placeholder={String(topBounds.max)}
                  aria-label="Maximum rank"
                />
              </div>
            </label>
            <label className="settings-field">
              <span>Mode filter</span>
              <select
                className="settings-select"
                value={modeType}
                onChange={(e) => setModeType(e.target.value)}
              >
                <option value="all">All modes</option>
                <option value="whitelist">Whitelist</option>
                <option value="blacklist">Blacklist</option>
              </select>
            </label>
            <label className="settings-field">
              <span>Game filter</span>
              <select
                className="settings-select"
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
              >
                <option value="all">All games</option>
                <option value="whitelist">Whitelist</option>
                <option value="blacklist">Blacklist</option>
              </select>
            </label>
          </div>

          {modeType !== 'all' && (
            <div className="settings-field settings-add-field">
              <span>
                {modeType === 'whitelist'
                  ? 'Only these modes'
                  : 'Exclude these modes'}
              </span>
              <div className="settings-add">
                <input
                  type="text"
                  value={addQuery}
                  onChange={(e) => setAddQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && addSuggestions.length > 0) {
                      e.preventDefault()
                      addMode(addSuggestions[0])
                    }
                  }}
                  placeholder={`Add a mode to the ${modeType}…`}
                  autoComplete="off"
                  spellCheck="false"
                />
                {addSuggestions.length > 0 && (
                  <ul className="settings-suggestions">
                    {addSuggestions.map((entry) => (
                      <li
                        key={entry.id}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          addMode(entry)
                        }}
                      >
                        <span className="suggestion-name">{entry.name}</span>
                        <span className="suggestion-game">#{entry.top}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {addedModes.length > 0 ? (
                <ul className="settings-chips">
                  {addedModes.map((mode) => (
                    <li key={mode.id} className="settings-chip">
                      <span className="suggestion-name">
                        {mode.name}
                        <span className="chip-rank">#{mode.top}</span>
                      </span>
                      <button
                        className="chip-remove"
                        onClick={() => removeMode(mode.id)}
                        aria-label={`Remove ${mode.name}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="settings-hint">No modes added yet.</p>
              )}
            </div>
          )}

          {gameType !== 'all' && (
            <div className="settings-field settings-add-field">
              <span>
                {gameType === 'whitelist'
                  ? 'Only these games'
                  : 'Exclude these games'}
              </span>
              <div className="settings-add">
                <input
                  type="text"
                  value={addGameQuery}
                  onChange={(e) => setAddGameQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && gameSuggestions.length > 0) {
                      e.preventDefault()
                      addGame(gameSuggestions[0])
                    }
                  }}
                  placeholder={`Add a game to the ${gameType}…`}
                  autoComplete="off"
                  spellCheck="false"
                />
                {gameSuggestions.length > 0 && (
                  <ul className="settings-suggestions">
                    {gameSuggestions.map((game) => (
                      <li
                        key={game}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          addGame(game)
                        }}
                      >
                        <span className="suggestion-name">{game}</span>
                        <span className="suggestion-game">
                          {gameCounts.get(game)} modes
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {addedGames.length > 0 ? (
                <ul className="settings-chips">
                  {addedGames.map((game) => (
                    <li key={game} className="settings-chip">
                      <span className="suggestion-name">
                        {game}
                        <span className="chip-rank">
                          {gameCounts.get(game)} modes
                        </span>
                      </span>
                      <button
                        className="chip-remove"
                        onClick={() => removeGame(game)}
                        aria-label={`Remove ${game}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="settings-hint">No games added yet.</p>
              )}
            </div>
          )}

          <div className="settings-footer">
            <p className="settings-info">
              Pool: {pool.length} mode{pool.length === 1 ? '' : 's'}
            </p>
            <div className="settings-actions">
              {actions}
              {addedModes.length > 0 && (
                <button className="settings-clear" onClick={clearModes}>
                  Clear modes
                </button>
              )}
              {addedGames.length > 0 && (
                <button className="settings-clear" onClick={clearGames}>
                  Clear games
                </button>
              )}
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}
