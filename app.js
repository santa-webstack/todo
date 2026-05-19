
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let productivityChart = null;
let editModal = null;
let bulkModal = null;

document.addEventListener('DOMContentLoaded', () => {
  
    editModal = new bootstrap.Modal(document.getElementById('editTodoModal'));
    bulkModal = new bootstrap.Modal(document.getElementById('bulkAddModal'));
    
   
    initChart();
    renderTodos();

    
    document.getElementById('todo-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const title = document.getElementById('todo-input').value;
        const priority = document.getElementById('todo-priority-select').value;
        const status = document.getElementById('todo-status-select').value;
        const desc = document.getElementById('todo-desc').value;

        const newTodo = {
            id: 'todo_' + Date.now(),
            title,
            priority,
            status,
            desc,
            date: new Date().toLocaleDateString()
        };

        todos.push(newTodo);
        saveAndReload();

        this.reset();

        bootstrap.Collapse.getInstance(
            document.getElementById('addTodoCollapse')
        ).hide();
    });

    
    document.getElementById('edit-todo-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const id = document.getElementById('edit-todo-id').value;

        const todo = todos.find(t => t.id === id);

        if (todo) {
            todo.title = document.getElementById('edit-todo-title').value;
            todo.desc = document.getElementById('edit-todo-desc').value;
            todo.status = document.getElementById('edit-todo-status').value;
            todo.priority = document.getElementById('edit-todo-priority').value;

            saveAndReload();
            editModal.hide();
        }
    });
});


function initChart() {

    const ctx = document
        .getElementById('productivityChart')
        .getContext('2d');

    productivityChart = new Chart(ctx, {
        type: 'doughnut',

        data: {
            labels: ['Completed', 'Remaining'],

            datasets: [{
                data: [0, 100],

               
                backgroundColor: [
                    '#25c38e',
                    '#0d6efd'
                ],

                borderWidth: 0
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            cutout: '75%',

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    enabled: true
                }
            }
        }
    });
}


function updateDashboardMetrics() {

    const total = todos.length;

    const active = todos.filter(
        t => t.status === 'Active'
    ).length;

    const completed = todos.filter(
        t => t.status === 'Completed'
    ).length;

    const high = todos.filter(
        t => t.priority === 'High'
    ).length;

    
    document.getElementById('count-total').innerText = total;
    document.getElementById('count-active').innerText = active;
    document.getElementById('count-completed').innerText = completed;
    document.getElementById('count-high').innerText = high;

    let completionRate = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    if (productivityChart) {

        productivityChart.data.datasets[0].data = [
            completionRate,
            100 - completionRate
        ];

       
        productivityChart.data.datasets[0].backgroundColor = [
            '#25c38e',
            '#0d6efd'
        ];

        productivityChart.update();
    }

    document.getElementById('item-showing-text').innerText =
        `Displaying ${total} workflow cores total.`;
}


function renderTodos(filteredTodos = null) {

    const targetList = filteredTodos || todos;

    const container = document.getElementById('todo-container');

    container.innerHTML = '';

    if (targetList.length === 0) {

        container.innerHTML = `
            <div class="text-center p-5 bg-glass rounded-4 text-muted">
                No operational logs found in cluster.
            </div>
        `;

        updateDashboardMetrics();

        return;
    }

    targetList.forEach(todo => {

        let badgeColor =
            todo.priority === 'High'
                ? 'danger'
                : (
                    todo.priority === 'Medium'
                        ? 'warning text-dark'
                        : 'success'
                );

        let statusIcon =
            todo.status === 'Completed'
                ? 'bi-check-circle-fill text-success'
                : (
                    todo.status === 'Active'
                        ? 'bi-play-circle-fill text-info'
                        : 'bi-pause-circle-fill text-secondary'
                );

        const card = document.createElement('div');

        card.className = `
            todo-item-card
            bg-glass
            p-3
            rounded-4
            border
            d-flex
            justify-content-between
            align-items-center
        `;

        card.innerHTML = `
            <div class="d-flex align-items-center gap-3">

                <span class="fs-4">
                    ${todo.status === 'Completed' ? '🎯' : '⚡'}
                </span>

                <div>

                    <h5 class="fw-bold mb-1 ${
                        todo.status === 'Completed'
                            ? 'text-decoration-line-through text-muted'
                            : ''
                    }">
                        ${todo.title}
                    </h5>

                    <p class="small text-muted mb-0">
                        ${todo.desc || 'No description logged.'}
                    </p>

                    <div class="d-flex gap-2 mt-2">

                        <span class="badge bg-${badgeColor} rounded-pill">
                            ${todo.priority}
                        </span>

                        <span class="badge bg-light text-dark border rounded-pill">
                            <i class="bi ${statusIcon} me-1"></i>
                            ${todo.status}
                        </span>

                    </div>

                </div>

            </div>

            <div class="d-flex gap-1">

                <button
                    class="btn btn-sm btn-light border rounded-3"
                    onclick="openEditModal('${todo.id}')"
                >
                    <i class="bi bi-pencil-fill text-primary"></i>
                </button>

                <button
                    class="btn btn-sm btn-light border rounded-3"
                    onclick="deleteTodo('${todo.id}')"
                >
                    <i class="bi bi-trash3-fill text-danger"></i>
                </button>

            </div>
        `;

        container.appendChild(card);
    });

    updateDashboardMetrics();
}


