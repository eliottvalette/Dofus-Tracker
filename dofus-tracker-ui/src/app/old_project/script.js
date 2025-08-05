// DOFUS HDV Analytics - JavaScript Logic
let priceData = [];
let filteredData = [];
let excludedItems = new Set(); // Items supprimés par l'utilisateur
let priceChart = null;
let currentSort = { field: 'opportunity_note', order: 'desc' };
let currentAnalysisView = 'table'; // 'chart' or 'table' - Par défaut sur le tableau
let autoSwitchIntervalId = null;
let autoSwitchEnabled = false;
let deleteModeEnabled = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOFUS HDV Analytics initialized');
    
    // Vérifier que les éléments DOM existent
    const autoSwitchToggle = document.getElementById('autoSwitchToggle');
    console.log('Auto switch toggle element found:', autoSwitchToggle !== null);
    
    if (autoSwitchToggle) {
        console.log('Auto switch toggle initial checked state:', autoSwitchToggle.checked);
    }
    
    initializeUIState();
    initializeEventListeners();
    loadData();
    
    // Initialiser l'auto-switch après un court délai pour s'assurer que le DOM est prêt
    setTimeout(() => {
        console.log('Initializing auto-switch with delay');
        initializeAutoSwitch();
    }, 500);
});

function initializeUIState() {
    // S'assurer que la vue tableau est activée par défaut pour afficher le tri par opportunity note
    toggleAnalysis('table');
    console.log('Interface initialisée en mode tableau avec tri par opportunity note');
}

// Event Listeners
function initializeEventListeners() {
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));
    
    // Filter functionality
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('profitableOnly').addEventListener('change', applyFilters);
    document.getElementById('maxInvestmentFilter').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('maxProfitFilter').addEventListener('input', debounce(applyFilters, 300));
    // Ajout listeners pour les nouveaux filtres
    document.getElementById('minProfitAmountFilter').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('minProfitPercentFilter').addEventListener('input', debounce(applyFilters, 300));
    // Listener pour la nouvelle checkbox
    document.getElementById('hideNoArbitrage').addEventListener('change', applyFilters);
    
    // Chart controls
    document.getElementById('chartItemSelect').addEventListener('change', updatePriceChart);
}

// Table Sorting - MUST BE GLOBAL
function sortTable(field) {
    console.log(`Sorting by ${field}`);
    // Toggle order if same field, otherwise default to desc for profit_percent and opportunity_note, asc for others
    if (currentSort.field === field) {
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.order = (field === 'profit_percent' || field === 'opportunity_note') ? 'desc' : 'asc';
    }
    
    // Update table
    updateItemsTable();
    
    // Update header icons
    updateSortIcons();
}

function updateSortIcons() {
    // Reset all sort icons
    const headers = document.querySelectorAll('#itemsTable th i');
    headers.forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    // Set active sort icon
    const fieldMap = {
        'item_name': 0,
        'price_x1': 1,
        'price_x10': 2,
        'price_x100': 3,
        'arbitrage': 4,
        'profit_percent': 5,
        'investment_cost': 6,
        'profit_absolute': 7,
        'opportunity_note': 8
    };
    
    const headerIndex = fieldMap[currentSort.field];
    if (headerIndex !== undefined) {
        const icon = headers[headerIndex];
        if (icon) {
            icon.className = currentSort.order === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        }
    }
}

function updateScrollIndicator() {
    const tableResponsive = document.querySelector('.data-container');
    if (tableResponsive) {
        // Check if table content is scrollable
        const isScrollable = tableResponsive.scrollHeight > tableResponsive.clientHeight;
        
        if (isScrollable) {
            tableResponsive.classList.add('show-scroll-indicator');
            
            // Add scroll listener to hide/show indicator
            tableResponsive.addEventListener('scroll', function() {
                const isAtBottom = this.scrollTop + this.clientHeight >= this.scrollHeight - 5;
                if (isAtBottom) {
                    this.classList.remove('show-scroll-indicator');
                } else {
                    this.classList.add('show-scroll-indicator');
                }
            });
        } else {
            tableResponsive.classList.remove('show-scroll-indicator');
        }
    }
}

// Data Loading
async function loadData() {
    showLoading();
    try {
        // Load CSV data
        const response = await fetch('prices_data.csv');
        const csvText = await response.text();
        
        // Parse CSV
        priceData = parseCSV(csvText);
        
        // Load summary data
        await loadSummary();
        
        // Process and display data
        processData();
        updateUI();
        
        console.log(`✅ Loaded ${priceData.length} price records`);
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showError('Erreur lors du chargement des données');
    } finally {
        hideLoading();
    }
}

async function loadSummary() {
    try {
        const response = await fetch('summary.json');
        const summary = await response.json();
        
        // Update header stats
        document.getElementById('totalItems').textContent = summary.total_items;
        document.getElementById('totalRecords').textContent = summary.total_records;
        document.getElementById('lastUpdate').textContent = formatDate(summary.last_update);
        
        // Populate category filter
        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter.innerHTML = '<option value="">Toutes les catégories</option>';
        summary.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
        
    } catch (error) {
        console.error('❌ Error loading summary:', error);
    }
}

