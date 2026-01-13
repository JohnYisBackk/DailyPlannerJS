document.addEventListener("DOMContentLoaded", function () {
  // ---------------- Elements ----------------
  const monthYearEl = document.getElementById("month-year");
  const daysEl = document.getElementById("days");
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");
  const eventPanel = document.getElementById("event-panel");
  const eventDateEl = document.getElementById("event-date");
  const eventListEl = document.getElementById("event-list");
  const addEventBtn = document.getElementById("add-event");
  const deleteEventBtn = document.getElementById("delete-event");
  const eventTimeInput = document.getElementById("event-time");
  const eventTextInput = document.getElementById("event-text");
  const eventPriorityInput = document.getElementById("event-priority");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const emojiBtn = document.getElementById("emoji-btn");
  const emojiPicker = document.getElementById("emoji-picker");
  const footerLeft = document.getElementById("footer-left");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  let currentDate = new Date();
  let selectedDate = null;
  let editingEventIndex = null;
  let dragData = null;

  let events = JSON.parse(localStorage.getItem("events")) || {};

  // ---------------- Motivačné citáty ----------------
  const quotes = [
    "Don't watch the clock; do what it does. Keep going.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "Push yourself, because no one else is going to do it for you.",
    "Dream it. Wish it. Do it.",
    "Believe you can and you're halfway there.",
    "The only bad workout is the one that didn’t happen.",
    "Strive for progress, not perfection.",
    "Your limitation—it’s only your imagination.",
    "Great things never come from comfort zones.",
    "Do something today that your future self will thank you for.",
    "Little things make big days.",
    "Don't stop when you're tired. Stop when you're done.",
    "Sometimes later becomes never. Do it now.",
    "Don’t wait for opportunity. Create it.",
    "The harder you work for something, the greater you’ll feel when you achieve it.",
  ];

  const quoteEl = document.createElement("div");
  quoteEl.id = "motivational-quote";
  quoteEl.style.fontStyle = "italic";
  quoteEl.style.textAlign = "center";
  quoteEl.style.marginBottom = "10px";
  quoteEl.style.color = "var(--secondary)";
  document.getElementById("event-panel").prepend(quoteEl);

  function formatDateKey(year, month, day) {
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }

  function getQuoteForDate(date) {
    if (!date) return "Select a date to see your motivation ✨";
    const dateStr = formatDateKey(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % quotes.length;
    return quotes[index];
  }

  function showQuote() {
    quoteEl.textContent = getQuoteForDate(selectedDate);
  }

  function updateButtons() {
    const disabled = !selectedDate;
    addEventBtn.disabled = disabled;
    deleteEventBtn.disabled = disabled;
  }

  function sortEventsByTime(dateKey) {
    if (!events[dateKey]) return;
    events[dateKey].sort((a, b) => {
      if (a.isFullDay && !b.isFullDay) return -1;
      if (!a.isFullDay && b.isFullDay) return 1;
      if (a.isFullDay && b.isFullDay) return -1;
      return a.time?.localeCompare(b.time || "") || 0;
    });
  }

  function updateFooter(dateStr) {
    if (!footerLeft || !progressBar || !progressText) return;

    const dayEvents = events[dateStr] || [];
    const total = dayEvents.length;
    const doneCount = dayEvents.filter((e) => e.done).length;
    const activeCount = total - doneCount;

    if (total === 0) {
      footerLeft.textContent = "No Events Today";
    } else {
      footerLeft.textContent = `📌 ${activeCount} event${
        activeCount !== 1 ? "s" : ""
      } today`;
    }

    // Progress bar
    const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);
    progressBar.style.width = percent + "%";
    progressText.textContent = percent + "%";

    // Win animácia pri 100%
    if (percent === 100 && total > 0) {
      // jednoduchý efekt: blikajúci bar
      progressBar.classList.add("win-animation");

      // voliteľne: text naskočí
      progressText.textContent = "All Done! 🎉";

      // odstránime triedu po pár sekundách
      setTimeout(() => {
        progressBar.classList.remove("win-animation");
        progressText.textContent = "100%";
      }, 3000);
    }
  }

  function showEvents(dateStr) {
    eventListEl.innerHTML = "";
    if (events[dateStr]) {
      sortEventsByTime(dateStr);
      events[dateStr].sort((a, b) =>
        a.done && !b.done ? 1 : !a.done && b.done ? -1 : 0
      );

      events[dateStr].forEach((event, index) => {
        if (!event.priority) event.priority = "low";
        if (event.done === undefined) event.done = false;

        const eventItem = document.createElement("div");
        eventItem.className = `event-item${event.done ? " done" : ""}`;
        eventItem.dataset.index = index;
        eventItem.dataset.date = dateStr;
        eventItem.setAttribute("draggable", "true");

        eventItem.innerHTML = `
          <div class="event-color priority-${event.priority}"></div>
          <div class="event-time">${
            event.isFullDay ? "ALL DAY" : event.time
          }</div>
          <div class="event-text">${event.text}</div>
          <input type="checkbox" class="event-done" ${
            event.done ? "checked" : ""
          } />
        `;
        eventListEl.appendChild(eventItem);

        eventItem.addEventListener("click", (e) => {
          if (e.target.classList.contains("event-done")) return;
          editingEventIndex = parseInt(eventItem.dataset.index);
          eventTimeInput.value = event.time || "";
          eventTextInput.value = event.text;
          eventPriorityInput.value = event.priority || "low";
          addEventBtn.textContent = "Save Changes";
        });

        eventItem.addEventListener("dragstart", () => {
          dragData = { oldDateKey: dateStr, index: index };
        });

        const checkbox = eventItem.querySelector(".event-done");
        checkbox.addEventListener("change", () => {
          event.done = checkbox.checked;
          localStorage.setItem("events", JSON.stringify(events));
          showEvents(dateStr);
          updateFooter(dateStr);
        });
      });
    } else {
      eventListEl.innerHTML = `<div class="no-events">No events scheduled for this day</div>`;
    }

    const [year, month, day] = dateStr.split("-").map(Number);
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    eventDateEl.textContent = `${
      dayNames[new Date(year, month - 1, day).getDay()]
    }, ${months[month - 1]} ${day}, ${year}`;

    updateFooter(dateStr);
  }

  function renderCalendar() {
    const firstDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const lastDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
    const prevLastDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0
    );

    const firstDayIndex = firstDay.getDay();
    const lastDayIndex = lastDay.getDay();
    const nextDays = 7 - lastDayIndex - 1;

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    monthYearEl.textContent = `${
      months[currentDate.getMonth()]
    } ${currentDate.getFullYear()}`;

    let daysHTML = "";

    for (let x = firstDayIndex; x > 0; x--) {
      const prevDate = prevLastDay.getDate() - x + 1;
      const dateKey = formatDateKey(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        prevDate
      );
      const hasEvent = events[dateKey] !== undefined;
      daysHTML += `<div class="day other-month${
        hasEvent ? " has-events" : ""
      }">${prevDate}</div>`;
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        i
      );
      const dateKey = formatDateKey(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        i
      );
      const dayEvents = events[dateKey] || [];

      let dayClass = "day";
      if (date.toDateString() === new Date().toDateString())
        dayClass += " today";
      if (selectedDate && date.toDateString() === selectedDate.toDateString())
        dayClass += " selected";
      if (dayEvents.length > 0) dayClass += " has-events";

      daysHTML += `<div class="${dayClass}" data-date="${dateKey}">${i}</div>`;
    }

    for (let j = 1; j <= nextDays; j++) {
      const dateKey = formatDateKey(
        currentDate.getFullYear(),
        currentDate.getMonth() + 2,
        j
      );
      const hasEvent = events[dateKey] !== undefined;
      daysHTML += `<div class="day other-month${
        hasEvent ? " has-events" : ""
      }">${j}</div>`;
    }

    daysEl.innerHTML = daysHTML;

    document.querySelectorAll(".day:not(.other-month)").forEach((dayEl) => {
      const dateStr = dayEl.dataset.date;
      dayEl.addEventListener("click", () => {
        const [year, month, dayNum] = dateStr.split("-").map(Number);
        selectedDate = new Date(year, month - 1, dayNum);
        editingEventIndex = null;
        addEventBtn.textContent = "Add Event";
        eventTimeInput.value = "";
        eventTextInput.value = "";
        eventPriorityInput.value = "low";

        renderCalendar();
        showEvents(dateStr);
        updateButtons();
        showQuote();
        updateFooter(dateStr);
      });

      dayEl.addEventListener("dragover", (e) => e.preventDefault());
      dayEl.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!dragData) return;

        const { oldDateKey, index } = dragData;
        const newDateKey = dateStr;

        if (!events[newDateKey]) events[newDateKey] = [];

        events[newDateKey].push(events[oldDateKey][index]);
        events[oldDateKey].splice(index, 1);
        if (events[oldDateKey].length === 0) delete events[oldDateKey];

        localStorage.setItem("events", JSON.stringify(events));
        dragData = null;

        renderCalendar();
        if (selectedDate) {
          const selectedKey = formatDateKey(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            selectedDate.getDate()
          );
          showEvents(selectedKey);
        }
      });
    });

    if (selectedDate) {
      const dateKey = formatDateKey(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        selectedDate.getDate()
      );
      updateFooter(dateKey);
    }
  }

  // ---------------- Add / Edit Event ----------------
  addEventBtn.addEventListener("click", () => {
    if (!selectedDate) return;
    const time = eventTimeInput.value.trim();
    const text = eventTextInput.value.trim();
    const priority = eventPriorityInput.value;
    if (!text) return;

    const dateKey = formatDateKey(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      selectedDate.getDate()
    );
    if (!events[dateKey]) events[dateKey] = [];
    const isFullDay = !time;

    if (editingEventIndex !== null) {
      events[dateKey][editingEventIndex] = {
        time: time || null,
        isFullDay,
        text,
        priority,
        done: events[dateKey][editingEventIndex].done || false,
      };
      editingEventIndex = null;
      addEventBtn.textContent = "Add Event";
    } else {
      events[dateKey].push({
        time: time || null,
        isFullDay,
        text,
        priority,
        done: false,
      });
    }

    sortEventsByTime(dateKey);
    localStorage.setItem("events", JSON.stringify(events));
    eventTimeInput.value = "";
    eventTextInput.value = "";
    eventPriorityInput.value = "low";

    showEvents(dateKey);
    renderCalendar();
  });

  // ---------------- Delete Event ----------------
  deleteEventBtn.addEventListener("click", () => {
    if (!selectedDate || editingEventIndex === null) return;
    const dateKey = formatDateKey(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      selectedDate.getDate()
    );
    events[dateKey].splice(editingEventIndex, 1);
    if (events[dateKey].length === 0) delete events[dateKey];

    localStorage.setItem("events", JSON.stringify(events));
    editingEventIndex = null;
    addEventBtn.textContent = "Add Event";
    eventTimeInput.value = "";
    eventTextInput.value = "";
    eventPriorityInput.value = "low";

    showEvents(dateKey);
    renderCalendar();
  });

  // ---------------- Navigation ----------------
  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    selectedDate = null;
    editingEventIndex = null;
    addEventBtn.textContent = "Add Event";
    eventTimeInput.value = "";
    eventTextInput.value = "";
    renderCalendar();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    selectedDate = null;
    editingEventIndex = null;
    addEventBtn.textContent = "Add Event";
    eventTimeInput.value = "";
    eventTextInput.value = "";
    renderCalendar();
  });

  // ---------------- Emoji picker ----------------
  emojiBtn.addEventListener("click", () => {
    emojiPicker.style.display =
      emojiPicker.style.display === "flex" ? "none" : "flex";
  });
  emojiPicker.querySelectorAll("span").forEach((emoji) => {
    emoji.addEventListener("click", () => {
      eventTextInput.value += emoji.textContent;
      emojiPicker.style.display = "none";
    });
  });

  // ---------------- Dark mode toggle ----------------
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    darkModeToggle.classList.toggle("fa-moon");
    darkModeToggle.classList.toggle("fa-sun");
  });

  // ---------------- Initialize ----------------
  renderCalendar();
  updateButtons();
});
