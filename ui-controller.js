class UIController {
    constructor(game) {
        this.game = game;
        this.selectedCell = null;
        this.targetCell = null;
        
        // UI elements
        this.gameBoardElement = document.getElementById('gameBoard');
        this.currentFactionColorElement = document.getElementById('currentFactionColor');
        this.currentFactionNameElement = document.getElementById('currentFactionName');
        this.foodAmountElement = document.getElementById('foodAmount');
        this.materialAmountElement = document.getElementById('materialAmount');
        this.goldAmountElement = document.getElementById('goldAmount');
        this.populationAmountElement = document.getElementById('populationAmount');
        this.turnCounterElement = document.getElementById('turnCounter');
        this.messagesElement = document.getElementById('messages');
        this.messageLogElement = document.getElementById('messageLog');
        this.toggleLogBtn = document.getElementById('toggleLogBtn');
        
        // Popup elements
        this.cellPopupElement = document.getElementById('cellPopup');
        this.popupTitleElement = document.getElementById('popupTitle');
        this.cellDetailsElement = document.getElementById('cellDetails');
        this.actionButtonsElement = document.getElementById('actionButtons');
        this.closePopupButton = document.getElementById('closePopup');
        
        this.setupEventListeners();
        this.createGrid();
        this.updateUI();
    }
    
    createGrid() {
        this.gameBoardElement.innerHTML = '';
        this.gameBoardElement.style.gridTemplateColumns = `repeat(${this.game.grid.size}, 1fr)`;
        this.gameBoardElement.style.gridTemplateRows = `repeat(${this.game.grid.size}, 1fr)`;
        
        for (const cell of this.game.grid.cells) {
            const cellElement = document.createElement('div');
            cellElement.className = 'cell';
            cellElement.dataset.x = cell.x;
            cellElement.dataset.y = cell.y;
            
            cell.element = cellElement;
            cell.updateElement();
            
            this.gameBoardElement.appendChild(cellElement);
        }
    }
    
    setupEventListeners() {
        // Cell selection
        this.gameBoardElement.addEventListener('click', (e) => {
            const cellElement = e.target.closest('.cell');
            if (!cellElement) return;
            
            const x = parseInt(cellElement.dataset.x);
            const y = parseInt(cellElement.dataset.y);
            const cell = this.game.grid.getCell(x, y);
            
            this.handleCellSelection(cell);
        });
        
        // Close popup button
        this.closePopupButton.addEventListener('click', () => {
            this.cellPopupElement.style.display = 'none';
        });
        
        // Outside popup click closes popup
        this.cellPopupElement.addEventListener('click', (e) => {
            if (e.target === this.cellPopupElement) {
                this.cellPopupElement.style.display = 'none';
            }
        });
        
        // Toggle log
        this.toggleLogBtn.addEventListener('click', () => {
            this.messageLogElement.classList.toggle('collapsed');
            this.toggleLogBtn.textContent = this.messageLogElement.classList.contains('collapsed') ? '▼' : '▲';
        });
    }
    
    getResourceIcon(type) {
        switch(type) {
            case 'food': return '🍎';
            case 'materials': return '🧱';
            case 'gold': return '💰';
            default: return '⚖️'; // balanced
        }
    }

    handleCellSelection(cell) {
        // Deselect previous cells
        if (this.selectedCell) {
            this.selectedCell.element.classList.remove('cell-selected');
        }
        
        // If selecting a cell owned by current faction
        if (cell.ownerId === this.game.getCurrentFaction().id) {
            this.selectedCell = cell;
            this.targetCell = null;
            cell.element.classList.add('cell-selected');
            this.showCellActionPopup(cell);
        } 
        // If selecting a target cell while having a selected cell
        else if (this.selectedCell) {
            const adjacentCells = this.game.grid.getAdjacentCells(this.selectedCell);
            if (adjacentCells.includes(cell)) {
                this.targetCell = cell;
                this.showAttackPopup(this.selectedCell, cell);
            } else {
                this.addMessage("You can only attack adjacent cells.");
            }
        } else {
            // Show info about non-owned cell
            this.showCellInfoPopup(cell);
        }
    }
    
    showCellActionPopup(cell) {
        const currentFaction = this.game.getCurrentFaction();
        const hasActions = currentFaction.actionsRemaining > 0;
        
        this.popupTitleElement.textContent = `Your Cell (${cell.x}, ${cell.y})`;
        
        // Cell details
        let resourceType = "Balanced";
        if (cell.resourceType === 'food') resourceType = "Food";
        if (cell.resourceType === 'materials') resourceType = "Materials";
        if (cell.resourceType === 'gold') resourceType = "Gold";
        
        this.cellDetailsElement.innerHTML = `
            <p><strong>👥 Population:</strong> ${cell.population}/${cell.populationCapacity}</p>
            <p><strong>⚔️ Troops:</strong> ${cell.troops}</p>
            <p><strong>🛡️ Fortification:</strong> ${cell.fortification}</p>
            <p><strong>${this.getResourceIcon(cell.resourceType)} Resource Type:</strong> ${resourceType} (Level ${cell.resourceLevel})</p>
            <p><strong>⚡ Actions Remaining:</strong> ${currentFaction.actionsRemaining}</p>
        `;
        
        // Action buttons
        this.actionButtonsElement.innerHTML = '';
        
        const canAffordRecruit = currentFaction.resources.food >= 10 && cell.population > 0;
        const canAffordUpgrade = currentFaction.resources.materials >= 10;
        const canAffordFortify = currentFaction.resources.materials >= 15;
        
        const recruitBtn = this.createActionButton(
            'Recruit Troops (10 Food)', 
            !hasActions || !canAffordRecruit,
            () => this.handleRecruit()
        );
        
        const upgradeFoodBtn = this.createActionButton(
            'Upgrade Food (10 Materials)', 
            !hasActions || !canAffordUpgrade,
            () => this.handleUpgradeResource('food')
        );
        
        const upgradeMaterialsBtn = this.createActionButton(
            'Upgrade Materials (10 Materials)', 
            !hasActions || !canAffordUpgrade,
            () => this.handleUpgradeResource('materials')
        );
        
        const upgradeGoldBtn = this.createActionButton(
            'Upgrade Gold (10 Materials)', 
            !hasActions || !canAffordUpgrade,
            () => this.handleUpgradeResource('gold')
        );
        
        const fortifyBtn = this.createActionButton(
            'Fortify (15 Materials)', 
            !hasActions || !canAffordFortify,
            () => this.handleFortify()
        );
        
        this.actionButtonsElement.appendChild(recruitBtn);
        this.actionButtonsElement.appendChild(upgradeFoodBtn);
        this.actionButtonsElement.appendChild(upgradeMaterialsBtn);
        this.actionButtonsElement.appendChild(upgradeGoldBtn);
        this.actionButtonsElement.appendChild(fortifyBtn);
        
        const endTurnBtn = document.createElement('button');
        endTurnBtn.className = 'action-button end-turn-button';
        endTurnBtn.style.backgroundColor = '#4caf50'; // Force green color
        endTurnBtn.textContent = 'End Turn';
        endTurnBtn.addEventListener('click', () => {
            this.handleEndTurn();
            this.cellPopupElement.style.display = 'none';
        });
        
        // Add some spacing before the end turn button
        const divider = document.createElement('div');
        divider.style.margin = '10px 0';
        divider.style.borderBottom = '1px solid #eee';
        this.actionButtonsElement.appendChild(divider);
        this.actionButtonsElement.appendChild(endTurnBtn);
        
        // Show popup
        this.cellPopupElement.style.display = 'flex';
    }
    
    showAttackPopup(fromCell, toCell) {
        const currentFaction = this.game.getCurrentFaction();
        const hasActions = currentFaction.actionsRemaining > 0;
        
        this.popupTitleElement.textContent = 'Attack Cell';
        
        // Cell details
        let targetOwner = "Neutral";
        if (toCell.ownerId >= 0) {
            targetOwner = `Faction ${toCell.ownerId + 1}`;
        }
        
        this.cellDetailsElement.innerHTML = `
            <p><strong>From:</strong> Cell (${fromCell.x}, ${fromCell.y}) with ${fromCell.troops} troops</p>
            <p><strong>To:</strong> Cell (${toCell.x}, ${toCell.y})</p>
            <p><strong>Target Owner:</strong> ${targetOwner}</p>
            <p><strong>Target Troops:</strong> ${toCell.troops}</p>
            <p><strong>Target Fortification:</strong> ${toCell.fortification}</p>
            <p><strong>Actions Remaining:</strong> ${currentFaction.actionsRemaining}</p>
        `;
        
        // Action buttons
        this.actionButtonsElement.innerHTML = '';
        
        const canAttack = fromCell.troops > 0 && hasActions;
        
        const attackBtn = this.createActionButton(
            'Attack Cell', 
            !canAttack,
            () => this.handleAttack()
        );
        
        attackBtn.classList.add('attack-target');
        this.actionButtonsElement.appendChild(attackBtn);
        
        // Show popup
        this.cellPopupElement.style.display = 'flex';
    }
    
    showCellInfoPopup(cell) {
        let owner = "Neutral";
        if (cell.ownerId >= 0) {
            owner = `Faction ${cell.ownerId + 1}`;
        }
        
        this.popupTitleElement.textContent = `Cell Info (${cell.x}, ${cell.y})`;
        
        // Cell details
        let resourceType = "Balanced";
        if (cell.resourceType === 'food') resourceType = "Food";
        if (cell.resourceType === 'materials') resourceType = "Materials";
        if (cell.resourceType === 'gold') resourceType = "Gold";
        
        this.cellDetailsElement.innerHTML = `
            <p><strong>Owner:</strong> ${owner}</p>
            <p><strong>Population:</strong> ${cell.population}/${cell.populationCapacity}</p>
            <p><strong>Troops:</strong> ${cell.troops}</p>
            <p><strong>Fortification:</strong> ${cell.fortification}</p>
            <p><strong>Resource Type:</strong> ${resourceType} (Level ${cell.resourceLevel})</p>
        `;
        
        // No action buttons for enemy/neutral cell
        this.actionButtonsElement.innerHTML = '';
        
        // Show popup
        this.cellPopupElement.style.display = 'flex';
    }
    
    createActionButton(text, disabled, clickHandler) {
        const button = document.createElement('button');
        button.className = 'action-button';
        button.textContent = text;
        button.disabled = disabled;
        
        if (!disabled) {
            button.addEventListener('click', () => {
                clickHandler();
                this.cellPopupElement.style.display = 'none';
            });
        }
        
        return button;
    }
    
    handleRecruit() {
        if (!this.selectedCell || !this.game.getCurrentFaction().useAction()) return;
        
        const cost = { food: 10, materials: 0, gold: 0 };
        if (!this.game.getCurrentFaction().pay(cost)) {
            this.addMessage("Not enough resources to recruit troops.");
            return;
        }
        
        const troopsRecruited = this.selectedCell.recruitTroops(5);
        this.addMessage(`Recruited ${troopsRecruited} troops in cell (${this.selectedCell.x}, ${this.selectedCell.y}).`);
        this.updateUI();
    }
    
    handleUpgradeResource(type) {
        if (!this.selectedCell || !this.game.getCurrentFaction().useAction()) return;
        
        const cost = { food: 0, materials: 10, gold: 0 };
        if (!this.game.getCurrentFaction().pay(cost)) {
            this.addMessage("Not enough resources to upgrade.");
            return;
        }
        
        this.selectedCell.upgradeResource(type);
        this.addMessage(`Upgraded cell (${this.selectedCell.x}, ${this.selectedCell.y}) to produce more ${type}.`);
        this.updateUI();
    }
    
    handleFortify() {
        if (!this.selectedCell || !this.game.getCurrentFaction().useAction()) return;
        
        const cost = { food: 0, materials: 15, gold: 0 };
        if (!this.game.getCurrentFaction().pay(cost)) {
            this.addMessage("Not enough resources to fortify.");
            return;
        }
        
        this.selectedCell.upgradeFortification();
        this.addMessage(`Fortified cell (${this.selectedCell.x}, ${this.selectedCell.y}).`);
        this.updateUI();
    }
    
    handleAttack() {
        if (!this.selectedCell || !this.targetCell || this.selectedCell.troops === 0 || !this.game.getCurrentFaction().useAction()) return;
        
        const result = CombatSystem.resolveAttack(this.selectedCell, this.targetCell);
        
        // Update troops
        this.selectedCell.troops -= result.attackerLosses;
        this.targetCell.troops -= result.defenderLosses;
        
        // Handle conquest
        if (result.attackerWins) {
            const previousOwner = this.targetCell.ownerId;
            this.targetCell.ownerId = this.game.getCurrentFaction().id;
            this.targetCell.troops = result.attackerRemaining;
            this.selectedCell.troops = 0;
            
            this.addMessage(`Conquered cell (${this.targetCell.x}, ${this.targetCell.y}) from ${previousOwner >= 0 ? `Faction ${previousOwner + 1}` : 'Neutral'}.`);
        } else {
            this.addMessage(`Attack on cell (${this.targetCell.x}, ${this.targetCell.y}) failed.`);
        }
        
        this.targetCell.updateElement();
        this.selectedCell.updateElement();
        this.targetCell = null;
        this.updateUI();
    }
    
    handleEndTurn() {
        const turnInfo = this.game.nextTurn();
        
        if (turnInfo.gameOver) {
            alert(`Game over! ${turnInfo.winner.name} has won!`);
            // You might want to reset the game or show a game over screen
        } else {
            this.addMessage(`Turn ${turnInfo.turn} - ${turnInfo.faction.name}'s turn.`);
            this.selectedCell = null;
            this.targetCell = null;
            this.updateUI();
            
            // Show turn start popup
            this.showTurnStartPopup();
        }
    }
    
    showTurnStartPopup() {
        const currentFaction = this.game.getCurrentFaction();
        const totalCells = this.game.grid.getCellsByFaction(currentFaction.id).length;
        const totalTroops = currentFaction.getTotalTroops(this.game.grid);
        const totalPopulation = currentFaction.getTotalPopulation(this.game.grid);
        
        // Create popup overlay
        const popupOverlay = document.createElement('div');
        popupOverlay.className = 'popup-overlay';
        popupOverlay.style.display = 'flex';
        
        // Create popup content
        const popup = document.createElement('div');
        popup.className = 'popup turn-start-popup';
        
        // Create header with faction color
        const header = document.createElement('div');
        header.className = 'popup-header';
        header.innerHTML = `
            <div class="popup-title">
                <div class="faction-color" style="background-color: ${currentFaction.color}; display: inline-block; margin-right: 10px;"></div>
                ${currentFaction.name}'s Turn
            </div>
        `;
        
        // Create content
        const content = document.createElement('div');
        content.className = 'turn-start-content';
        content.innerHTML = `
            <h3>Turn ${this.game.gameState.turn}</h3>
            <div class="turn-summary">
                <p><strong>⚡ Actions Available:</strong> ${currentFaction.actionsRemaining}</p>
                <p><strong>🏙️ Territories:</strong> ${totalCells}</p>
                <p><strong>⚔️ Total Troops:</strong> ${totalTroops}</p>
                <p><strong>👥 Total Population:</strong> ${totalPopulation}</p>
                <h4>Resources:</h4>
                <p>🍎 Food: ${currentFaction.resources.food}</p>
                <p>🧱 Materials: ${currentFaction.resources.materials}</p>
                <p>💰 Gold: ${currentFaction.resources.gold}</p>
            </div>
        `;
        
        // Create start button
        const startButton = document.createElement('button');
        startButton.className = 'action-button end-turn-button';
        startButton.textContent = 'Start Turn';
        startButton.style.backgroundColor = '#4caf50';
        startButton.addEventListener('click', () => {
            document.body.removeChild(popupOverlay);
        });
        
        // Assemble popup
        popup.appendChild(header);
        popup.appendChild(content);
        popup.appendChild(startButton);
        popupOverlay.appendChild(popup);
        
        // Add to DOM
        document.body.appendChild(popupOverlay);
    }
    
    updateUI() {
        const currentFaction = this.game.getCurrentFaction();
        
        // Update faction info
        this.currentFactionColorElement.style.backgroundColor = currentFaction.color;
        this.currentFactionNameElement.textContent = currentFaction.name;
        
        // Update resource display
        this.foodAmountElement.textContent = currentFaction.resources.food;
        this.materialAmountElement.textContent = currentFaction.resources.materials;
        this.goldAmountElement.textContent = currentFaction.resources.gold;
        this.populationAmountElement.textContent = currentFaction.getTotalPopulation(this.game.grid);
        
        // Update turn counter
        this.turnCounterElement.textContent = this.game.turn;
    }
    
    addMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.textContent = message;
        this.messagesElement.appendChild(messageElement);
        this.messagesElement.scrollTop = this.messagesElement.scrollHeight;
        
        // Show log if it's collapsed
        this.messageLogElement.classList.remove('collapsed');
        this.toggleLogBtn.textContent = '▲';
    }

    handleAttack() {
        if (!this.selectedCell || !this.targetCell || this.selectedCell.troops === 0 || !this.game.getCurrentFaction().useAction()) return;
        
        // Instead of immediately resolving combat, show battle visualization
        this.showBattleVisualization(this.selectedCell, this.targetCell);
    }
    
    showBattleVisualization(attackingCell, defendingCell) {
        const attacker = {
            faction: this.game.factions[attackingCell.ownerId],
            troops: attackingCell.troops,
            cell: attackingCell
        };
        
        const defender = {
            faction: defendingCell.ownerId >= 0 ? this.game.factions[defendingCell.ownerId] : { name: "Neutral", color: "#999" },
            troops: defendingCell.troops,
            fortification: defendingCell.fortification,
            cell: defendingCell
        };
        
        // Pre-calculate combat result (to be used later)
        const combatResult = CombatSystem.resolveAttack(attackingCell, defendingCell);
        
        // Create battle popup
        const battleOverlay = document.createElement('div');
        battleOverlay.className = 'popup-overlay battle-overlay';
        battleOverlay.style.display = 'flex';
        
        const battlePopup = document.createElement('div');
        battlePopup.className = 'popup battle-popup';
        
        // Create battle scene
        const battleScene = document.createElement('div');
        battleScene.className = 'battle-scene';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'battle-header';
        header.innerHTML = `
            <div class="battle-faction" style="background-color: ${attacker.faction.color}">
                ${attacker.faction.name}: ${attacker.troops} Troops
            </div>
            <div class="battle-vs">VS</div>
            <div class="battle-faction" style="background-color: ${defender.faction.color}">
                ${defender.faction.name}: ${defender.troops} Troops${defender.fortification > 0 ? ` + ${defender.fortification} Fortifications` : ''}
            </div>
        `;
        
        // Create battlefield
        const battlefield = document.createElement('div');
        battlefield.className = 'battlefield';
        
        // Create armies
        const attackerArmy = document.createElement('div');
        attackerArmy.className = 'army attacker-army';
        
        const defenderArmy = document.createElement('div');
        defenderArmy.className = 'army defender-army';
        
        // Add soldiers to armies
        for (let i = 0; i < attacker.troops; i++) {
            const soldier = document.createElement('div');
            soldier.className = 'soldier attacker-soldier';
            soldier.style.backgroundColor = attacker.faction.color;
            soldier.style.animationDelay = `${Math.random() * 2}s`;
            attackerArmy.appendChild(soldier);
        }
        
        // Add defenders + fortification
        const totalDefense = defender.troops + defender.fortification;
        for (let i = 0; i < totalDefense; i++) {
            const soldier = document.createElement('div');
            // Different style for fortifications
            if (i >= defender.troops) {
                soldier.className = 'soldier defender-soldier fortification';
                soldier.innerHTML = '🛡️';
            } else {
                soldier.className = 'soldier defender-soldier';
                soldier.style.backgroundColor = defender.faction.color;
            }
            soldier.style.animationDelay = `${Math.random() * 2}s`;
            defenderArmy.appendChild(soldier);
        }
        
        battlefield.appendChild(attackerArmy);
        battlefield.appendChild(defenderArmy);
        
        // Status text
        const battleStatus = document.createElement('div');
        battleStatus.className = 'battle-status';
        battleStatus.textContent = 'Battle in progress...';
        
        // Skip button
        const skipButton = document.createElement('button');
        skipButton.className = 'action-button';
        skipButton.textContent = 'Skip Animation';
        skipButton.addEventListener('click', () => endBattle());
        
        // Assemble battle popup
        battleScene.appendChild(header);
        battleScene.appendChild(battlefield);
        battleScene.appendChild(battleStatus);
        battleScene.appendChild(skipButton);
        battlePopup.appendChild(battleScene);
        battleOverlay.appendChild(battlePopup);
        document.body.appendChild(battleOverlay);
        
        // Animate the battle
        let battleTime = 0;
        let attackerCasualties = 0;
        let defenderCasualties = 0;
        const totalAttackerCasualties = combatResult.attackerLosses;
        const totalDefenderCasualties = combatResult.defenderLosses;
        const battleDuration = 10000; // 10 seconds for full battle
        
        // Create clash effect
        setTimeout(() => {
            battlefield.classList.add('battle-clash');
            
            // Battle tick - remove soldiers gradually
            const battleInterval = setInterval(() => {
                battleTime += 100;
                
                // Update casualty count based on time progression
                const battleProgress = battleTime / battleDuration;
                const newAttackerCasualties = Math.floor(totalAttackerCasualties * battleProgress);
                const newDefenderCasualties = Math.floor(totalDefenderCasualties * battleProgress);
                
                // Remove attacker soldiers
                while (attackerCasualties < newAttackerCasualties && attackerArmy.childNodes.length > 0) {
                    const randomIndex = Math.floor(Math.random() * attackerArmy.childNodes.length);
                    const soldierToRemove = attackerArmy.childNodes[randomIndex];
                    soldierToRemove.classList.add('casualty');
                    setTimeout(() => {
                        if (soldierToRemove.parentNode) {
                            soldierToRemove.parentNode.removeChild(soldierToRemove);
                        }
                    }, 500);
                    attackerCasualties++;
                }
                
                // Remove defender soldiers
                while (defenderCasualties < newDefenderCasualties && defenderArmy.childNodes.length > 0) {
                    const randomIndex = Math.floor(Math.random() * defenderArmy.childNodes.length);
                    const soldierToRemove = defenderArmy.childNodes[randomIndex];
                    soldierToRemove.classList.add('casualty');
                    setTimeout(() => {
                        if (soldierToRemove.parentNode) {
                            soldierToRemove.parentNode.removeChild(soldierToRemove);
                        }
                    }, 500);
                    defenderCasualties++;
                }
                
                // Update battle status
                battleStatus.textContent = `Attacker: ${attacker.troops - attackerCasualties} troops | Defender: ${defender.troops - defenderCasualties} troops`;
                
                // End battle if time is up
                if (battleTime >= battleDuration) {
                    clearInterval(battleInterval);
                    setTimeout(() => endBattle(), 1000);
                }
            }, 100);
        }, 1000);
        
        // Function to end battle and apply results
        const endBattle = () => {
            // Apply combat results to the actual game
            attackingCell.troops -= combatResult.attackerLosses;
            defendingCell.troops -= combatResult.defenderLosses;
            
            // Handle conquest
            if (combatResult.attackerWins) {
                const previousOwner = defendingCell.ownerId;
                defendingCell.ownerId = this.game.getCurrentFaction().id;
                defendingCell.troops = combatResult.attackerRemaining;
                attackingCell.troops = 0;
                
                this.addMessage(`Conquered cell (${defendingCell.x}, ${defendingCell.y}) from ${previousOwner >= 0 ? `Faction ${previousOwner + 1}` : 'Neutral'}.`);
                battlefield.classList.add('attacker-wins');
            } else {
                this.addMessage(`Attack on cell (${defendingCell.x}, ${defendingCell.y}) failed.`);
                battlefield.classList.add('defender-wins');
            }
            
            // Update battle status with final result
            battleStatus.textContent = combatResult.attackerWins ? 
                `Victory! You conquered the territory with ${combatResult.attackerRemaining} troops remaining.` : 
                `Defeat! The defender repelled your attack. They have ${combatResult.defenderRemaining} troops left.`;
            
            // Change skip button to continue
            skipButton.textContent = 'Continue';
            skipButton.addEventListener('click', () => {
                document.body.removeChild(battleOverlay);
                
                // Update cells
                defendingCell.updateElement();
                attackingCell.updateElement();
                this.targetCell = null;
                this.updateUI();
            }, { once: true });
            
            // Update cells visually
            defendingCell.updateElement();
            attackingCell.updateElement();
            this.updateUI();
        };
    }
}