// CSV Parsing
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const values = line.split(',');
            const record = {};
            headers.forEach((header, index) => {
                record[header.trim()] = values[index]?.trim() || '';
            });
            
            // Convert numeric fields
            record.quantity = parseInt(record.quantity) || 0;
            record.price = parseInt(record.price) || 0;
            record.price_per_unit = parseFloat(record.price_per_unit) || 0;
            
            // IGNORER les lots de 1000 complètement
            if (record.quantity === 1000) {
                continue;
            }
            
            data.push(record);
        }
    }
    
    return data;
}

// Data Processing
function processData() {
    // Identifier la dernière tranche de timestamp disponible
    const latestTimestamp = getLatestTimestamp();
    console.log(`🔍 Dernière tranche de scan identifiée: ${latestTimestamp}`);
    
    // Mettre à jour l'indication dans l'interface
    updateTimestampDisplay(latestTimestamp);
    
    // Filtrer les données pour ne garder que la dernière tranche
    const latestData = priceData.filter(record => record.timestamp === latestTimestamp);
    console.log(`📊 Analyse basée sur ${latestData.length} enregistrements de la dernière tranche`);
    
    // Group data by item for arbitrage analysis (uniquement dernière tranche)
    const itemGroups = groupByItem(latestData);
    
    // Calculate arbitrage opportunities
    const arbitrageData = calculateArbitrageOpportunities(itemGroups);
    
    // Store processed data
    filteredData = arbitrageData;
    
    // Update statistics
    updateStatistics(arbitrageData);
}

function updateTimestampDisplay(timestamp) {
    const timestampElement = document.getElementById('currentTimestamp');
    if (timestampElement && timestamp) {
        // Formater le timestamp pour l'affichage (YYYYMMDD_HHMMSS -> DD/MM/YYYY HH:MM:SS)
        const formattedDate = formatTimestampForDisplay(timestamp);
        timestampElement.textContent = `Analyse: ${formattedDate}`;
    }
}

function formatTimestampForDisplay(timestamp) {
    if (!timestamp) return 'Dernière tranche';
    
    try {
        // Format: YYYYMMDD_HHMMSS
        const year = timestamp.substring(0, 4);
        const month = timestamp.substring(4, 6);
        const day = timestamp.substring(6, 8);
        const hour = timestamp.substring(9, 11);
        const minute = timestamp.substring(11, 13);
        const second = timestamp.substring(13, 15);
        
        return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    } catch (error) {
        console.warn('Erreur formatage timestamp:', error);
        return timestamp;
    }
}

function getLatestTimestamp() {
    // Extraire tous les timestamps uniques
    const timestamps = [...new Set(priceData.map(record => record.timestamp))];
    
    if (timestamps.length === 0) {
        console.warn('⚠️ Aucun timestamp trouvé dans les données');
        return null;
    }
    
    // Trier les timestamps (format: YYYYMMDD_HHMMSS)
    timestamps.sort();
    
    // Retourner le plus récent
    const latest = timestamps[timestamps.length - 1];
    console.log(`📅 Timestamps disponibles: ${timestamps.length} (${timestamps.slice(0, 3).join(', ')}${timestamps.length > 3 ? '...' : ''})`);
    console.log(`🎯 Timestamp le plus récent: ${latest}`);
    
    return latest;
}

function groupByItem(data) {
    const groups = {};
    
    data.forEach(record => {
        const itemName = record.item_name;
        if (!groups[itemName]) {
            groups[itemName] = {
                name: itemName,
                category: record.category,
                prices: [],
                latestScan: record.scan_date
            };
        }
        
        groups[itemName].prices.push({
            quantity: record.quantity,
            price: record.price,
            price_per_unit: record.price_per_unit,
            timestamp: record.timestamp,
            scan_date: record.scan_date
        });
    });
    
    return Object.values(groups);
}

