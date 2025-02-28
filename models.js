// Grid and Cell classes
class Grid {
    constructor(size) {
        this.size = size;
        this.cells = [];
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                this.cells.push(new Cell(x, y));
            }
        }
    }
    
    getCell(x, y) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) return null;
        return this.cells[y * this.size + x];
    }
    
    getAdjacentCells(cell) {
        const adjacentCells = [];
        const directions = [
            {x: 0, y: -1}, // Up
            {x: 1, y: 0},  // Right
            {x: 0, y: 1},  // Down
            {x: -1, y: 0}   // Left
        ];
        
        for (const dir of directions) {
            const adjacentCell = this.getCell(cell.x + dir.x, cell.y + dir.y);
            if (adjacentCell) adjacentCells.push(adjacentCell);
        }
        
        return adjacentCells;
    }
    
    getCellsByFaction(factionId) {
        return this.cells.filter(cell => cell.ownerId === factionId);
    }
}

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.ownerId = -1; // -1 for neutral
        this.resourceType = 'balanced'; // 'food', 'materials', 'gold', or 'balanced'
        this.resourceLevel = 1;
        this.population = 0;
        this.populationCapacity = 10;
        this.troops = 0;
        this.fortification = 0;
        this.element = null; // DOM reference
    }
    
    assignToFaction(factionId) {
        this.ownerId = factionId;
        this.population = 5;
        this.updateElement();
    }
    
    getResourceProduction() {
        const baseProduction = {
            food: 1,
            materials: 1,
            gold: 1
        };
        
        switch (this.resourceType) {
            case 'food':
                baseProduction.food = 3 * this.resourceLevel;
                break;
            case 'materials':
                baseProduction.materials = 3 * this.resourceLevel;
                break;
            case 'gold':
                baseProduction.gold = 3 * this.resourceLevel;
                break;
            case 'balanced':
                baseProduction.food = 2 * this.resourceLevel;
                baseProduction.materials = 2 * this.resourceLevel;
                baseProduction.gold = 2 * this.resourceLevel;
                break;
        }
        
        return baseProduction;
    }
    
    upgradeResource(type) {
        this.resourceType = type;
        this.resourceLevel++;
        this.updateElement();
    }
    
    upgradeFortification() {
        this.fortification++;
        this.updateElement();
    }
    
    growPopulation() {
        if (this.population < this.populationCapacity) {
            this.population += 1;
        }
        this.updateElement();
    }
    
    recruitTroops(amount) {
        const actualAmount = Math.min(amount, this.population);
        this.population -= actualAmount;
        this.troops += actualAmount;
        this.updateElement();
        return actualAmount;
    }
    
    getDefenseStrength() {
        return this.troops + (this.fortification * 3);
    }
    
    updateElement() {
        if (!this.element) return;
        
        // Update CSS classes
        this.element.className = 'cell';
        if (this.ownerId >= 0) {
            this.element.classList.add(`cell-faction-${this.ownerId}`);
        }
        
        // Update content
        let resourceIcon = '⚖️'; // Balanced
        if (this.resourceType === 'food') resourceIcon = '🍎';
        if (this.resourceType === 'materials') resourceIcon = '🧱';
        if (this.resourceType === 'gold') resourceIcon = '💰';
        
        this.element.innerHTML = `
            <div class="cell-info">
                <span>${this.population}/${this.populationCapacity}</span>
                <span>${this.fortification > 0 ? '🛡️' + this.fortification : ''}</span>
            </div>
            <div class="cell-resource">${resourceIcon} ${this.resourceLevel}</div>
            <div class="cell-troops">${this.troops > 0 ? '⚔️' + this.troops : ''}</div>
        `;
    }
}

class Faction {
    constructor(id, name, color, trait = '') {
        this.id = id;
        this.name = name;
        this.color = color;
        this.trait = trait;
        this.resources = {
            food: 20,
            materials: 20,
            gold: 10
        };
        this.actionsRemaining = 3;
    }
    
    resetActions() {
        this.actionsRemaining = 3;
    }
    
    useAction() {
        if (this.actionsRemaining > 0) {
            this.actionsRemaining--;
            return true;
        }
        return false;
    }
    
    addResources(resources) {
        this.resources.food += resources.food;
        this.resources.materials += resources.materials;
        this.resources.gold += resources.gold;
    }
    
    canAfford(cost) {
        return this.resources.food >= cost.food && 
               this.resources.materials >= cost.materials && 
               this.resources.gold >= cost.gold;
    }
    
    pay(cost) {
        if (!this.canAfford(cost)) return false;
        
        this.resources.food -= cost.food;
        this.resources.materials -= cost.materials;
        this.resources.gold -= cost.gold;
        return true;
    }
    
    getTotalPopulation(grid) {
        return grid.getCellsByFaction(this.id)
            .reduce((total, cell) => total + cell.population, 0);
    }
    
    getTotalTroops(grid) {
        return grid.getCellsByFaction(this.id)
            .reduce((total, cell) => total + cell.troops, 0);
    }
}