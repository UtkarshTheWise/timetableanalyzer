(function () {
  const START_HOUR = 8;
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  function formatTime(hour, minute) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  function getTimeSlot(index, duration) {
    const totalMinutes = index * duration;
    const startHour = Math.floor(START_HOUR + totalMinutes / 60);
    const startMinute = totalMinutes % 60;

    const endMinutesTotal = totalMinutes + duration;
    const endHour = Math.floor(START_HOUR + endMinutesTotal / 60);
    const endMinute = endMinutesTotal % 60;

    return {
      startTime: formatTime(startHour, startMinute),
      endTime: formatTime(endHour, endMinute),
    };
  }

  function getCourseMap() {
    const courseMap = {};
    const courseCells = document.querySelectorAll(".table-responsive td");

    courseCells.forEach(cell => {
      const pTags = cell.querySelectorAll("p");
      if (pTags.length >= 1) {
        const rawCodeName = pTags[0].innerText.trim(); 
        const extra = pTags[1]?.innerText?.trim() ?? ""; 
        const match = rawCodeName.match(/^([A-Z]+\d+)\s*-\s*(.+)$/);

        if (match) {
          const [_, code, name] = match;
          courseMap[code] = extra ? `${name} ${extra}` : name;
        }
      }
    });

    return courseMap;
  }

  function parseRow(label, day = "Monday") {
    const rows = Array.from(document.querySelectorAll('tr[style*="#FFFFCC"]'));
    const row = rows.find(r =>
      r.innerText.includes(label) && r.innerText.includes(day.slice(0, 3).toUpperCase())
    ) || rows.find(r => r.innerText.startsWith(label));

    if (!row) return [];

    const cells = Array.from(row.querySelectorAll("td"));
    const offset = (label === "THEORY") ? 2 : 1;
    const entries = cells.slice(offset);
    const duration = label === "LAB" ? 50 : 55;

    const events = [];

    entries.forEach((cell, index) => {
      const text = cell.innerText.trim();
      if (!text || text.toLowerCase() === "lunch") return;

      const parts = text.split("-");
      if (parts.length < 5) return;

      const { startTime, endTime } = getTimeSlot(index, duration);

      events.push({
        day,
        type: label,
        startTime,
        endTime,
        slot: parts[0],
        courseCode: parts[1],
        subType: parts[2],
        block: parts[3],
        room: parts[4],
        group: parts[5] || "",
        rawText: text
      });
    });

    return events;
  }

  const courseMap = getCourseMap();

  const allEvents = [];

  dayOrder.forEach(day => {
    allEvents.push(...parseRow("THEORY", day), ...parseRow("LAB", day));
  });

  const enrichedEvents = allEvents.map(event => ({
    ...event,
    courseName: courseMap[event.courseCode] || "Unknown Course"
  }));

  const sortedEvents = enrichedEvents.sort((a, b) => {
    const dayCompare = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    if (dayCompare !== 0) return dayCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  const blob = new Blob([JSON.stringify(sortedEvents, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "timetable.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
})();