function calculateArbitrageOpportunities(itemGroups) {
    const opportunities = [];
    
    itemGroups.forEach(item => {
        // Sort prices by quantity
        const sortedPrices = item.prices.sort((a, b) => a.quantity - b.quantity);
        
        // Find latest prices for each quantity
        const latestPrices = {};
        sortedPrices.forEach(price => {
            if (!latestPrices[price.quantity] || price.scan_date > latestPrices[price.quantity].scan_date) {
                latestPrices[price.quantity] = price;
            }
        });
        
        const quantities = Object.keys(latestPrices).map(Number).sort((a, b) => a - b);
        
        // Always process items to show their prices, even without arbitrage
        {
            // Calculate arbitrage opportunities - Use exact quantity matches, not positional
            const price1 = latestPrices[1];    // Exactly x1
            const price10 = latestPrices[10];  // Exactly x10  
            const price100 = latestPrices[100]; // Exactly x100
            
            // Buy low quantity, sell high quantity
            let bestArbitrage = null;
            let recommendations = [];
            
            // Only calculate arbitrage if both quantities exist
            if (price1 && price10) {
                const profit = calculateProfit(price1, price10, 10);
                if (profit.profitPercent > 5) {
                    recommendations.push({
                        type: 'buy_1_sell_10',
                        buyPrice: price1.price,
                        sellPrice: price10.price,
                        profit: profit.totalProfit,
                        profitPercent: profit.profitPercent,
                        investment: price1.price * 10
                    });
                }
            }
            
            if (price10 && price100) {
                const profit = calculateProfit(price10, price100, 10);
                if (profit.profitPercent > 5) {
                    recommendations.push({
                        type: 'buy_10_sell_100',
                        buyPrice: price10.price,
                        sellPrice: price100.price,
                        profit: profit.totalProfit,
                        profitPercent: profit.profitPercent,
                        investment: price10.price * 10
                    });
                }
            }
            
            if (price1 && price100) {
                const profit = calculateProfit(price1, price100, 100);
                if (profit.profitPercent > 10) {
                    recommendations.push({
                        type: 'buy_1_sell_100',
                        buyPrice: price1.price,
                        sellPrice: price100.price,
                        profit: profit.totalProfit,
                        profitPercent: profit.profitPercent,
                        investment: price1.price * 100
                    });
                }
            }
            
            // Find best recommendation and validate economic coherence
            if (recommendations.length > 0) {
                // Filter out economically incoherent arbitrages (too high profits are likely OCR errors)
                const validRecommendations = recommendations.filter(rec => rec.profitPercent < 1000); // Max 1000% profit
                
                if (validRecommendations.length > 0) {
                    bestArbitrage = validRecommendations.reduce((best, current) => 
                        current.profitPercent > best.profitPercent ? current : best
                    );
                }
            }
            
            const opportunity = {
                item_name: item.name,
                category: item.category,
                price_x1: price1?.price || 0,
                price_x10: price10?.price || 0,
                price_x100: price100?.price || 0,
                arbitrage: bestArbitrage,
                recommendations: recommendations,
                latestScan: item.latestScan,
                allPrices: latestPrices
            };
            
            // Calculer l'opportunity note
            opportunity.opportunity_note = calculateOpportunityNote(opportunity);
            
            opportunities.push(opportunity);
        }
    });
    
    return opportunities;
}

function calculateProfit(buyPrice, sellPrice, multiplier) {
    const buyTotal = buyPrice.price * multiplier;
    const sellTotal = sellPrice.price;
    const totalProfit = sellTotal - buyTotal;
    const profitPercent = ((totalProfit / buyTotal) * 100);
    
    return {
        totalProfit: totalProfit,
        profitPercent: profitPercent,
        buyTotal: buyTotal,
        sellTotal: sellTotal
    };
}

function calculateOpportunityNote(item) {
    if (!item.arbitrage) {
        return 0;
    }
    
    const arbitrage = item.arbitrage;
    let note = 0;
    
    // 1 point pour les types d'arbitrage préférés (BUY_1_SELL_10 ou BUY_10_SELL_100)
    if (arbitrage.type === 'buy_1_sell_10' || arbitrage.type === 'buy_10_sell_100') {
        note += 1;
    }
    
    // Bonus pour rendement > 30%
    if (arbitrage.profitPercent > 30) {
        note += 1;
    }
    
    // Bonus pour coût d'investissement raisonnable (< 100,000 K)
    if (arbitrage.investment < 100000) {
        note += 1;
    }
    
    // Bonus supplémentaire pour très bon rendement (> 50%)
    if (arbitrage.profitPercent > 50) {
        note += 1;
    }
    
    // Bonus pour très faible coût d'investissement (< 10,000 K)
    if (arbitrage.investment < 10000) {
        note += 1;
    }
    
    return note;
}

// UI Updates
function updateUI() {
    updateItemsTable();
    updateChartSelectors();
    updateCharts();
}

function updateStatistics(data) {
    // Filter out excluded items from statistics
    const activeData = data.filter(item => !excludedItems.has(item.item_name));
    
    const profitableOpportunities = activeData.filter(item => item.arbitrage && item.arbitrage.profitPercent > 0);
    const totalVolume = activeData.reduce((sum, item) => sum + (item.price_x1 || 0), 0);
    const avgPrice = activeData.length > 0 ? totalVolume / activeData.length : 0;
    const trendingItems = activeData.filter(item => item.arbitrage && item.arbitrage.profitPercent > 20);
    
    document.getElementById('totalProfitOpp').textContent = profitableOpportunities.length;
    document.getElementById('avgVolume').textContent = formatNumber(Math.floor(activeData.length > 0 ? totalVolume / activeData.length : 0));
    document.getElementById('avgPrice').textContent = formatNumber(Math.floor(avgPrice));
    document.getElementById('trendingItems').textContent = trendingItems.length;
}

// Create gradient container for values
function createGradientContainer(displayText, value, minMax, isInvestment) {
    if (minMax.min === minMax.max) {
        // If all values are the same, use neutral color
        return `<div class="value-container gradient-yellow">${displayText}</div>`;
    }
    
    // Normalize value between 0 and 1
    const normalizedValue = (value - minMax.min) / (minMax.max - minMax.min);
    
    // For investment cost: green is better (lower cost), red is worse (higher cost)
    // For profit: green is better (higher profit), red is worse (lower profit)
    const gradientValue = isInvestment ? (1 - normalizedValue) : normalizedValue;
    
    // Determine gradient class based on value
    let gradientClass;
    if (gradientValue >= 0.8) {
        gradientClass = 'gradient-green';
    } else if (gradientValue >= 0.6) {
        gradientClass = 'gradient-yellow-green';
    } else if (gradientValue >= 0.4) {
        gradientClass = 'gradient-yellow';
    } else if (gradientValue >= 0.2) {
        gradientClass = 'gradient-orange';
    } else {
        gradientClass = 'gradient-red';
    }
    
    return `<div class="value-container ${gradientClass}">${displayText}</div>`;
}

