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
        this.endTurnBtn = document.getElementById('endTurnBtn');
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
        
        // End turn button
        this.endTurnBtn.addEventListener('click', () => this.handleEndTurn());
        
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
            <p><strong>Population:</strong> ${cell.population}/${cell.populationCapacity}</p>
            <p><strong>Troops:</strong> ${cell.troops}</p>
            <p><strong>Fortification:</strong> ${cell.fortification}</p>
            <p><strong>Resource Type:</strong> ${resourceType} (Level ${cell.resourceLevel})</p>
            <p><strong>Actions Remaining:</strong> ${currentFaction.actionsRemaining}</p>
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
            owner = `Faction ${cell.ownerI