function filterAndSearchTodos() {

    const searchVal = document
        .getElementById('search-input')
        .value
        .toLowerCase();

    const filterVal = document
        .getElementById('status-filter')
        .value;

    const result = todos.filter(todo => {

        const matchesSearch =
            todo.title.toLowerCase().includes(searchVal)
            ||
            todo.desc.toLowerCase().includes(searchVal);

        const matchesFilter =
            filterVal === 'All'
            ||
            todo.status === filterVal;

        return matchesSearch && matchesFilter;
    });

    renderTodos(result);
}


function openEditModal(id) {

    const todo = todos.find(t => t.id === id);

    if (todo) {

        document.getElementById('edit-todo-id').value = todo.id;
        document.getElementById('edit-todo-title').value = todo.title;
        document.getElementById('edit-todo-desc').value = todo.desc;
        document.getElementById('edit-todo-status').value = todo.status;
        document.getElementById('edit-todo-priority').value = todo.priority;

        editModal.show();
    }
}


function deleteTodo(id) {

    todos = todos.filter(t => t.id !== id);

    saveAndReload();
}

function deleteAllTodos() {

    if (
        confirm(
            "Are you sure you want to wipe the entire workspace architecture?"
        )
    ) {
        todos = [];

        saveAndReload();
    }
}


function initBulkModal() {

    const container =
        document.getElementById('bulk-inputs-container');

    container.innerHTML = '';

    addBulkRow();
}

function addBulkRow() {

    const container =
        document.getElementById('bulk-inputs-container');

    const currentRows =
        container.getElementsByClassName('bulk-row').length;

    if (currentRows >= 10) return;

    const row = document.createElement('div');

    row.className = 'row g-2 mb-2 bulk-row';

    row.innerHTML = `
        <div class="col-md-6">
            <input
                type="text"
                class="form-control form-control-sm bulk-title"
                placeholder="Parallel Task Title..."
                required
            >
        </div>

        <div class="col-md-3">
            <select class="form-select form-select-sm bulk-priority">

                <option value="Low">Low</option>

                <option value="Medium" selected>
                    Medium
                </option>

                <option value="High">
                    High
                </option>

            </select>
        </div>

        <div class="col-md-3">
            <select class="form-select form-select-sm bulk-status">

                <option value="Active">
                    Active
                </option>

                <option value="Inactive">
                    Inactive
                </option>

            </select>
        </div>
    `;

    container.appendChild(row);

    updateBulkCounts();
}

function updateBulkCounts() {

    const count =
        document
            .getElementById('bulk-inputs-container')
            .getElementsByClassName('bulk-row').length;

    document.getElementById('bulk-row-count').innerText = count;

    document.getElementById('bulk-btn-count').innerText = count;
}

function submitBulkTodos() {

    const container =
        document.getElementById('bulk-inputs-container');

    const rows =
        container.getElementsByClassName('bulk-row');

    let addedCount = 0;

    for (let row of rows) {

        const title =
            row.querySelector('.bulk-title').value;

        const priority =
            row.querySelector('.bulk-priority').value;

        const status =
            row.querySelector('.bulk-status').value;

        if (title.trim() !== "") {

            todos.push({
                id:
                    'todo_' +
                    Date.now() +
                    Math.random().toString(36).substr(2, 5),

                title,
                priority,
                status,

                desc: 'Bulk Deployed Stack Thread',

                date: new Date().toLocaleDateString()
            });

            addedCount++;
        }
    }

    if (addedCount > 0) {

        saveAndReload();

        bulkModal.hide();

    } else {

        alert("Please enter at least one task title.");
    }
}


function saveAndReload() {

    localStorage.setItem(
        'todos',
        JSON.stringify(todos)
    );

    renderTodos();
}


function toggleTheme() {

    const html = document.documentElement;

    const currentTheme =
        html.getAttribute('data-bs-theme');

    const newTheme =
        currentTheme === 'light'
            ? 'dark'
            : 'light';

    html.setAttribute('data-bs-theme', newTheme);

    const icon =
        document.getElementById('themeIcon');

    if (newTheme === 'dark') {

        icon.className = 'bi bi-sun-fill';

    } else {

        icon.className = 'bi bi-moon-stars-fill';
    }

    // চার্ট রি-রেন্ডার
    updateDashboardMetrics();
}