function updateItemsTable() {
    const tableBody = document.getElementById('itemsTableBody');
    tableBody.innerHTML = '';
    
    // Separate active and excluded items
    const activeItems = filteredData.filter(item => !excludedItems.has(item.item_name));
    const excludedItemsList = filteredData.filter(item => excludedItems.has(item.item_name));
    
    // Sort active items
    const sortedActiveData = [...activeItems].sort((a, b) => {
        let aVal, bVal;
        
        // Handle special cases for different fields
        switch (currentSort.field) {
            case 'profit_percent':
                aVal = a.arbitrage ? a.arbitrage.profitPercent : 0;
                bVal = b.arbitrage ? b.arbitrage.profitPercent : 0;
                break;
            case 'arbitrage':
                aVal = a.arbitrage ? a.arbitrage.type : '';
                bVal = b.arbitrage ? b.arbitrage.type : '';
                break;
            case 'investment_cost':
                aVal = a.arbitrage ? a.arbitrage.investment : 0;
                bVal = b.arbitrage ? b.arbitrage.investment : 0;
                break;
            case 'profit_absolute':
                aVal = a.arbitrage ? a.arbitrage.profit : 0;
                bVal = b.arbitrage ? b.arbitrage.profit : 0;
                break;
            case 'opportunity_note':
                aVal = a.opportunity_note || 0;
                bVal = b.opportunity_note || 0;
                break;
            default:
                aVal = a[currentSort.field] || 0;
                bVal = b[currentSort.field] || 0;
        }
        
        if (typeof aVal === 'string') {
            return currentSort.order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        
        return currentSort.order === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    // Sort excluded items (same sorting logic but they go at the bottom)
    const sortedExcludedData = [...excludedItemsList].sort((a, b) => {
        let aVal, bVal;
        
        switch (currentSort.field) {
            case 'profit_percent':
                aVal = a.arbitrage ? a.arbitrage.profitPercent : 0;
                bVal = b.arbitrage ? b.arbitrage.profitPercent : 0;
                break;
            case 'arbitrage':
                aVal = a.arbitrage ? a.arbitrage.type : '';
                bVal = b.arbitrage ? b.arbitrage.type : '';
                break;
            case 'investment_cost':
                aVal = a.arbitrage ? a.arbitrage.investment : 0;
                bVal = b.arbitrage ? b.arbitrage.investment : 0;
                break;
            case 'profit_absolute':
                aVal = a.arbitrage ? a.arbitrage.profit : 0;
                bVal = b.arbitrage ? b.arbitrage.profit : 0;
                break;
            case 'opportunity_note':
                aVal = a.opportunity_note || 0;
                bVal = b.opportunity_note || 0;
                break;
            default:
                aVal = a[currentSort.field] || 0;
                bVal = b[currentSort.field] || 0;
        }
        
        if (typeof aVal === 'string') {
            return currentSort.order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        
        return currentSort.order === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    // Combine: active items first, then excluded items at the bottom
    const sortedData = [...sortedActiveData, ...sortedExcludedData];
    
    // Calculate min/max values for gradient scaling (excluding deleted items)
    const activeData = sortedData.filter(item => !excludedItems.has(item.item_name));
    const investmentValues = activeData.filter(item => item.arbitrage).map(item => item.arbitrage.investment);
    const profitValues = activeData.filter(item => item.arbitrage).map(item => item.arbitrage.profit);
    const profitPercentValues = activeData.filter(item => item.arbitrage).map(item => item.arbitrage.profitPercent);
    
    const investmentMinMax = {
        min: Math.min(...investmentValues),
        max: Math.max(...investmentValues)
    };
    
    const profitMinMax = {
        min: Math.min(...profitValues),
        max: Math.max(...profitValues)
    };
    
    const profitPercentMinMax = {
        min: Math.min(...profitPercentValues),
        max: Math.max(...profitPercentValues)
    };
    
    sortedData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'animate-slide-in';
        row.dataset.itemName = item.item_name;
        
        // Ajouter classe pour les items exclus
        const isExcluded = excludedItems.has(item.item_name);
        if (isExcluded) {
            row.classList.add('excluded-item');
        }
        
        const arbitrageInfo = item.arbitrage ? 
            `${item.arbitrage.type.replace(/_/g, ' ').toUpperCase()}` : 
            'Aucune';
        
        // Utiliser les gradients seulement pour les items non exclus
        const profitPercent = item.arbitrage && !isExcluded ? 
            createGradientContainer(`${item.arbitrage.profitPercent.toFixed(1)}%`, item.arbitrage.profitPercent, profitPercentMinMax, false) : 
            `<span class="text-muted">${item.arbitrage ? item.arbitrage.profitPercent.toFixed(1) + '%' : '0%'}</span>`;
        
        const profitClass = item.arbitrage ? 
            (item.arbitrage.profitPercent > 20 ? 'text-profit' : 
             item.arbitrage.profitPercent > 5 ? 'text-warning' : 'text-neutral') : 
            'text-neutral';
        
        // Calculer le coût d'investissement et le profit absolu avec containers gradient
        const investmentCost = item.arbitrage && !isExcluded ? 
            createGradientContainer(formatKamas(item.arbitrage.investment), item.arbitrage.investment, investmentMinMax, true) : 
            `<span class="text-muted">${item.arbitrage ? formatKamas(item.arbitrage.investment) : '-'}</span>`;
        
        const profitAbsolute = item.arbitrage && !isExcluded ? 
            createGradientContainer(formatKamas(item.arbitrage.profit), item.arbitrage.profit, profitMinMax, false) : 
            `<span class="text-muted">${item.arbitrage ? formatKamas(item.arbitrage.profit) : '-'}</span>`;
        
        // Affichage de l'opportunity note avec étoiles
        const opportunityNote = item.opportunity_note || 0;
        const noteDisplay = '★'.repeat(opportunityNote) + '☆'.repeat(Math.max(0, 5 - opportunityNote));
        const noteClass = opportunityNote >= 4 ? 'text-success' : opportunityNote >= 2 ? 'text-warning' : 'text-muted';
        
        row.innerHTML = `
            <td><strong>${item.item_name}</strong></td>
            <td class="font-mono">${item.price_x1 ? formatKamas(item.price_x1) : '<span class="text-muted">-</span>'}</td>
            <td class="font-mono">${item.price_x10 ? formatKamas(item.price_x10) : '<span class="text-muted">-</span>'}</td>
            <td class="font-mono">${item.price_x100 ? formatKamas(item.price_x100) : '<span class="text-muted">-</span>'}</td>
            <td>${arbitrageInfo}</td>
            <td>${profitPercent}</td>
            <td class="font-mono">${investmentCost}</td>
            <td class="font-mono">${profitAbsolute}</td>
            <td class="${noteClass}" title="Note: ${opportunityNote}/5">${noteDisplay}</td>
        `;
        
        // Ajouter event listener pour supprimer la ligne au clic
        row.addEventListener('click', function(e) {
            // Éviter les conflits avec les clics sur les headers de tri
            if (e.target.closest('th')) return;
            
            const itemName = this.dataset.itemName;
            
            if (excludedItems.has(itemName)) {
                // Rétablir l'item
                excludedItems.delete(itemName);
                console.log(`Item "${itemName}" rétabli`);
            } else {
                // Exclure l'item
                excludedItems.add(itemName);
                console.log(`Item "${itemName}" exclu`);
            }
            
            // Mettre à jour l'affichage
            updateItemsTable();
        });
        
        tableBody.appendChild(row);
    });
    
    // Update sort icons
    updateSortIcons();
    
    // Update scroll indicator
    updateScrollIndicator();
}



function updateChartSelectors() {
    const chartItemSelect = document.getElementById('chartItemSelect');
    chartItemSelect.innerHTML = '<option value="">Sélectionner un item</option>';
    
    const uniqueItems = [...new Set(filteredData.map(item => item.item_name))];
    uniqueItems.sort().forEach(itemName => {
        const option = document.createElement('option');
        option.value = itemName;
        option.textContent = itemName;
        chartItemSelect.appendChild(option);
    });
    
    // Sélectionner automatiquement le premier item s'il y en a
    if (uniqueItems.length > 0) {
        chartItemSelect.value = uniqueItems[0];
        console.log(`Premier item sélectionné automatiquement: ${uniqueItems[0]}`);
        
        // Mettre à jour le graphique avec le premier item
        updatePriceChart();
    }
}

function updateCharts() {
    // Cette fonction est maintenant gérée directement dans updateChartSelectors()
    // pour assurer la sélection automatique du premier item
    const selectedItem = document.getElementById('chartItemSelect').value;
    if (selectedItem) {
        updatePriceChart();
    }
}

// Déplacer la fonction de clic en dehors de updatePriceChart pour qu'elle soit toujours active
function initializeChartClickHandler() {
    if (!priceChart) {
        console.log('initializeChartClickHandler: priceChart is null, cannot attach click handler');
        return;
    }
    
    console.log('Setting up chart click handler. Delete mode:', deleteModeEnabled);
    
    priceChart.canvas.onclick = function(evt) {
        console.log('Chart clicked. Delete mode:', deleteModeEnabled);
        
        if (!deleteModeEnabled) {
            console.log('Delete mode not active, ignoring click');
            return;
        }
        
        const points = priceChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
        console.log('Points detected:', points.length);
        
        if (points.length) {
            const firstPoint = points[0];
            const datasetIndex = firstPoint.datasetIndex;
            const pointIndex = firstPoint.index;
            const itemName = document.getElementById('chartItemSelect').value;
            
            console.log('Point details:', {
                index: pointIndex,
                datasetIndex: datasetIndex,
                item: itemName,
                x: firstPoint.element.x,
                y: firstPoint.element.y
            });
            
            // Get actual data point
            const dataPoint = priceChart.data.datasets[datasetIndex].data[pointIndex];
            const timestamp = dataPoint.x;
            
            // Format date to match exactly what's shown in the chart tooltip
            const clickedDate = new Date(timestamp);
            const formattedDisplayDate = clickedDate.toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            // Format timestamp to match CSV format (YYYYMMDD_HHMMSS)
            const formattedDate = clickedDate.toISOString().replace(/[^\d]/g, '').substring(0, 8) + '_' + 
                                 clickedDate.toISOString().replace(/[^\d]/g, '').substring(8, 14);
            
            console.log('Exact point clicked:', {
                displayDate: formattedDisplayDate,
                csvTimestamp: formattedDate,
                value: dataPoint.y
            });
            
            fetch('/delete_point', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    timestamp: formattedDate,
                    item: itemName,
                    quantity: priceChart.data.datasets[datasetIndex].label.replace('Quantité x', ''),
                    exactValue: dataPoint.y  // Ajouter la valeur exacte pour une meilleure précision
                })
            }).then(response => {
                console.log('Server response status:', response.status);
                return response.json();
            }).then(data => {
                console.log('Server response data:', data);
                if (data.success) {
                    alert('Point supprimé avec succès !');
                    refreshData();
                } else {
                    alert('Erreur lors de la suppression: ' + (data.message || 'Raison inconnue'));
                }
            }).catch(error => {
                console.error('Error deleting point:', error);
                alert('Erreur technique lors de la suppression.');
            });
        } else {
            console.log('No point detected at click position');
        }
    };
}

// Modifier la fonction updatePriceChart pour appeler initializeChartClickHandler
function updatePriceChart() {
    const selectedItem = document.getElementById('chartItemSelect').value;
    if (!selectedItem) {
        console.log('No item selected for price chart');
        return;
    }
    
    // Use all price data for the selected item (not filtered data)
    const itemData = priceData.filter(record => record.item_name === selectedItem);
    console.log(`Found ${itemData.length} records for item: ${selectedItem}`);
    
    if (itemData.length === 0) {
        console.log('No data found for selected item');
        // Show a message in the chart area
        const ctx = document.getElementById('priceChart').getContext('2d');
        if (priceChart) {
            priceChart.destroy();
        }
        return;
    }
    
    // Group by quantity and sort by date
    const quantityGroups = {};
    itemData.forEach(record => {
        if (!quantityGroups[record.quantity]) {
            quantityGroups[record.quantity] = [];
        }
        
        // Create proper date format for chart with full timestamp
        const dateValue = record.scan_date; // Use scan_date as it's in proper format "2025-07-11 03:31:52"
        const dateObj = new Date(dateValue);
        
        // Validate date
        if (isNaN(dateObj.getTime())) {
            console.warn(`Invalid date found: ${dateValue} for item ${record.item_name}`);
            return;
        }
        
        quantityGroups[record.quantity].push({
            x: dateObj.getTime(), // Convert to timestamp for time axis
            y: record.price_per_unit
        });
    });
    
    // Sort each quantity group by timestamp (Chart.js will handle time axis automatically)
    Object.keys(quantityGroups).forEach(quantity => {
        quantityGroups[quantity].sort((a, b) => a.x - b.x);
    });
    
    // Create datasets with clean natural colors
    const datasets = [];
    const cssVars = getComputedStyle(document.documentElement);
    const chartColors = [
        cssVars.getPropertyValue('--chart-1').trim(),
        cssVars.getPropertyValue('--chart-2').trim(),
        cssVars.getPropertyValue('--chart-3').trim()
    ];
    let colorIndex = 0;

    // Sort quantities for consistent display order
    const sortedQuantities = Object.keys(quantityGroups).sort((a, b) => parseInt(a) - parseInt(b));

    sortedQuantities.forEach(quantity => {
        const color = chartColors[colorIndex % chartColors.length];
        datasets.push({
            label: `Quantité x${quantity}`,
            data: quantityGroups[quantity],
            borderColor: color,
            backgroundColor: color + '20',
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
        });
        colorIndex++;
    });
    
    // 1️⃣  ➜  Ajoute ceci juste après la construction des `datasets`
    const allYValues = datasets.flatMap(ds => ds.data.map(pt => pt.y));
    const maxY       = Math.max(...allYValues);
    const yAxisMax   = Math.ceil(maxY * 1.1);        // max + 10 %, puis arrondi
    
    console.log('Chart datasets:', datasets);
    console.log('Raw data points per quantity:');
    Object.keys(quantityGroups).forEach(quantity => {
        console.log(`  Quantity x${quantity}: ${quantityGroups[quantity].length} points`);
        quantityGroups[quantity].forEach((point, index) => {
            const date = new Date(point.x);
            console.log(`    ${index + 1}. ${date.toLocaleString('fr-FR')} - ${point.y} K`);
        });
    });
    
    // Update chart
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    if (priceChart) {
        priceChart.destroy();
    }
    
    // Update chart options to make points more clickable
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'minute',
                    displayFormats: {
                        minute: 'HH:mm',
                        hour: 'HH:mm',
                        day: 'MMM dd HH:mm'
                    }
                },
                grid: {
                    color: '#ffffff1a'
                },
                ticks: {
                    color: '#ffffff',
                },
                title: {
                    display: true,
                    text: 'Heure de scan',
                    color: '#ffffff'
                }
            },
            y: {
                min: 0,               // toujours partir de 0
                max: yAxisMax,        // plafond dynamique = max + 10 %
                ticks: {
                    color: '#ffffff',
                    callback: value => formatKamas(value)
                },
                grid: { color: '#ffffff1a' },
                title: {
                    display: true,
                    text: 'Prix par unité',
                    color: '#ffffff'
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#ffffff'
                }
            },
            tooltip: {
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                backgroundColor: 'rgba(254, 250, 224, 0.95)',
                borderColor: '#ffffff',
                borderWidth: 1,
                callbacks: {
                    title: function(context) {
                        const date = new Date(context[0].parsed.x);
                        return date.toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    },
                    label: function(context) {
                        return `${context.dataset.label}: ${formatKamas(context.parsed.y)}`;
                    }
                }
            }
        },
        // Make points more clickable
        elements: {
            point: {
                radius: 5,
                hitRadius: 10,
                hoverRadius: 8
            }
        },
        // Improve interaction
        interaction: {
            mode: 'nearest',
            intersect: true,
            axis: 'xy'
        }
    };
    
    // Create chart with updated options
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: chartOptions
    });
    
    console.log('Price chart updated successfully');
    
    // Initialiser le gestionnaire de clics après chaque mise à jour du graphique
    initializeChartClickHandler();
}

