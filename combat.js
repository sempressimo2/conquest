class CombatSystem {
    static resolveAttack(attackingCell, defendingCell) {
        const attackStrength = attackingCell.troops;
        const defenseStrength = defendingCell.getDefenseStrength();
        
        // Simple combat formula with some randomization
        const attackEffectiveness = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
        const defenseEffectiveness = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
        
        const adjustedAttack = attackStrength * attackEffectiveness;
        const adjustedDefense = defenseStrength * defenseEffectiveness;
        
        let attackerLosses = Math.round((adjustedDefense / (adjustedAttack + adjustedDefense)) * attackStrength * 0.8);
        let defenderLosses = Math.round((adjustedAttack / (adjustedAttack + adjustedDefense)) * defendingCell.troops * 0.8);
        
        // Ensure losses don't exceed available troops
        attackerLosses = Math.min(attackerLosses, attackingCell.troops);
        defenderLosses = Math.min(defenderLosses, defendingCell.troops);
        
        // Calculate remaining troops
        const attackerRemaining = attackingCell.troops - attackerLosses;
        const defenderRemaining = defendingCell.troops - defenderLosses;
        
        // Determine winner
        const attackerWins = adjustedAttack > adjustedDefense;
        
        return {
            attackerLosses,
            defenderLosses,
            attackerRemaining,
            defenderRemaining,
            attackerWins
        };
    }
}