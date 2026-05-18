const API_URL = 'http://localhost:5000/api/todos';
let cachedTodos = [];
let productivityChartInstance = null; 
let editTodoModalInstance = null;    


async function fetchTodos() {
    try {
        const response = await fetch(API_URL);
        cachedTodos = await response.json();
        filterAndSearchTodos(); 
    } catch (error) {
        console.error('Data Matrix Syncing Error:', error);
    }
}


function filterAndSearchTodos() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filterStatus = document.getElementById('status-filter').value;

    
    const total = cachedTodos.length;
    const completed = cachedTodos.filter(t => t.status === 'Completed').length;
    const active = total - completed; 
    
    
    const highPriorityCount = cachedTodos.filter(t => t.priority === 'High' || (t.title && t.title.toLowerCase().includes('high'))).length;

   
    document.getElementById('count-total').innerText = total;
    document.getElementById('count-active').innerText = active;
    document.getElementById('count-completed').innerText = completed;
    document.getElementById('count-high').innerText = highPriorityCount;

    updateAnalyticsChart(active, completed);

    let filteredList = cachedTodos.filter(todo => {
        const matchesSearch = (todo.title && todo.title.toLowerCase().includes(searchTerm)) || 
                             (todo.description && todo.description.toLowerCase().includes(searchTerm));
        const matchesStatus = (filterStatus === 'All') || (todo.status === filterStatus);
        return matchesSearch && matchesStatus;
    });

    renderTodos(filteredList);
}


function updateAnalyticsChart(active, completed) {
    const ctx = document.getElementById('productivityChart').getContext('2d');
    
    if (productivityChartInstance) {
        productivityChartInstance.destroy();
    }

    if (active === 0 && completed === 0) {
        active = 1; 
    }

    productivityChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Active Tasks', 'Completed'],
            datasets: [{
                data: [active, completed],
                backgroundColor: ['#0ea5e9', '#22c55e'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            cutout: '75%',
            responsive: true,
            maintainAspectRatio: false
        }
    });
}