// Analysis View Toggle
function toggleAnalysis(view) {
    currentAnalysisView = view;
    
    // Update button states
    const chartBtn = document.getElementById('showPriceChart');
    const tableBtn = document.getElementById('showItemsTable');
    
    if (view === 'chart') {
        chartBtn.classList.add('active');
        tableBtn.classList.remove('active');
        document.getElementById('chartSection').classList.add('active');
        document.getElementById('tableSection').classList.remove('active');
    } else {
        tableBtn.classList.add('active');
        chartBtn.classList.remove('active');
        document.getElementById('tableSection').classList.add('active');
        document.getElementById('chartSection').classList.remove('active');
    }
    
    console.log(`Switched to ${view} analysis view`);
}

// Event Handlers
function handleSearch() {
    applyFilters();
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const profitableOnly = document.getElementById('profitableOnly').checked;
    const maxInvestment = parseInt(document.getElementById('maxInvestmentFilter').value) || Infinity;
    const maxProfitPercent = parseFloat(document.getElementById('maxProfitFilter').value) || Infinity;
    // Ajout récupération des nouveaux filtres
    const minProfitAmount = parseInt(document.getElementById('minProfitAmountFilter').value) || 0;
    const minProfitPercent = parseFloat(document.getElementById('minProfitPercentFilter').value) || 0;
    const hideNoArbitrage = document.getElementById('hideNoArbitrage').checked;
    
    // Identifier la dernière tranche de timestamp disponible
    const latestTimestamp = getLatestTimestamp();
    
    // Mettre à jour l'indication dans l'interface
    updateTimestampDisplay(latestTimestamp);
    
    // First, filter the raw price data by search, category, and latest timestamp
    const filteredRawData = priceData.filter(record => {
        const itemName = record.item_name.toLowerCase();
        const matchesSearch = !searchTerm || itemName.includes(searchTerm);
        const matchesCategory = !categoryFilter || record.category === categoryFilter;
        const matchesLatestTimestamp = record.timestamp === latestTimestamp;
        
        return matchesSearch && matchesCategory && matchesLatestTimestamp;
    });
    
    console.log(`Filtered raw data (latest timestamp only): ${filteredRawData.length} records`);
    
    // Group filtered data by item for arbitrage analysis
    const itemGroups = groupByItem(filteredRawData);
    const arbitrageData = calculateArbitrageOpportunities(itemGroups);
    
    // Apply profitability and investment cost filters
    let filteredByConditions = arbitrageData;
    
    if (profitableOnly) {
        filteredByConditions = filteredByConditions.filter(item => item.arbitrage && item.arbitrage.profitPercent > 0);
    }
    
    // Apply investment cost filter
    filteredByConditions = filteredByConditions.filter(item => {
        if (!item.arbitrage) return true; // Show items without arbitrage
        return item.arbitrage.investment <= maxInvestment;
    });

    // Apply maximum profit percent filter
    filteredByConditions = filteredByConditions.filter(item => {
        if (!item.arbitrage) return true; // Show items without arbitrage
        return item.arbitrage.profitPercent <= maxProfitPercent;
    });

    // Ajout : filtre montant de profit minimum
    filteredByConditions = filteredByConditions.filter(item => {
        if (!item.arbitrage) return true;
        return item.arbitrage.profit >= minProfitAmount;
    });

    // Ajout : filtre % profit minimum
    filteredByConditions = filteredByConditions.filter(item => {
        if (!item.arbitrage) return true;
        return item.arbitrage.profitPercent >= minProfitPercent;
    });

    // Nouveau : masquer les items sans arbitrage si la checkbox est cochée
    if (hideNoArbitrage) {
        filteredByConditions = filteredByConditions.filter(item => item.arbitrage);
    }
    
    filteredData = filteredByConditions;
    
    // Note: We keep excluded items in filteredData for display but they won't affect min/max calculations
    
    console.log(`Final filtered data: ${filteredData.length} items`);
    
    updateUI();
}

