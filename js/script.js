// ============================================
// TASKFLOW — TASK MANAGER APPLICATION
// ============================================


// 1. Select HTML Elements

const taskModal = document.getElementById("taskModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");

const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskCategory = document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority");
const taskDate = document.getElementById("taskDate");

const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");

const filterButtons = document.querySelectorAll(".filter-btn");

const totalTasksElement = document.getElementById("totalTasks");
const completedTasksElement = document.getElementById("completedTasks");
const pendingTasksElement = document.getElementById("pendingTasks");

const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");
const progressBadge = document.getElementById("progressBadge");
const progressMessage = document.getElementById("progressMessage");
const progressTrack = document.getElementById("progressTrack");

const upcomingList = document.getElementById("upcomingList");
const todayLabel = document.getElementById("todayLabel");


// 2. Load Saved Tasks

function loadTasks() {
    try {
        const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];

        return savedTasks.map(task => ({
            ...task,
            priority: ["High", "Medium", "Low"].includes(task.priority)
                ? task.priority
                : "Medium"
        }));

    } catch (error) {
        console.error("Could not load saved tasks:", error);
        return [];
    }
}

let tasks = loadTasks();

let currentFilter = "all";
let searchQuery = "";


// 3. Save Tasks

function saveTasks() {
    try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    } catch (error) {
        showNotification("Could not save tasks in this browser.", "delete");
        console.error("Could not save tasks:", error);
    }
}


// 4. Notifications

function showNotification(message, type = "success") {

    const oldNotification = document.querySelector(".notification");

    if (oldNotification) {
        oldNotification.remove();
    }

    const notification = document.createElement("div");

    notification.className = `notification ${type}`;
    notification.setAttribute("role", "status");
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 2800);
}


// 5. Modal Controls

function openModal() {
    taskModal.classList.add("show");
    taskModal.setAttribute("aria-hidden", "false");
    taskTitle.focus();
}

function closeModal() {
    taskModal.classList.remove("show");
    taskModal.setAttribute("aria-hidden", "true");
    taskForm.reset();
    clearErrors();
}

openModalBtn.addEventListener("click", openModal);

closeModalBtn.addEventListener("click", closeModal);

cancelBtn.addEventListener("click", closeModal);

taskModal.addEventListener("click", event => {

    if (event.target === taskModal) {
        closeModal();
    }

});

document.addEventListener("keydown", event => {

    if (event.key === "Escape" && taskModal.classList.contains("show")) {
        closeModal();
    }

    if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
    ) {
        event.preventDefault();
        searchInput.focus();
    }

});


// 6. Form Validation

function clearErrors() {

    document.getElementById("titleError").textContent = "";
    document.getElementById("categoryError").textContent = "";
    document.getElementById("dateError").textContent = "";

}

function validateForm() {

    clearErrors();

    let isValid = true;

    if (taskTitle.value.trim() === "") {

        document.getElementById("titleError").textContent =
            "Please enter a task title.";

        isValid = false;

    }

    if (taskCategory.value === "") {

        document.getElementById("categoryError").textContent =
            "Please choose a category.";

        isValid = false;

    }

    if (taskDate.value === "") {

        document.getElementById("dateError").textContent =
            "Please choose a due date.";

        isValid = false;

    } else {

        const selectedDate = new Date(taskDate.value + "T00:00:00");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(selectedDate.getTime()) || selectedDate < today) {

            document.getElementById("dateError").textContent =
                "Due date cannot be in the past.";

            isValid = false;

        }

    }

    return isValid;

}


// 7. Add New Task

