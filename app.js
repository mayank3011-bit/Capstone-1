
(function() {
    'use strict';
    const ss = window.ss; 
    
    class NotificationSystem {
        constructor() { 
            this.container = document.getElementById('toastContainer'); 
        }
        
        show(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            const icons = { 
                success: 'check-circle', 
                error: 'exclamation-circle', 
                warning: 'exclamation-triangle', 
                info: 'info-circle' 
            };
            
            const iconColor = type === 'info' ? 'var(--accent)' : `var(--${type})`;
            toast.innerHTML = `<i class="fas fa-${icons[type]}" style="color: ${iconColor};"></i><span>${message}</span>`;
            
            this.container.appendChild(toast);
            
            setTimeout(() => { 
                toast.style.animation = 'slideIn 0.3s ease reverse'; 
                setTimeout(() => toast.remove(), 300); 
            }, duration);
        }
    }

    class CommandPalette {
        constructor() {
            this.element = document.getElementById('commandPalette');
            this.input = document.getElementById('commandInput');
            this.list = document.getElementById('commandList');
            this.selectedIndex = 0;
            
            this.commands = [
                { id: 'new', label: 'New Dataset', icon: 'plus', shortcut: 'Ctrl+N', action: () => location.reload() },
                { id: 'undo', label: 'Undo Action', icon: 'undo', shortcut: 'Ctrl+Z', action: () => undo() },
                { id: 'redo', label: 'Redo Action', icon: 'redo', shortcut: 'Ctrl+Y', action: () => redo() },
                { id: 'profile', label: 'Run Data Profile', icon: 'magic', shortcut: 'Ctrl+R', action: () => runAutoEDA() },
                { id: 'correlation', label: 'Generate Correlation Matrix', icon: 'th', action: () => generateCorrelationMatrix() },
                { id: 'clean', label: 'Clean Empty Data', icon: 'broom', action: () => cleanData() },
                { id: 'autofill', label: 'Smart Imputation (Auto-Fill)', icon: 'magic', action: () => runSmartImputation() },
                { id: 'transform', label: 'Transform Data...', icon: 'cogs', action: () => openTransformModal() },
                { id: 'train', label: 'Train ML Model...', icon: 'brain', action: () => openMLModal() },
                { id: 'export-pdf', label: 'Export as PDF', icon: 'file-pdf', shortcut: 'Ctrl+E', action: () => exportPDF() },
                { id: 'export-excel', label: 'Export as Excel', icon: 'file-excel', action: () => exportExcel() },
                { id: 'theme', label: 'Toggle Theme', icon: 'palette', shortcut: 'Ctrl+T', action: () => toggleTheme() },
                { id: 'shortcuts', label: 'View Keyboard Shortcuts', icon: 'keyboard', action: () => openModal('shortcutsModal') },
                { id: 'bar', label: 'Create Bar Chart', icon: 'chart-bar', action: () => addChart('bar') },
                { id: 'line', label: 'Create Line Chart', icon: 'chart-line', action: () => addChart('line') },
                { id: 'scatter', label: 'Create Scatter Plot', icon: 'braille', action: () => addChart('scatter') },
                { id: 'box', label: 'Create Box Plot', icon: 'box', action: () => addChart('box') }
            ];
            this.filtered = [];
            this.attachListeners();
        }
        
        attachListeners() {
            this.input.addEventListener('input', () => this.filter());
            this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
            
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') { 
                    e.preventDefault(); 
                    this.open(); 
                }
                if (e.key === 'Escape') this.close();
            });
        }
        
        open() { 
            this.element.classList.add('active'); 
            this.input.value = ''; 
            this.input.focus(); 
            this.filter(); 
        }
        
        close() { 
            this.element.classList.remove('active'); 
        }
        
        filter() {
            const query = this.input.value.toLowerCase();
            this.filtered = this.commands.filter(cmd => 
                cmd.label.toLowerCase().includes(query) || cmd.id.toLowerCase().includes(query)
            );
            this.selectedIndex = 0; 
            this.render();
        }
        
        render() {
            this.list.innerHTML = this.filtered.map((cmd, idx) => `
                <div class="command-item ${idx === this.selectedIndex ? 'selected' : ''}" data-index="${idx}">
                    <i class="fas fa-${cmd.icon}"></i>
                    <span>${cmd.label}</span>
                    ${cmd.shortcut ? `<kbd>${cmd.shortcut}</kbd>` : ''}
                </div>
            `).join('');
            
            this.list.querySelectorAll('.command-item').forEach(item => {
                item.addEventListener('click', () => this.execute(this.filtered[parseInt(item.dataset.index)]));
            });
        }
        
        handleKeydown(e) {
            if (e.key === 'ArrowDown') { 
                e.preventDefault(); 
                this.selectedIndex = (this.selectedIndex + 1) % this.filtered.length; 
                this.render(); 
            } else if (e.key === 'ArrowUp') { 
                e.preventDefault(); 
                this.selectedIndex = (this.selectedIndex - 1 + this.filtered.length) % this.filtered.length; 
                this.render(); 
            } else if (e.key === 'Enter' && this.filtered[this.selectedIndex]) { 
                e.preventDefault(); 
                this.execute(this.filtered[this.selectedIndex]); 
            }
        }
        
        execute(command) { 
            this.close(); 
            command.action(); 
        }
    }

    class StateManager {
        constructor() { 
            this.states = []; 
            this.currentIndex = -1; 
            this.maxStates = 50; 
        }
        
        pushState(data, columns, fileName) {
            if (this.currentIndex < this.states.length - 1) {
                this.states = this.states.slice(0, this.currentIndex + 1);
            }
            
            this.states.push({ 
                data: JSON.parse(JSON.stringify(data)), 
                columns: [...columns], 
                fileName: fileName, 
                timestamp: Date.now() 
            });
            
            if (this.states.length > this.maxStates) {
                this.states.shift(); 
            } else {
                this.currentIndex++; 
            }
            this.updateUI();
        }
        
        undo() { 
            if (this.currentIndex > 0) { 
                this.currentIndex--; 
                return this.getCurrentState(); 
            } 
            return null; 
        }
        
        redo() { 
            if (this.currentIndex < this.states.length - 1) { 
                this.currentIndex++; 
                return this.getCurrentState(); 
            } 
            return null; 
        }
        
        getCurrentState() { 
            return this.currentIndex >= 0 ? this.states[this.currentIndex] : null; 
        }
        
        updateUI() {
            const undoBtn = document.getElementById('undoBtn');
            const redoBtn = document.getElementById('redoBtn');
            if (undoBtn) undoBtn.style.opacity = this.currentIndex > 0 ? '1' : '0.3';
            if (redoBtn) redoBtn.style.opacity = this.currentIndex < this.states.length - 1 ? '1' : '0.3';
        }
    }

    const state = { 
        raw: [], 
        data: [], 
        columns: [], 
        fileName: '', 
        cellCounter: 0, 
        theme: 'theme-dark', 
        columnTypes: {}, 
        charts: [], 
        resizeObserver: null 
    };
    
    const history = new StateManager();
    const notifications = new NotificationSystem();
    let commandPalette;
    const dom = {}; 
    
    const sampleDatasets = {
        iris: { 
            name: 'iris.csv', 
            data: `sepal_length,sepal_width,petal_length,petal_width,species\n5.1,3.5,1.4,0.2,setosa\n4.9,3.0,1.4,0.2,setosa\n4.7,3.2,1.3,0.2,setosa\n7.0,3.2,4.7,1.4,versicolor\n6.4,3.2,4.5,1.5,versicolor\n6.3,3.3,6.0,2.5,virginica\n5.8,2.7,5.1,1.9,virginica` 
        },
        titanic: { 
            name: 'titanic.csv', 
            data: `PassengerId,Survived,Pclass,Name,Sex,Age,SibSp,Parch,Fare,Embarked\n1,0,3,"Braund",male,22,1,0,7.25,S\n2,1,1,"Cumings",female,38,1,0,71.2833,C\n3,1,3,"Heikkinen",female,26,0,0,7.925,S` 
        },
        housing: { 
            name: 'housing.csv', 
            data: `longitude,latitude,housing_median_age,total_rooms,total_bedrooms,population,households,median_income,median_house_value,ocean_proximity\n-122.23,37.88,41,880,129,322,126,8.3252,452600,NEAR BAY\n-122.22,37.86,21,7099,1106,2401,1138,8.3014,358500,NEAR BAY` 
        },
        sales: { 
            name: 'sales.csv', 
            data: `Date,Product,Region,Sales,Units,Customer_Satisfaction\n2024-01-01,Laptop,North,45000,15,4.5\n2024-01-01,Phone,South,32000,40,4.2\n2024-01-02,Laptop,South,38000,12,4.3` 
        }
    };

    function init() {
        const elements = [
            'chatSidebar', 'collapseSidebar', 'toggleSidebar', 'uploadSection', 'dropzone', 
            'fileInput', 'workspace', 'xAxisSelect', 'yAxisSelect', 'colorSelect', 
            'dataTableHead', 'dataTableBody', 'notebookBody', 'loadingOverlay', 'loadingText', 
            'rowCount', 'newDatasetBtn', 'themeToggle', 'cleanData', 'exportPdf', 'exportExcel', 
            'tableSearch', 'clearSearch', 'runAutoEDA', 'corrBtn', 'trainML', 'transformBtn', 
            'dataSummary', 'aiInsights', 'historyControls', 'shortcutsBtn', 'tableContainer', 
            'dataTable', 'mlModal', 'transformModal', 'mlAlgorithm', 'polyDegree', 'mlEpochs', 
            'mlLearningRate', 'trainSplit', 'kmeansClusters', 'kClusters', 'transformType', 'transformColumn'
        ];
        elements.forEach(id => dom[id] = document.getElementById(id));
        
        commandPalette = new CommandPalette();
        attachListeners();
        setupDragAndDrop();
        setupKeyboardShortcuts();
        setupResizeObserver();
        
        const savedTheme = localStorage.getItem('datamining-theme');
        if (savedTheme) { 
            state.theme = savedTheme; 
            document.body.className = savedTheme; 
        }
    }

    function attachListeners() {
        dom.dropzone.onclick = () => dom.fileInput.click();
        
        dom.fileInput.onchange = (e) => { 
            if (e.target.files[0]) handleFile(e.target.files[0]); 
        };
        
        dom.toggleSidebar.onclick = dom.collapseSidebar.onclick = () => {
            dom.chatSidebar.classList.toggle('collapsed');
        };
        
        document.querySelectorAll('[data-chart]').forEach(btn => {
            btn.onclick = () => addChart(btn.dataset.chart);
        });
        
        dom.newDatasetBtn.onclick = () => location.reload();
        dom.themeToggle.onclick = toggleTheme;
        dom.cleanData.onclick = cleanData;
        dom.tableSearch.oninput = (e) => filterTable(e.target.value);
        dom.clearSearch.onclick = () => { dom.tableSearch.value = ''; renderTable(); };
        dom.exportPdf.onclick = exportPDF;
        dom.exportExcel.onclick = exportExcel;
        dom.runAutoEDA.onclick = runAutoEDA;
        dom.corrBtn.onclick = generateCorrelationMatrix;
        dom.trainML.onclick = openMLModal;
        dom.transformBtn.onclick = openTransformModal;
        dom.shortcutsBtn.onclick = () => openModal('shortcutsModal');
        
        document.getElementById('undoBtn').onclick = undo;
        document.getElementById('redoBtn').onclick = redo;
        
        if (dom.mlAlgorithm) {
            dom.mlAlgorithm.onchange = (e) => {
                dom.kmeansClusters.style.display = e.target.value === 'kmeans' ? 'block' : 'none';
            };
        }
    }

    function setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dom.dropzone.addEventListener(eventName, (e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
            }, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dom.dropzone.addEventListener(eventName, () => dom.dropzone.classList.add('dragover'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dom.dropzone.addEventListener(eventName, () => dom.dropzone.classList.remove('dragover'), false);
        });
        
        dom.dropzone.addEventListener('drop', (e) => { 
            const files = e.dataTransfer.files; 
            if (files.length) handleFile(files[0]); 
        }, false);
    }

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'z': e.preventDefault(); undo(); break;
                    case 'y': e.preventDefault(); redo(); break;
                    case 'n': e.preventDefault(); location.reload(); break;
                    case 'f': e.preventDefault(); dom.tableSearch.focus(); break;
                    case 'e': e.preventDefault(); exportPDF(); break;
                    case 't': e.preventDefault(); toggleTheme(); break;
                    case 'r': e.preventDefault(); runAutoEDA(); break;
                }
            }
        });
    }

    function toggleTheme() {
        state.theme = state.theme === 'theme-dark' ? 'theme-light' : 'theme-dark';
        document.body.className = state.theme;
        localStorage.setItem('datamining-theme', state.theme);
        updateAllChartsTheme();
        notifications.show(`Switched to ${state.theme === 'theme-dark' ? 'dark' : 'light'} mode`, 'success');
    }

    function handleFile(file) {
        showLoading('Reading your file...');
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (extension === 'csv') parseCSV(file);
        else if (['xlsx', 'xls'].includes(extension)) parseExcel(file);
        else if (extension === 'json') parseJSON(file);
        else { 
            hideLoading(); 
            notifications.show('Oops, I only understand CSV, Excel, or JSON files right now.', 'error'); 
        }
    }

    function parseCSV(file) {
        Papa.parse(file, {
            header: true,
            dynamicTyping: (field) => { 
                if (typeof field === 'string' && /^0\d{3,}$/.test(field)) return false; 
                return true; 
            },
            skipEmptyLines: true,
            complete: (results) => { 
                if (results.errors.length > 0) console.warn('CSV parsing warnings:', results.errors); 
                processData(results.data, results.meta.fields, file.name); 
            },
            error: (error) => { 
                hideLoading(); 
                notifications.show(`Hmm, couldn't parse the CSV: ${error.message}`, 'error'); 
            }
        });
    }

    function parseExcel(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                
                if (jsonData.length > 0) { 
                    const columns = Object.keys(jsonData[0]); 
                    processData(jsonData, columns, file.name); 
                } else { 
                    hideLoading(); 
                    notifications.show("Looks like that Excel file is empty.", 'warning'); 
                }
            } catch (error) { 
                hideLoading(); 
                notifications.show(`Couldn't read the Excel file: ${error.message}`, 'error'); 
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function parseJSON(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                let data = Array.isArray(jsonData) ? jsonData : [jsonData];
                if (data.length > 0) { 
                    const columns = Object.keys(data[0]); 
                    processData(data, columns, file.name); 
                }
            } catch (error) { 
                hideLoading(); 
                notifications.show(`The JSON file seems invalid: ${error.message}`, 'error'); 
            }
        };
        reader.readAsText(file);
    }

    window.loadSample = function(name) {
        const sample = sampleDatasets[name];
        if (sample) {
            showLoading(`Loading the ${name} dataset...`);
            Papa.parse(sample.data, { 
                header: true, 
                dynamicTyping: true, 
                skipEmptyLines: true, 
                complete: (results) => { 
                    processData(results.data, results.meta.fields, sample.name); 
                    notifications.show(`Successfully loaded the ${name} dataset`, 'success'); 
                } 
            });
        }
    };

    function processData(data, columns, fileName) {
        if (!data || data.length === 0) { 
            hideLoading(); 
            notifications.show("We didn't find any rows in that file.", 'error'); 
            return; 
        }
        
        state.raw = data;
        state.data = [...data]; 
        state.columns = columns; 
        state.fileName = fileName;
        
        detectColumnTypes();
        history.pushState(state.data, state.columns, state.fileName);
        setupWorkspace();
        hideLoading();
        
        notifications.show(`Great! Loaded ${data.length} rows across ${columns.length} columns.`, 'success');
        
        if (data.length < 1000) setTimeout(runAutoEDA, 500);
    }

    function detectColumnTypes() {
        state.columnTypes = {};
        state.columns.forEach(col => {
            const sample = state.data.slice(0, 50).map(d => d[col]).filter(v => v !== null && v !== undefined && v !== '');
            if (sample.length === 0) {
                state.columnTypes[col] = 'unknown';
                return;
            }
            const dateCount = sample.filter(v => !isNaN(Date.parse(v)) && String(v).length > 6).length;
            if (dateCount > sample.length * 0.7) {
                state.columnTypes[col] = 'date';
            } else if (sample.every(v => !isNaN(v) && typeof v !== 'boolean')) {
                state.columnTypes[col] = 'number';
            } else {
                state.columnTypes[col] = 'string';
            }
        });
    }

    function setupWorkspace() {
        dom.uploadSection.style.display = 'none';
        dom.workspace.style.display = 'flex'; 
        dom.dataSummary.style.display = 'flex'; 
        dom.historyControls.style.display = 'flex';
        
        const options = state.columns.map(c => `<option value="${c}">${c}</option>`).join('');
        dom.xAxisSelect.innerHTML = `<option value="">Select X-Axis</option>${options}`;
        dom.yAxisSelect.innerHTML = `<option value="">Select Y-Axis</option>${options}`;
        dom.colorSelect.innerHTML = `<option value="">Group Color (optional)</option>${options}`;
        
        if (dom.transformColumn) {
            dom.transformColumn.innerHTML = `<option value="">Choose target column...</option>${options}`;
        }
        
        renderTable(); 
        updateAIInsights();
    }

    let currentSort = { column: null, direction: 'asc' };
    
    function renderTable(displayData = state.data, start = 0, count = 100) {
        dom.rowCount.textContent = `${displayData.length.toLocaleString()} Total Rows`;
        
        dom.dataTableHead.innerHTML = `<tr>${state.columns.map(c => {
            const typeIcon = state.columnTypes[c] === 'number' ? 'hashtag' : state.columnTypes[c] === 'date' ? 'calendar' : 'font';
            const sortIcon = currentSort.column === c ? (currentSort.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';
            return `<th onclick="sortTable('${c}')"><i class="fas fa-${typeIcon} type-icon type-${state.columnTypes[c]}"></i>${c}<i class="fas ${sortIcon} sort-icon"></i></th>`;
        }).join('')}</tr>`;
        
        const end = Math.min(start + count, displayData.length);
        const rows = displayData.slice(start, end).map(row => `<tr>${state.columns.map(c => { 
            const val = row[c]; 
            let display = val === null || val === undefined || val === '' 
                ? '<em style="opacity:0.3;">null</em>' 
                : String(val).substring(0, 100); 
            return `<td>${display}</td>`; 
        }).join('')}</tr>`).join('');
        
        if (start === 0) {
            dom.dataTableBody.innerHTML = rows; 
        } else {
            dom.dataTableBody.innerHTML += rows;
        }
        
        setupVirtualScroll(displayData);
    }

    function setupVirtualScroll(displayData) {
        dom.tableContainer.onscroll = () => {
            const scrollBottom = dom.tableContainer.scrollTop + dom.tableContainer.clientHeight;
            if (scrollBottom >= dom.tableContainer.scrollHeight - 100) {
                const currentRows = dom.dataTableBody.querySelectorAll('tr').length;
                if (currentRows < displayData.length) {
                    renderTable(displayData, currentRows, 100);
                }
            }
        };
    }

    window.sortTable = function(column) {
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else { 
            currentSort.column = column; 
            currentSort.direction = 'asc'; 
        }
        
        const sorted = [...state.data].sort((a, b) => {
            let valA = a[column], valB = b[column];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;
            if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        state.data = sorted; 
        renderTable();
    };

    function filterTable(query) {
        if (!query) { 
            renderTable(); 
            return; 
        }
        const lowerQuery = query.toLowerCase();
        const filtered = state.data.filter(row => 
            Object.values(row).some(v => String(v).toLowerCase().includes(lowerQuery))
        );
        renderTable(filtered);
    }

    window.undo = function() { 
        const prevState = history.undo(); 
        if (prevState) { 
            state.data = prevState.data; 
            state.columns = prevState.columns; 
            state.fileName = prevState.fileName; 
            renderTable(); 
            notifications.show('Undo successful', 'info'); 
        } 
    };
    
    window.redo = function() { 
        const nextState = history.redo(); 
        if (nextState) { 
            state.data = nextState.data; 
            state.columns = nextState.columns; 
            state.fileName = nextState.fileName; 
            renderTable(); 
            notifications.show('Redo successful', 'info'); 
        } 
    };

    window.cleanData = function() {
        const before = state.data.length; 
        const beforeNulls = countNulls(state.data);
        
        state.data = state.data.filter(r => 
            Object.values(r).some(v => v !== null && v !== '' && v !== undefined)
        );
        
        const afterNulls = countNulls(state.data); 
        const removed = before - state.data.length;
        
        history.pushState(state.data, state.columns, state.fileName); 
        renderTable();
        
        notifications.show(`Cleaned! Removed ${removed} completely empty rows.`, 'success');
        addInsight('Data Cleaning', `Removed ${removed} empty rows. Dropped total missing values from ${beforeNulls} to ${afterNulls}.`);
    };
    
    function countNulls(data) { 
        return data.reduce((count, row) => 
            count + Object.values(row).filter(v => v === null || v === '' || v === undefined).length, 0
        ); 
    }

    window.runSmartImputation = function() {
        let affectedCells = 0;
        state.columns.forEach(col => {
            const values = state.data.map(d => d[col]).filter(v => v !== null && v !== '' && v !== undefined);
            if (values.length > 0) {
                let fillValue;
                if (state.columnTypes[col] === 'number') {
                    fillValue = ss.median(values.map(Number));
                } else {
                    const counts = {};
                    values.forEach(v => counts[v] = (counts[v] || 0) + 1);
                    fillValue = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
                }
                state.data.forEach(row => {
                    if (row[col] === null || row[col] === undefined || row[col] === '') {
                        row[col] = fillValue;
                        affectedCells++;
                    }
                });
            }
        });
        history.pushState(state.data, state.columns, state.fileName);
        renderTable();
        notifications.show(`Smart Imputation: Filled ${affectedCells} missing values.`, 'success');
        addInsight('Smart Imputation', `Auto-filled ${affectedCells} missing values across the dataset.`);
    };

    window.openTransformModal = function() { 
        openModal('transformModal'); 
    };

    window.applyTransformation = function() {
        const type = dom.transformType.value;
        const column = dom.transformColumn.value;
        
        if (!column) { 
            notifications.show('Please select a column to transform.', 'warning'); 
            return; 
        }
        
        showLoading('Applying the math...');
        
        setTimeout(() => {
            try {
                let transformedCount = 0;
                switch(type) {
                    case 'normalize': transformedCount = normalizeColumn(column); break;
                    case 'standardize': transformedCount = standardizeColumn(column); break;
                    case 'log': transformedCount = logTransform(column); break;
                    case 'sqrt': transformedCount = sqrtTransform(column); break;
                    case 'outlier-iqr': transformedCount = removeOutliersIQR(column); break;
                    case 'outlier-zscore': transformedCount = removeOutliersZScore(column); break;
                    case 'fill-mean': transformedCount = fillMissing(column, 'mean'); break;
                    case 'fill-median': transformedCount = fillMissing(column, 'median'); break;
                    case 'fill-forward': transformedCount = fillMissing(column, 'forward'); break;
                    case 'onehot': transformedCount = oneHotEncode(column); break;
                }
                
                history.pushState(state.data, state.columns, state.fileName);
                renderTable(); 
                closeModal('transformModal');
                notifications.show(`Success! Affected ${transformedCount} values.`, 'success');
                
            } catch (error) { 
                notifications.show(`Hmm, that didn't work: ${error.message}`, 'error'); 
            }
            hideLoading();
        }, 100);
    };

    function normalizeColumn(column) {
        const values = state.data.map(d => d[column]).filter(v => typeof v === 'number' && !isNaN(v));
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        
        state.data.forEach(row => { 
            if (typeof row[column] === 'number') row[column] = (row[column] - min) / range; 
        });
        return values.length;
    }
    
    function standardizeColumn(column) {
        const values = state.data.map(d => d[column]).filter(v => typeof v === 'number' && !isNaN(v));
        const mean = ss.mean(values);
        const std = ss.sampleStandardDeviation(values);
        
        state.data.forEach(row => { 
            if (typeof row[column] === 'number') row[column] = (row[column] - mean) / std; 
        });
        return values.length;
    }
    
    function logTransform(column) { 
        let count = 0; 
        state.data.forEach(row => { 
            if (typeof row[column] === 'number' && row[column] > 0) { 
                row[column] = Math.log(row[column]); 
                count++; 
            } 
        }); 
        return count; 
    }
    
    function sqrtTransform(column) { 
        let count = 0; 
        state.data.forEach(row => { 
            if (typeof row[column] === 'number' && row[column] >= 0) { 
                row[column] = Math.sqrt(row[column]); 
                count++; 
            } 
        }); 
        return count; 
    }
    
    function removeOutliersIQR(column) {
        const values = state.data.map(d => d[column]).filter(v => typeof v === 'number' && !isNaN(v));
        const q1 = ss.quantile(values, 0.25);
        const q3 = ss.quantile(values, 0.75);
        const iqr = q3 - q1;
        const lower = q1 - 1.5 * iqr;
        const upper = q3 + 1.5 * iqr;
        const before = state.data.length;
        
        state.data = state.data.filter(row => { 
            const val = row[column]; 
            return typeof val !== 'number' || (val >= lower && val <= upper); 
        });
        return before - state.data.length;
    }
    
    function removeOutliersZScore(column) {
        const values = state.data.map(d => d[column]).filter(v => typeof v === 'number' && !isNaN(v));
        const mean = ss.mean(values);
        const std = ss.sampleStandardDeviation(values);
        const before = state.data.length;
        
        state.data = state.data.filter(row => { 
            const val = row[column]; 
            return typeof val !== 'number' || Math.abs((val - mean) / std) <= 3; 
        });
        return before - state.data.length;
    }
    
    function fillMissing(column, method) {
        const values = state.data.map(d => d[column]).filter(v => v !== null && v !== '' && v !== undefined);
        let fillValue;
        
        if (method === 'mean') fillValue = ss.mean(values.filter(v => typeof v === 'number'));
        else if (method === 'median') fillValue = ss.median(values.filter(v => typeof v === 'number'));
        
        let count = 0;
        let lastValue = null;
        
        state.data.forEach(row => {
            if (row[column] === null || row[column] === '' || row[column] === undefined) {
                if (method === 'forward' && lastValue !== null) { 
                    row[column] = lastValue; 
                    count++; 
                } else if (method !== 'forward') { 
                    row[column] = fillValue; 
                    count++; 
                }
            } else {
                lastValue = row[column];
            }
        });
        return count;
    }
    
    function oneHotEncode(column) {
        const uniqueValues = [...new Set(state.data.map(d => d[column]))];
        
        state.data.forEach(row => { 
            uniqueValues.forEach(uv => { 
                row[`${column}_${uv}`] = row[column] === uv ? 1 : 0; 
            }); 
        });
        
        uniqueValues.forEach(uv => { 
            const newCol = `${column}_${uv}`; 
            if (!state.columns.includes(newCol)) { 
                state.columns.push(newCol); 
                state.columnTypes[newCol] = 'number'; 
            } 
        });
        return uniqueValues.length;
    }

    window.runAutoEDA = function() {
        showLoading('Checking out the data geometry...');
        setTimeout(() => {
            try {
                const insights = []; 
                const totalCells = state.data.length * state.columns.length;
                const nullCount = state.data.reduce((acc, row) => 
                    acc + state.columns.filter(col => row[col] === null || row[col] === '' || row[col] === undefined).length, 0
                );
                
                const nullPct = ((nullCount / totalCells) * 100).toFixed(1);
                insights.push({ 
                    title: 'Dataset Anatomy', 
                    content: `You're looking at ${state.data.length.toLocaleString()} rows by ${state.columns.length} columns. Around ${nullPct}% of the cells are empty.` 
                });
                
                const numericCols = state.columns.filter(c => state.columnTypes[c] === 'number');
                numericCols.slice(0, 5).forEach(col => {
                    const values = state.data.map(d => d[col]).filter(v => typeof v === 'number' && !isNaN(v));
                    if (values.length === 0) return;
                    const stats = { 
                        mean: ss.mean(values).toFixed(2), 
                        median: ss.median(values).toFixed(2), 
                        std: ss.sampleStandardDeviation(values).toFixed(2) 
                    };
                    insights.push({ 
                        title: `Column: ${col}`, 
                        content: `Averages at ${stats.mean} with a median of ${stats.median}. The spread (std dev) is ${stats.std}.` 
                    });
                });
                
                displayInsights(insights); 
                createEDACell(insights, nullPct);
                notifications.show('Data profile ready to view.', 'success');
            } catch (error) { 
                notifications.show(`We ran into a hiccup profiling: ${error.message}`, 'error'); 
            }
            hideLoading();
        }, 100);
    };

    function displayInsights(insights) { 
        dom.aiInsights.innerHTML = insights.map(i => `
            <div class="insight-card">
                <h4>${i.title}</h4>
                <p>${i.content}</p>
            </div>
        `).join(''); 
    }
    
    function updateAIInsights() { 
        if (state.data.length === 0) return; 
        displayInsights([{ 
            title: 'System Ready', 
            content: `Loaded ${state.data.length.toLocaleString()} rows. Try hitting the 'Profile' button to get to know your data better.` 
        }]); 
    }
    
    function createEDACell(insights, nullPct) {
        state.cellCounter++;
        const card = document.createElement('div'); 
        card.className = 'nb-cell-card';
        
        card.innerHTML = `
            <div class="nb-cell-header">
                <span>Data Summary Report</span>
                <div class="nb-cell-actions">
                    <button class="nb-cell-btn" onclick="this.closest('.nb-cell-card').remove()"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div style="padding: 20px;">
                <div class="nb-metrics" style="margin-bottom: 20px;">
                    <div class="metric-box">
                        <div class="metric-value">${state.data.length}</div>
                        <div class="metric-label">Rows</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-value">${state.columns.length}</div>
                        <div class="metric-label">Columns</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-value">${nullPct}%</div>
                        <div class="metric-label">Missing Data</div>
                    </div>
                </div>
                ${insights.slice(1).map(i => `
                    <div style="padding: 10px; border-bottom: 1px solid var(--border); font-size: 13px;">
                        <strong>${i.title}</strong><br>
                        <span style="color: var(--text-secondary);">${i.content}</span>
                    </div>
                `).join('')}
            </div>`;
        dom.notebookBody.prepend(card);
    }
    
    function addInsight(title, content) {
        const card = document.createElement('div'); 
        card.className = 'insight-card'; 
        card.innerHTML = `<h4>${title}</h4><p>${content}</p>`;
        
        dom.aiInsights.prepend(card); 
        while (dom.aiInsights.children.length > 10) dom.aiInsights.lastChild.remove();
    }

    window.generateCorrelationMatrix = function() {
        const numCols = state.columns.filter(c => state.columnTypes[c] === 'number');
        if (numCols.length < 2) { 
            notifications.show('You need at least 2 numeric columns for a correlation matrix.', 'warning'); 
            return; 
        }
        
        showLoading('Calculating relationships...');
        setTimeout(() => {
            try {
                state.cellCounter++; 
                const cellId = `corr-${state.cellCounter}`;
                
                const zValues = numCols.map(colA => numCols.map(colB => {
                    const vA = state.data.map(d => d[colA]).filter(v => typeof v === 'number' && !isNaN(v));
                    const vB = state.data.map(d => d[colB]).filter(v => typeof v === 'number' && !isNaN(v));
                    const minLen = Math.min(vA.length, vB.length);
                    if (minLen < 2) return 0;
                    const corr = ss.sampleCorrelation(vA.slice(0, minLen), vB.slice(0, minLen));
                    return isNaN(corr) ? 0 : parseFloat(corr.toFixed(2));
                }));
                
                createCell(cellId, "Pearson Correlation Heatmap");
                const layout = { 
                    margin: { t: 40, r: 30, l: 100, b: 100 }, 
                    paper_bgcolor: 'transparent', 
                    plot_bgcolor: 'transparent', 
                    font: { color: state.theme === 'theme-dark' ? '#94a3b8' : '#1e293b' }, 
                    xaxis: { tickangle: -45 }, 
                    yaxis: { autorange: 'reversed' } 
                };
                
                Plotly.newPlot(cellId, [{ 
                    z: zValues, x: numCols, y: numCols, type: 'heatmap', colorscale: 'RdBu', zmid: 0, zmin: -1, zmax: 1 
                }], layout, { responsive: true });
                
                state.charts.push(cellId); 
                notifications.show('Correlation matrix generated successfully!', 'success');
            } catch (error) { 
                notifications.show(`We couldn't generate the matrix: ${error.message}`, 'error'); 
            }
            hideLoading();
        }, 100);
    };

    window.openMLModal = function() { openModal('mlModal'); };

    window.runAdvancedML = async function() {
        const algorithm = dom.mlAlgorithm.value;
        const xCol = dom.xAxisSelect.value;
        const yCol = dom.yAxisSelect.value;
        
        if (!xCol) { 
            notifications.show('Please select an X-Axis to train on.', 'warning'); 
            return; 
        }
        if (algorithm !== 'kmeans' && !yCol) { 
            notifications.show('Please select a Y-Axis to predict.', 'warning'); 
            return; 
        }
        
        closeModal('mlModal'); 
        showLoading(`Spinning up a ${algorithm} model...`);
        
        try {
            switch(algorithm) {
                case 'linear': await trainLinearRegression(xCol, yCol); break;
                case 'polynomial': await trainPolynomialRegression(xCol, yCol); break;
                case 'decision-tree': await trainDecisionTree(xCol, yCol); break;
                case 'kmeans': await trainKMeans(xCol, yCol); break;
            }
            notifications.show('Model training finished!', 'success');
        } catch (error) { 
            notifications.show(`Training hit a snag: ${error.message}`, 'error'); 
        }
        hideLoading();
    };

    async function trainLinearRegression(xCol, yCol) {
        const epochs = parseInt(dom.mlEpochs.value) || 50;
        const lr = parseFloat(dom.mlLearningRate.value) || 0.01;
        const split = parseFloat(dom.trainSplit.value) || 0.8;
        
        const cleanData = state.data.filter(d => typeof d[xCol] === 'number' && typeof d[yCol] === 'number');
        if (cleanData.length < 10) throw new Error('Not enough numeric data points to learn from.');
        
        const splitIdx = Math.floor(cleanData.length * split);
        const trainX = cleanData.slice(0, splitIdx).map(d => d[xCol]);
        const trainY = cleanData.slice(0, splitIdx).map(d => d[yCol]);
        const testX = cleanData.slice(splitIdx).map(d => d[xCol]);
        const testY = cleanData.slice(splitIdx).map(d => d[yCol]);
        
        const model = tf.sequential(); 
        model.add(tf.layers.dense({units: 1, inputShape: [1]}));
        model.compile({loss: 'meanSquaredError', optimizer: tf.train.sgd(lr)});
        
        const xs = tf.tensor2d(trainX, [trainX.length, 1]);
        const ys = tf.tensor2d(trainY, [trainY.length, 1]);
        
        await model.fit(xs, ys, {epochs: epochs, verbose: 0});
        
        const allX = cleanData.map(d => d[xCol]);
        const predictions = Array.from(model.predict(tf.tensor2d(allX, [allX.length, 1])).dataSync());
        const r2 = calculateR2(testY, Array.from(model.predict(tf.tensor2d(testX, [testX.length, 1])).dataSync()));
        
        createMLCell('Linear Regression', xCol, yCol, cleanData, predictions, { 
            'Accuracy (R²)': r2.toFixed(4), 
            'Epochs': epochs 
        });
        
        xs.dispose(); ys.dispose(); model.dispose();
    }

    async function trainPolynomialRegression(xCol, yCol) {
        const degree = parseInt(dom.polyDegree.value) || 2;
        const epochs = parseInt(dom.mlEpochs.value) || 100;
        const lr = parseFloat(dom.mlLearningRate.value) || 0.001;
        
        const cleanData = state.data.filter(d => typeof d[xCol] === 'number' && typeof d[yCol] === 'number');
        const x = cleanData.map(d => d[xCol]);
        const y = cleanData.map(d => d[yCol]);
        const xMean = ss.mean(x);
        const xStd = ss.sampleStandardDeviation(x) || 1;
        
        const features = x.map(v => { 
            const norm = (v - xMean) / xStd; 
            const row = [1]; 
            for (let i = 1; i <= degree; i++) row.push(Math.pow(norm, i)); 
            return row; 
        });
        
        const model = tf.sequential(); 
        model.add(tf.layers.dense({units: 1, inputShape: [degree + 1]}));
        model.compile({loss: 'meanSquaredError', optimizer: tf.train.adam(lr)});
        
        const xs = tf.tensor2d(features);
        const ys = tf.tensor2d(y, [y.length, 1]);
        
        await model.fit(xs, ys, {epochs: epochs, verbose: 0});
        const predictions = Array.from(model.predict(xs).dataSync());
        
        createMLCell(`Polynomial Pattern (Degree ${degree})`, xCol, yCol, cleanData, predictions, { 
            'Accuracy (R²)': calculateR2(y, predictions).toFixed(4) 
        });
        
        xs.dispose(); ys.dispose(); model.dispose();
    }

    async function trainDecisionTree(xCol, yCol) {
        const cleanData = state.data.filter(d => typeof d[xCol] === 'number' && typeof d[yCol] === 'number');
        const x = cleanData.map(d => d[xCol]);
        const y = cleanData.map(d => d[yCol]);
        
        const tree = buildTree(x, y, 0, 3); 
        const predictions = x.map(v => predictTree(tree, v));
        
        createMLCell('Decision Tree Result', xCol, yCol, cleanData, predictions, { 
            'Accuracy (R²)': calculateR2(y, predictions).toFixed(4), 
            'Depth': 3 
        });
    }

    async function trainKMeans(xCol, yCol) {
        const k = parseInt(dom.kClusters.value) || 3;
        const points = state.data.filter(d => typeof d[xCol] === 'number')
            .map(d => yCol ? [d[xCol], d[yCol]] : [d[xCol], 0]);
        
        let centroids = points.slice(0, k);
        let assignments = new Array(points.length);
        let iter = 0;
        
        while (iter < 100) {
            let changed = false;
            for (let i = 0; i < points.length; i++) {
                let minDist = Infinity, best = 0;
                for (let j = 0; j < k; j++) { 
                    const d = euclideanDistance(points[i], centroids[j]); 
                    if (d < minDist) { minDist = d; best = j; } 
                }
                if (assignments[i] !== best) { 
                    assignments[i] = best; 
                    changed = true; 
                }
            }
            if (!changed) break;
            
            for (let j = 0; j < k; j++) { 
                const cp = points.filter((_, i) => assignments[i] === j);
                if (cp.length > 0) {
                    centroids[j] = cp[0].map((_, dim) => ss.mean(cp.map(p => p[dim])));
                }
            }
            iter++;
        }
        
        createKMeansCell(points, assignments, centroids, xCol, yCol || xCol, k, iter);
    }

    function buildTree(x, y, depth, maxDepth) {
        if (depth >= maxDepth || x.length < 5) return {value: ss.mean(y), leaf: true};
        let bestSplit = null, bestMSE = Infinity;
        const sortedX = [...x].sort((a, b) => a - b);
        
        for (let i = 1; i < sortedX.length - 1; i += Math.max(1, Math.floor(sortedX.length / 20))) {
            const split = sortedX[i];
            const leftY = y.filter((_, idx) => x[idx] <= split);
            const rightY = y.filter((_, idx) => x[idx] > split);
            if (leftY.length < 2 || rightY.length < 2) continue;
            
            const totalMSE = ss.sampleVariance(leftY) * leftY.length + ss.sampleVariance(rightY) * rightY.length;
            if (totalMSE < bestMSE) { bestMSE = totalMSE; bestSplit = split; }
        }
        
        if (!bestSplit) return {value: ss.mean(y), leaf: true};
        
        return { 
            split: bestSplit, 
            left: buildTree(x.filter(v => v <= bestSplit), y.filter((_, i) => x[i] <= bestSplit), depth + 1, maxDepth), 
            right: buildTree(x.filter(v => v > bestSplit), y.filter((_, i) => x[i] > bestSplit), depth + 1, maxDepth), 
            leaf: false 
        };
    }
    
    function predictTree(tree, x) { 
        return tree.leaf ? tree.value : (x <= tree.split ? predictTree(tree.left, x) : predictTree(tree.right, x)); 
    }
    
    function euclideanDistance(a, b) { 
        return Math.sqrt(a.reduce((s, v, i) => s + Math.pow(v - b[i], 2), 0)); 
    }
    
    function calculateR2(actual, predicted) { 
        const mean = ss.mean(actual); 
        const ssTot = actual.reduce((s, v) => s + Math.pow(v - mean, 2), 0);
        const ssRes = actual.reduce((s, v, i) => s + Math.pow(v - predicted[i], 2), 0);
        return ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
    }

    function createMLCell(title, xCol, yCol, data, predictions, metrics) {
        state.cellCounter++;
        const cellId = `ml-${state.cellCounter}`;
        const residId = `resid-${state.cellCounter}`;
        const card = document.createElement('div');
        card.className = 'nb-cell-card';
        
        card.innerHTML = `
            <div class="nb-cell-header">
                <span>${title}: ${yCol} ~ ${xCol}</span>
                <div class="nb-cell-actions">
                    <button class="nb-cell-btn" onclick="this.closest('.nb-cell-card').remove()"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="nb-metrics">
                ${Object.entries(metrics).map(([k, v]) => `
                    <div class="metric-box">
                        <div class="metric-value">${v}</div>
                        <div class="metric-label">${k}</div>
                    </div>
                `).join('')}
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; padding-bottom: 15px;">
                <div id="${cellId}" class="nb-chart-area" style="min-height: 350px;"></div>
                <div id="${residId}" class="nb-chart-area" style="min-height: 350px;"></div>
            </div>
        `;
        
        dom.notebookBody.prepend(card);

        const fontColor = state.theme === 'theme-dark' ? '#94a3b8' : '#1e293b';

        const t1 = { x: data.map(d => d[xCol]), y: data.map(d => d[yCol]), mode: 'markers', name: 'Actual Points', marker: { color: '#7c3aed' } };
        const t2 = { x: data.map(d => d[xCol]), y: predictions, mode: 'lines', name: 'AI Prediction', line: { color: '#06b6d4' } };
        
        Plotly.newPlot(cellId, [t1, t2], { 
            title: 'Model Fit',
            paper_bgcolor: 'transparent', 
            plot_bgcolor: 'transparent', 
            font: { color: fontColor },
            margin: { t: 40, r: 20, l: 40, b: 40 }
        }, {responsive: true});

        const residuals = data.map((d, i) => d[yCol] - predictions[i]);
        const tResid = { x: predictions, y: residuals, mode: 'markers', name: 'Error', marker: {color: '#ef4444'} };
        
        Plotly.newPlot(residId, [tResid], { 
            title: 'Residual Plot (Error Analysis)', 
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: fontColor },
            margin: { t: 40, r: 20, l: 40, b: 40 }
        }, {responsive: true});
        
        state.charts.push(cellId, residId);
    }

    function createKMeansCell(points, assignments, centroids, xCol, yCol, k, iter) {
        state.cellCounter++; 
        const cellId = `kmeans-${state.cellCounter}`;
        const card = document.createElement('div'); 
        card.className = 'nb-cell-card';
        
        card.innerHTML = `
            <div class="nb-cell-header">
                <span>K-Means Clusters (k=${k})</span>
                <div class="nb-cell-actions">
                    <button class="nb-cell-btn" onclick="this.closest('.nb-cell-card').remove()"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div id="${cellId}" class="nb-chart-area"></div>
        `;
        dom.notebookBody.prepend(card);
        
        const colors = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];
        const traces = [];
        
        for (let i = 0; i < k; i++) {
            const cp = points.filter((_, idx) => assignments[idx] === i);
            traces.push({ 
                x: cp.map(p => p[0]), 
                y: cp.map(p => p[1]), 
                mode: 'markers', 
                name: `Group ${i + 1}`, 
                marker: { color: colors[i % colors.length] } 
            });
        }
        
        traces.push({ 
            x: centroids.map(c => c[0]), 
            y: centroids.map(c => c[1]), 
            mode: 'markers', 
            name: 'Cluster Centers', 
            marker: { color: '#000', symbol: 'x', size: 12 } 
        });
        
        Plotly.newPlot(cellId, traces, { 
            paper_bgcolor: 'transparent', 
            plot_bgcolor: 'transparent', 
            font: { color: state.theme === 'theme-dark' ? '#94a3b8' : '#1e293b' } 
        }, {responsive: true});
        
        state.charts.push(cellId);
    }

    window.addChart = function(type) {
        const xCol = dom.xAxisSelect.value; 
        const yCol = dom.yAxisSelect.value;
        
        if (!xCol) { 
            notifications.show('Oops, you need to select an X-Axis first.', 'warning'); 
            return; 
        }
        
        state.cellCounter++; 
        const cellId = `chart-${state.cellCounter}`;
        createCell(cellId, `${type.toUpperCase()} Visual`);
        
        let traces = [];
        const layout = { 
            margin: { t: 40, r: 30, l: 50, b: 50 }, 
            paper_bgcolor: 'transparent', 
            plot_bgcolor: 'transparent', 
            font: { color: state.theme === 'theme-dark' ? '#94a3b8' : '#1e293b' } 
        };
        
        switch(type) {
            case 'bar': traces = [{ x: state.data.map(d => d[xCol]), y: state.data.map(d => d[yCol]), type: 'bar', marker: {color:'#7c3aed'} }]; break;
            case 'line': traces = [{ x: state.data.map(d => d[xCol]), y: state.data.map(d => d[yCol]), mode: 'lines+markers', line: {color:'#7c3aed'} }]; break;
            case 'scatter': traces = [{ x: state.data.map(d => d[xCol]), y: state.data.map(d => d[yCol]), mode: 'markers', marker: {color:'#7c3aed', opacity:0.6} }]; break;
            case 'box': traces = [{ y: state.data.map(d => d[yCol || xCol]), type: 'box', marker: {color:'#7c3aed'} }]; break;
            case 'histogram': traces = [{ x: state.data.map(d => d[xCol]), type: 'histogram', marker: {color:'#7c3aed'} }]; break;
        }
        
        Plotly.newPlot(cellId, traces, layout, {responsive: true}).then(() => attachChartEvents(cellId));
        state.charts.push(cellId);
    };

    function attachChartEvents(cellId) {
        const el = document.getElementById(cellId);
        if (!el) return;
        
        el.on('plotly_selected', (ed) => {
            if (ed && ed.points) {
                const idx = ed.points.map(p => p.pointNumber);
                const filtered = idx.map(i => state.data[i]).filter(Boolean);
                if (filtered.length) { 
                    renderTable(filtered); 
                    notifications.show(`Isolated ${filtered.length} points in the table.`, 'info'); 
                }
            }
        });
    }

    function createCell(id, title) {
        const card = document.createElement('div'); 
        card.className = 'nb-cell-card';
        card.innerHTML = `
            <div class="nb-cell-header">
                <span>${title}</span>
                <div class="nb-cell-actions">
                    <button class="nb-cell-btn" onclick="this.closest('.nb-cell-card').remove()"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div id="${id}" class="nb-chart-area"></div>
        `;
        dom.notebookBody.prepend(card);
    }

    window.exportPDF = async function() {
        if (!state.charts.length) { 
            notifications.show('Hmm, there are no charts to export yet.', 'warning'); 
            return; 
        }
        
        showLoading('Crafting your PDF report...');
        try {
            const { jsPDF } = window.jspdf; 
            const pdf = new jsPDF();
            
            pdf.text(`Insights Report: ${state.fileName}`, 10, 10);
            let y = 20;
            
            for (const id of state.charts) {
                const el = document.getElementById(id); 
                if (!el) continue;
                
                const canvas = await html2canvas(el);
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, y, 180, 100);
                
                y += 110; 
                if (y > 250) { 
                    pdf.addPage(); 
                    y = 10; 
                }
            }
            pdf.save('insights-report.pdf'); 
            notifications.show('PDF ready for download!', 'success');
        } catch (e) { 
            notifications.show(`PDF creation failed: ${e.message}`, 'error'); 
        }
        hideLoading();
    };

    window.exportExcel = async function() {
        showLoading('Packaging into Excel...');
        try {
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.data), 'Data Insights');
            XLSX.writeFile(wb, 'data-export.xlsx'); 
            notifications.show('Excel file exported!', 'success');
        } catch (e) { 
            notifications.show(`Excel export failed: ${e.message}`, 'error'); 
        }
        hideLoading();
    };

    function showLoading(t) { 
        dom.loadingText.textContent = t; 
        dom.loadingOverlay.style.display = 'flex'; 
    }
    
    function hideLoading() { 
        dom.loadingOverlay.style.display = 'none'; 
    }
    
    window.openModal = function(id) { 
        document.getElementById(id).classList.add('active'); 
    };
    
    window.closeModal = function(id) { 
        document.getElementById(id).classList.remove('active'); 
    };
    
    function updateAllChartsTheme() {
        const color = state.theme === 'theme-dark' ? '#94a3b8' : '#1e293b';
        state.charts.forEach(id => Plotly.relayout(id, { 'font.color': color }));
    }

    function setupResizeObserver() {
        state.resizeObserver = new ResizeObserver(() => {
            state.charts.forEach(id => { 
                const el = document.getElementById(id); 
                if(el) Plotly.Plots.resize(el); 
            });
        });
        if (dom.workspace) state.resizeObserver.observe(dom.workspace);
    }

    document.addEventListener('DOMContentLoaded', init);
})();