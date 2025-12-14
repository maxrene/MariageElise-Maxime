const fs = require('fs');

function parseCsvRow(rowString) {
    const values = [];
    let currentVal = '';
    let inQuotes = false;
    for (let i = 0; i < rowString.length; i++) {
        const char = rowString[i];
        if (char === '"') {
            if (inQuotes && rowString[i + 1] === '"') {
                currentVal += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(currentVal.trim());
            currentVal = '';
        } else {
            currentVal += char;
        }
    }
    values.push(currentVal.trim());
    return values;
}

// Minimal simulation of createGiftCardHTML
function simulateCreateHTML(gift) {
    const { isPartial, totalContributed, Prix, isGlobalOffered, Nom } = gift;
    const formattedPrice = Prix > 0 ? `${Prix}€` : '';

    // Logic from createGiftCardHTML
    const priceTagHTML = !isGlobalOffered && formattedPrice ? `<span class="price-tag">${formattedPrice}</span>` : '';

    return {
        id: gift.ID,
        name: Nom,
        price: Prix,
        formattedPrice,
        isGlobalOffered,
        priceTagHTML
    };
}

const csvText = fs.readFileSync('gifts.csv', 'utf8');
const rows = csvText.split('\n').map(row => row.trim()).filter(row => row);
const headers = parseCsvRow(rows[0]);

rows.slice(1).forEach(row => {
    const values = parseCsvRow(row);
    const item = {};
    headers.forEach((header, index) => {
        const cleanHeader = header.trim();
        item[cleanHeader] = values[index] ? values[index] : '';
    });

    // Mock processing logic
    const giftID = String(item.ID || '').trim();
    const isPartial = item.Type_Contribution?.toLowerCase().trim() === 'partiel';
    const offerByName = item.Offert_par || item["Offert par"] || '';
    const isOfferedInSheet = offerByName.trim() !== '';
    const totalContributed = 0; // Assuming 0 for unique items debugging

    const processedGift = {
        ...item,
        ID: giftID,
        Prix: parseFloat(item.Prix) || 0,
        totalContributed: totalContributed,
        isPartial: isPartial,
        isGlobalOffered: isOfferedInSheet || (isPartial && item.Prix > 0 && totalContributed >= parseFloat(item.Prix))
    };

    if (['1', '12', '14'].includes(processedGift.ID)) {
        const result = simulateCreateHTML(processedGift);
        console.log(`ID: ${result.id} | Name: ${result.name}`);
        console.log(`   Prix: ${result.price} | Formatted: "${result.formattedPrice}"`);
        console.log(`   isGlobalOffered: ${result.isGlobalOffered}`);
        console.log(`   Generated Tag: ${result.priceTagHTML || "NONE"}`);
        console.log("---------------------------------------------------");
    }
});