// Utility Functions

function formatKamas(amount) {
    if (amount === 0) return '0';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' ₭';
}

function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('fr-FR');
}

function highlightItem(itemName) {
    // Scroll to item in table and highlight
    const tableRows = document.querySelectorAll('#itemsTableBody tr');
    tableRows.forEach(row => {
        const itemCell = row.cells[0];
        if (itemCell.textContent.includes(itemName)) {
            row.style.backgroundColor = '#3b82f6';
            setTimeout(() => {
                row.style.backgroundColor = '';
            }, 2000);
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showError(message) {
    console.error(message);
    // Could add a toast notification here
}

// Export Functions
function exportData() {
    const csvContent = "data:text/csv;charset=utf-8," + 
        "Item,Price x1,Price x10,Price x100,Arbitrage,Profit %,Coût Invest.,Profit,Opportunity Note\n" +
        filteredData.map(item => {
            const arbitrage = item.arbitrage ? item.arbitrage.type : 'None';
            const profit = item.arbitrage ? item.arbitrage.profitPercent.toFixed(1) : '0';
            const investmentCost = item.arbitrage ? item.arbitrage.investment : '0';
            const profitAbsolute = item.arbitrage ? item.arbitrage.profit : '0';
            const opportunityNote = item.opportunity_note || 0;
            
            return `${item.item_name},${item.price_x1},${item.price_x10},${item.price_x100},${arbitrage},${profit}%,${investmentCost},${profitAbsolute},${opportunityNote}`;
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dofus_hdv_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function refreshData() {
    loadData();
}

// Function to restore all excluded items
function restoreAllItems() {
    const previousCount = excludedItems.size;
    excludedItems.clear();
    
    if (previousCount > 0) {
        console.log(`${previousCount} items restaurés`);
        updateUI();
    } else {
        console.log('Aucun item à restaurer');
    }
}

// Navigation manuelle entre les items
function navigateItem(direction) {
    const select = document.getElementById('chartItemSelect');
    if (!select || select.options.length === 0) {
        console.log('Aucun item disponible pour la navigation');
        return;
    }
    
    let newIndex = select.selectedIndex + direction;
    
    // Gestion du wraparound (boucle)
    if (newIndex < 0) {
        newIndex = select.options.length - 1; // Aller au dernier item
    } else if (newIndex >= select.options.length) {
        newIndex = 0; // Aller au premier item
    }
    
    console.log(`Navigation manuelle: ${direction > 0 ? 'Next' : 'Previous'} - Item ${newIndex}: ${select.options[newIndex].text}`);
    
    select.selectedIndex = newIndex;
    select.dispatchEvent(new Event('change'));
}

// Auto-switch toggle listener
function initializeAutoSwitch() {
    const toggle = document.getElementById('autoSwitchToggle');
    if (!toggle) {
        console.log('Auto switch toggle not found in DOM');
        return;
    }
    
    console.log('Auto switch toggle found, setting up listener');
    
    // Définir la fonction de démarrage/arrêt
    function startAutoSwitch() {
        // Arrêter l'intervalle existant si présent
        if (autoSwitchIntervalId) {
            clearInterval(autoSwitchIntervalId);
        }
        
        console.log('Starting auto-switch with 2 second interval');
        autoSwitchIntervalId = setInterval(() => {
            const select = document.getElementById('chartItemSelect');
            if (!select || select.options.length === 0) return;
            
            let nextIndex = select.selectedIndex + 1;
            if (nextIndex >= select.options.length) nextIndex = 0;
            
            console.log(`Auto-switching to item ${nextIndex}: ${select.options[nextIndex].text}`);
            select.selectedIndex = nextIndex;
            select.dispatchEvent(new Event('change'));
        }, 2000);
    }
    
    function stopAutoSwitch() {
        if (autoSwitchIntervalId) {
            console.log('Stopping auto-switch');
            clearInterval(autoSwitchIntervalId);
            autoSwitchIntervalId = null;
        }
    }
    
    // Ajouter l'écouteur d'événements avec gestion explicite de l'état
    toggle.addEventListener('change', function() {
        // Utiliser la propriété checked du toggle
        const isChecked = this.checked;
        autoSwitchEnabled = isChecked;
        
        console.log('Auto switch toggled:', autoSwitchEnabled, 'checked:', isChecked);
        
        if (isChecked) {
            startAutoSwitch();
        } else {
            stopAutoSwitch();
        }
    });
    
    // S'assurer que l'état initial est cohérent
    autoSwitchEnabled = toggle.checked;
    console.log('Auto switch initial state:', autoSwitchEnabled);
}

// Global functions must be in window scope for onclick handlers
window.sortTable = sortTable;
window.toggleAnalysis = toggleAnalysis;
window.exportData = exportData;
window.refreshData = refreshData;
window.restoreAllItems = restoreAllItems; 
window.navigateItem = navigateItem; 