taskForm.addEventListener("submit", event => {

    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const newTask = {

        id: (window.crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : String(Date.now() + Math.random()),

        title: taskTitle.value.trim(),

        category: taskCategory.value,

        priority: taskPriority.value,

        date: taskDate.value,

        completed: false,

        createdAt: new Date().toISOString()

    };

    tasks.push(newTask);

    saveTasks();

    currentFilter = "all";
    searchQuery = "";
    searchInput.value = "";

    updateActiveFilterButton();

    renderTasks();

    closeModal();

    showNotification("Your task has been added.");

});


// 8. Date Helpers

function parseLocalDate(dateString) {
    return new Date(dateString + "T00:00:00");
}

function formatDate(dateString) {

    return parseLocalDate(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

}

function getDateLabel(dateString) {

    const date = parseLocalDate(dateString);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) {
        return "Today";
    }

    if (date.getTime() === tomorrow.getTime()) {
        return "Tomorrow";
    }

    return formatDate(dateString);

}


// 9. Render Tasks

function renderTasks() {

    taskList.innerHTML = "";

    let visibleTasks = [...tasks];

    if (currentFilter === "active") {

        visibleTasks = visibleTasks.filter(task => !task.completed);

    }

    if (currentFilter === "completed") {

        visibleTasks = visibleTasks.filter(task => task.completed);

    }

    if (searchQuery) {

        visibleTasks = visibleTasks.filter(task => {

            const searchableText =
                `${task.title} ${task.category} ${task.priority}`.toLowerCase();

            return searchableText.includes(searchQuery);

        });

    }

    visibleTasks.sort((a, b) => {

        if (a.completed !== b.completed) {
            return Number(a.completed) - Number(b.completed);
        }

        return parseLocalDate(a.date) - parseLocalDate(b.date);

    });


    if (visibleTasks.length === 0) {

        const empty = document.createElement("div");

        empty.className = "empty-state";

        const hasSearchOrFilter = searchQuery || currentFilter !== "all";

        empty.innerHTML = `
            <div class="empty-icon">${hasSearchOrFilter ? "⌕" : "✓"}</div>
            <h3>${hasSearchOrFilter ? "No matching tasks" : "Your list is clear"}</h3>
            <p>${hasSearchOrFilter
                ? "Try another search or choose a different filter."
                : "Add your first task and start building momentum."}</p>
        `;

        taskList.appendChild(empty);

    } else {

        visibleTasks.forEach(task => {
            taskList.appendChild(createTaskElement(task));
        });

    }

    updateStatistics();
    updateProgress();
    updateUpcomingTasks();
    updateFilterCounts();

}


// 10. Create Task Element

function createTaskElement(task) {

    const row = document.createElement("article");

    row.className = `task-item${task.completed ? " completed" : ""}`;


    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = Boolean(task.completed);

    checkbox.setAttribute(
        "aria-label",
        `Mark ${task.title} as completed`
    );

    checkbox.addEventListener("change", () => {
        toggleTask(task.id);
    });


    const details = document.createElement("div");

    details.className = "task-details";


    const title = document.createElement("h3");

    title.textContent = task.title;


    const due = document.createElement("p");

    due.textContent = `Due ${getDateLabel(task.date)}`;


    details.append(title, due);


    const meta = document.createElement("div");

    meta.className = "task-meta";


    const category = document.createElement("span");

    category.className = "task-category";
    category.textContent = task.category || "Other";


    const priorityValue = ["High", "Medium", "Low"].includes(task.priority)
        ? task.priority
        : "Medium";

    const priority = document.createElement("span");

    priority.className = `priority-badge ${priorityValue.toLowerCase()}`;
    priority.textContent = `${priorityValue} priority`;


    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "delete-task";
    deleteButton.textContent = "Delete";

    deleteButton.setAttribute(
        "aria-label",
        `Delete ${task.title}`
    );

    deleteButton.addEventListener("click", () => {
        deleteTask(task.id);
    });


    meta.append(category, priority);

    row.append(checkbox, details, meta, deleteButton);

    return row;

}


// 11. Update Statistics

function updateStatistics() {

    const total = tasks.length;

    const completed = tasks.filter(task => task.completed).length;

    const pending = total - completed;

    totalTasksElement.textContent = total;

    completedTasksElement.textContent = completed;

    pendingTasksElement.textContent = pending;

}


// 12. Progress Overview

function updateProgress() {

    const total = tasks.length;

    const completed = tasks.filter(task => task.completed).length;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);


    progressFill.style.width = `${percentage}%`;

    progressPercent.textContent = `${percentage}%`;

    progressBadge.textContent = `${percentage}% complete`;

    progressTrack.setAttribute("aria-valuenow", percentage);


    if (total === 0) {

        progressMessage.textContent =
            "Every completed task is a win.";

    } else if (percentage === 100) {

        progressMessage.textContent =
            "Amazing work — everything is complete!";

    } else if (percentage >= 60) {

        progressMessage.textContent =
            "You're making great progress. Keep going!";

    } else if (percentage > 0) {

        progressMessage.textContent =
            "Nice start. Keep the momentum going.";

    } else {

        progressMessage.textContent =
            "Your next win is one task away.";

    }

}


