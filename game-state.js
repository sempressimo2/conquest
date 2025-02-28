class GameStateManager {
    constructor(grid, factions) {
        this.grid = grid;
        this.factions = factions;
        this.currentFactionIndex = 0;
        this.turn = 1;
        this.gameOver = false;
        this.winner = null;
    }
    
    getCurrentFaction() {
        return this.factions[this.currentFactionIndex];
    }
    
    nextTurn() {
        this.currentFactionIndex = (this.currentFactionIndex + 1) % this.factions.length;
        
        if (this.currentFactionIndex === 0) {
            this.turn++;
            this.collectResources();
            this.growPopulation();
        }
        
        this.getCurrentFaction().resetActions();
        this.checkVictoryConditions();
        
        return {
            faction: this.getCurrentFaction(),
            turn: this.turn,
            gameOver: this.gameOver,
            winner: this.winner
        };
    }
    
    collectResources() {
        for (const faction of this.factions) {
            let totalResources = { food: 0, materials: 0, gold: 0 };
            
            for (const cell of this.grid.getCellsByFaction(faction.id)) {
                const resources = cell.getResourceProduction();
                totalResources.food += resources.food;
                totalResources.materials += resources.materials;
                totalResources.gold += resources.gold;
            }
            
            faction.addResources(totalResources);
        }
    }
    
    growPopulation() {
        for (const cell of this.grid.cells) {
            if (cell.ownerId >= 0) {
                cell.growPopulation();
            }
        }
    }
    
    checkVictoryConditions() {
        const activeFactions = this.factions.filter(faction => 
            this.grid.getCellsByFaction(faction.id).length > 0
        );
        
        if (activeFactions.length === 1) {
            this.gameOver = true;
            this.winner = activeFactions[0];
        }
    }
    
    initializeGame() {
        // Create starting territories for each faction
        for (let i = 0; i < this.factions.length; i++) {
            const faction = this.factions[i];
            
            // Simple placement - corners for now
            let x, y;
            switch (i) {
                case 0: // Top left
                    x = 0; y = 0;
                    break;
                case 1: // Top right
                    x = this.grid.size - 1; y = 0;
                    break;
                case 2: // Bottom left
                    x = 0; y = this.grid.size - 1;
                    break;
                case 3: // Bottom right
                    x = this.grid.size - 1; y = this.grid.size - 1;
                    break;
            }
            
            // Assign initial cells
            this.grid.getCell(x, y).assignToFaction(faction.id);
            this.grid.getCell(x + (i % 2 === 0 ? 1 : -1), y).assignToFaction(faction.id);
            this.grid.getCell(x, y + (i < 2 ? 1 : -1)).assignToFaction(faction.id);
        }
    }
}