function renderTodos(todos) {
    const container = document.getElementById('todo-container');
    container.innerHTML = '';
    document.getElementById('item-showing-text').innerText = `Cluster showing ${todos.length} tracking sequences`;

    if (todos.length === 0) {
        container.innerHTML = `
            <div class="text-center p-5 text-muted bg-glass rounded-4 border border-dashed">
                <i class="bi bi-cpu fs-1 text-purple mb-2 d-block"></i>
                <p class="mt-2 fw-bold mb-0">No data blocks matches query variables.</p>
            </div>`;
        return;
    }

    todos.forEach(todo => {
        const card = document.createElement('div');
        const statusClass = todo.status ? todo.status.toLowerCase() : 'active';
        card.className = `task-card p-4 shadow-sm d-flex justify-content-between align-items-center status-${statusClass}`;

        let priorityLabel = todo.priority || 'Medium';
        let priorityClass = `prio-${priorityLabel.toLowerCase()}`;

        const formattedDate = todo.createdAt ? new Date(todo.createdAt).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'Live Sync Matrix';

      
        const isCompleted = todo.status === 'Completed';

        card.innerHTML = `
            <div class="d-flex align-items-start gap-3" style="max-width: 75%;">
                <div style="cursor:pointer;" class="mt-1" onclick="toggleStatus('${todo._id}', '${todo.status}')" title="${isCompleted ? 'Mark as Active' : 'Mark as Completed'}">
                    <i class="bi ${isCompleted ? 'bi-check-circle-fill text-primary' : 'bi-circle'} fs-4"></i>
                </div>
                <div>
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        <h5 class="fw-bold task-title mb-0" style="${isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${todo.title}</h5>
                        <span class="badge ${priorityClass} small fw-bold px-2 py-0.5 rounded-3" style="font-size:0.7rem;">${priorityLabel}</span>
                    </div>
                    <p class="text-muted small my-1 fw-medium" style="${isCompleted ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${todo.description || 'System cluster infrastructure note empty.'}</p>
                    <div class="text-muted small" style="font-size:0.75rem; font-weight:600;">
                        <i class="bi bi-clock-history me-1"></i> ${formattedDate}
                    </div>
                </div>
            </div>
            
            <div class="d-flex align-items-center gap-1">
                <button class="btn btn-light ${isCompleted ? 'text-primary' : 'text-muted'} action-btn border-0 py-1" onclick="toggleStatus('${todo._id}', '${todo.status}')" title="${isCompleted ? 'Reopen Task' : 'Complete Task'}">
                    <i class="bi ${isCompleted ? 'bi-check-square-fill' : 'bi-check-square'} fs-5"></i>
                </button>
                
                <button class="btn btn-light text-primary action-btn border-0 py-1" onclick="openEditModal('${todo._id}')" title="Edit Matrix">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                
                <button class="btn btn-light text-danger action-btn border-0 py-1" onclick="deleteTodo('${todo._id}')" title="Delete Log">
                    <i class="bi bi-trash3-fill"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

document.getElementById('todo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('todo-input').value.trim();
    const description = document.getElementById('todo-desc').value.trim();
    const status = document.getElementById('todo-status-select').value;
    const priority = document.getElementById('todo-priority-select').value;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, status, priority, completed: status === 'Completed' })
        });

        if (response.ok) {
            document.getElementById('todo-form').reset();
            const collapseEl = document.getElementById('addTodoCollapse');
            bootstrap.Collapse.getInstance(collapseEl).hide();
            fetchTodos();
        }
    } catch (error) {
        console.error('Submission processing rejected:', error);
    }
});


function openEditModal(id) {
    const todo = cachedTodos.find(t => t._id === id);
    if (!todo) return;

    document.getElementById("edit-todo-id").value = todo._id;
    document.getElementById("edit-todo-title").value = todo.title;
    document.getElementById("edit-todo-desc").value = todo.description || "";
    document.getElementById("edit-todo-status").value = todo.status || "Active";
    
   
    const priorityEl = document.getElementById("edit-todo-priority");
    if(priorityEl) {
        priorityEl.value = todo.priority || "Medium";
    }

    
    if (editTodoModalInstance) {
        editTodoModalInstance.show();
    }
}


document.getElementById("edit-todo-form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const id = document.getElementById("edit-todo-id").value;
    const title = document.getElementById("edit-todo-title").value.trim();
    const description = document.getElementById("edit-todo-desc").value.trim();
    const status = document.getElementById("edit-todo-status").value;
    
    const bodyData = { 
        title, 
        description, 
        status, 
        completed: status === 'Completed' 
    };

    const priorityEl = document.getElementById("edit-todo-priority");
    if(priorityEl) {
        bodyData.priority = priorityEl.value;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        if (response.ok) {
            if (editTodoModalInstance) {
                editTodoModalInstance.hide(); 
            }
            fetchTodos(); 
        }
    } catch (error) {
        console.error('Update processing rejected:', error);
    }
});


function toggleTheme() {
    const htmlTag = document.documentElement;
    const currentTheme = htmlTag.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlTag.setAttribute('data-bs-theme', newTheme);
    
    const icon = document.getElementById('themeIcon');
    if(newTheme === 'dark') {
        icon.className = 'bi bi-sun-fill';
    } else {
        icon.className = 'bi bi-moon-stars-fill';
    }
}


function addBulkRow() {
    const container = document.getElementById('bulk-inputs-container');
    const currentRows = container.getElementsByClassName('bulk-row').length;
    if (currentRows >= 10) return;

    const row = document.createElement('div');
    row.className = 'row g-2 mb-2 bulk-row animate-fade-in';
    row.innerHTML = `
        <div class="col-md-5"><input type="text" class="form-control bulk-title" placeholder="Task summary title" required></div>
        <div class="col-md-4"><input type="text" class="form-control bulk-desc" placeholder="Details description"></div>
        <div class="col-md-2">
            <select class="form-select bulk-prio">
                <option value="Low">Low</option>
                <option value="Medium" selected>Medium</option>
                <option value="High">High</option>
            </select>
        </div>
        <div class="col-md-1 text-center">
            <button type="button" class="btn btn-light text-danger" onclick="this.closest('.row').remove(); updateBulkCounts();"><i class="bi bi-trash"></i></button>
        </div>`;
    container.appendChild(row);
    updateBulkCounts();
}

function updateBulkCounts() {
    const count = document.getElementById('bulk-inputs-container').getElementsByClassName('bulk-row').length;
    document.getElementById('bulk-row-count').innerText = count;
    document.getElementById('bulk-btn-count').innerText = count;
}

async function submitBulkTodos() {
    const rows = document.getElementById('bulk-inputs-container').getElementsByClassName('bulk-row');
    if(rows.length === 0) return;

    for (let row of rows) {
        const title = row.querySelector('.bulk-title').value.trim();
        const description = row.querySelector('.bulk-desc').value.trim();
        const priority = row.querySelector('.bulk-prio').value;

        if (title) {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, priority, status: 'Active' })
            });
        }
    }
    bootstrap.Modal.getInstance(document.getElementById('bulkAddModal')).hide();
    fetchTodos();
}


async function deleteTodo(id) {
    if (!confirm('Erase this task signature from cloud servers?')) return;
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (response.ok) fetchTodos();
}


async function deleteAllTodos() {
    if (!confirm('CRITICAL WARNING: Are you sure you want to completely clear the entire database cluster? This cannot be undone.')) return;
    alert("Wipe triggers configured! Clear your mongoose endpoints easily.");
}


async function toggleStatus(id, currentStatus) {
    const nextStatus = currentStatus === 'Completed' ? 'Active' : 'Completed';
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus, completed: nextStatus === 'Completed' })
        });
        
        if (response.ok) {
         
            await fetchTodos(); 
        }
    } catch (error) {
        console.error('Status toggle failed:', error);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    
    const editModalEl = document.getElementById('editTodoModal');
    if (editModalEl) {
        editTodoModalInstance = new bootstrap.Modal(editModalEl);
    }
    
    addBulkRow();
    fetchTodos();
});