// 13. Upcoming Tasks

function updateUpcomingTasks() {

    upcomingList.innerHTML = "";

    const upcoming = tasks
        .filter(task => !task.completed)
        .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date))
        .slice(0, 3);


    if (upcoming.length === 0) {

        const message = document.createElement("p");

        message.className = "upcoming-empty";

        message.textContent = tasks.length
            ? "All caught up — no pending deadlines."
            : "Your upcoming deadlines will appear here.";

        upcomingList.appendChild(message);

        return;

    }


    upcoming.forEach(task => {

        const item = document.createElement("div");

        item.className = "upcoming-item";


        const date = parseLocalDate(task.date);

        const dateBox = document.createElement("div");

        dateBox.className = "upcoming-date";

        dateBox.innerHTML = `
            <span>${date.toLocaleDateString("en-US", {
                month: "short"
            }).toUpperCase()}</span>
            <br>
            <strong>${date.getDate()}</strong>
        `;


        const info = document.createElement("div");

        info.className = "upcoming-info";


        const title = document.createElement("strong");

        title.textContent = task.title;


        const sub = document.createElement("span");

        sub.textContent =
            `${getDateLabel(task.date)} · ${task.priority || "Medium"} priority`;


        info.append(title, sub);

        item.append(dateBox, info);

        upcomingList.appendChild(item);

    });

}


// 14. Complete Task

function toggleTask(taskId) {

    tasks = tasks.map(task => {

        if (task.id === taskId) {

            return {
                ...task,
                completed: !task.completed
            };

        }

        return task;

    });

    saveTasks();

    renderTasks();

    showNotification("Task status updated.");

}


// 15. Delete Task

function deleteTask(taskId) {

    const taskToDelete = tasks.find(task => task.id === taskId);

    if (!taskToDelete) {
        return;
    }

    const confirmed = confirm(
        `Delete "${taskToDelete.title}"?`
    );

    if (!confirmed) {
        return;
    }

    tasks = tasks.filter(task => task.id !== taskId);

    saveTasks();

    renderTasks();

    showNotification("Task deleted.", "delete");

}


// 16. Filter Tasks

function updateActiveFilterButton() {

    filterButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.filter === currentFilter
        );

    });

}

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        currentFilter = button.dataset.filter;

        updateActiveFilterButton();

        renderTasks();

    });

});


// 17. Filter Counts

function updateFilterCounts() {

    const total = tasks.length;

    const active = tasks.filter(task => !task.completed).length;

    const completed = tasks.filter(task => task.completed).length;

    document.getElementById("allCount").textContent = total;

    document.getElementById("activeCount").textContent = active;

    document.getElementById("completedCount").textContent = completed;

}


// 18. Search Tasks

searchInput.addEventListener("input", event => {

    searchQuery = event.target.value.trim().toLowerCase();

    renderTasks();

});


// 19. Initial Setup

todayLabel.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
});

renderTasks();