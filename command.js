(function () {
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const theoryStartTimes = [
    "08:00",
    "08:55",
    "09:50",
    "10:45",
    "11:40",
    "12:35",
    "Lunch",
    "14:00",
    "14:55",
    "15:50",
    "16:45",
    "17:40",
    "18:35",
  ];
  const theoryEndTimes = [
    "08:50",
    "09:45",
    "10:40",
    "11:35",
    "12:30",
    "13:25",
    "Lunch",
    "14:50",
    "15:45",
    "16:40",
    "17:35",
    "18:30",
    "19:25",
  ];
  const labStartTimes = [
    "08:00",
    "08:50",
    "09:50",
    "10:40",
    "11:40",
    "12:30",
    "Lunch",
    "14:00",
    "14:50",
    "15:50",
    "16:40",
    "17:40",
    "18:30",
  ];
  const labEndTimes = [
    "08:50",
    "09:40",
    "10:40",
    "11:30",
    "12:30",
    "13:20",
    "Lunch",
    "14:50",
    "15:40",
    "16:40",
    "17:30",
    "18:30",
    "19:20",
  ];

  function getCourseMap() {
    const courseMap = {};
    const courseCells = document.querySelectorAll(".table-responsive td");

    courseCells.forEach((cell) => {
      const pTags = cell.querySelectorAll("p");
      if (pTags.length >= 1) {
        const rawCourseInfo = pTags[0].innerText.trim();
        const courseType = pTags[1]?.innerText?.trim() ?? "";
        const match = rawCourseInfo.match(/^([A-Z0-9]+)\s*[-–—]\s*(.+)$/);
        if (match) {
          const [_, code, name] = match;
          courseMap[code] = courseType.includes("Embedded Lab")
            ? name
            : courseType
            ? `${name} ${courseType.replace(/[()]/g, "").trim()}`
            : name;
        }
      }
    });
    return courseMap;
  }

  function parseRow(label, day, row) {
  if (!row) return [];
  const cells = Array.from(row.querySelectorAll("td"));
  const dataCells = label === "THEORY" ? cells.slice(2) : cells.slice(1);

  const startTimes = label === "THEORY" ? theoryStartTimes : labStartTimes;
  const endTimes = label === "THEORY" ? theoryEndTimes : labEndTimes;

  const events = [];
  let timeIndex = 0;

  for (let i = 0; i < dataCells.length && timeIndex < startTimes.length; i++) {
    const text = dataCells[i].innerText.trim();
    const startTime = startTimes[timeIndex];
    const endTime = endTimes[timeIndex];

    timeIndex++;

    if (
      !text ||
      text.toLowerCase() === "lunch" ||
      /^[A-Z]+\d+$/.test(text) ||
      startTime === "Lunch"
    )
      continue;

    const parts = text.split("-");
    if (parts.length < 5) continue;

    const [slot, courseCode, subType, block, room, group = ""] = parts;

    events.push({
      day,
      type: label,
      startTime,
      endTime,
      slot,
      courseCode,
      subType,
      block,
      room,
      group,
      rawText: text,
    });
  }

  return events;
}



  function executeParser() {
    try {
      const courseMap = getCourseMap();
      let allEvents = [];
      const rows = Array.from(
        document.querySelectorAll(
          ".table-responsive table#timeTableStyle tbody tr"
        )
      );

      for (let i = 0; i < rows.length - 1; i++) {
        const theoryRow = rows[i];
        const cells = Array.from(theoryRow.querySelectorAll("td"));
        const dayCode = cells[0]?.innerText.trim();
        const label = cells[1]?.innerText.trim();

        if (!dayCode || label !== "THEORY") continue;

        const fullDay = dayOrder.find(
          (d) => d.slice(0, 3).toUpperCase() === dayCode.toUpperCase()
        );
        if (!fullDay) continue;

        allEvents.push(...parseRow("THEORY", fullDay, theoryRow));
        allEvents.push(...parseRow("LAB", fullDay, rows[i + 1]));
        i++;
      }

      const enrichedEvents = allEvents.map((event) => ({
        ...event,
        courseName: courseMap[event.courseCode] || "Unknown Course",
      }));

      const sorted = enrichedEvents.sort((a, b) => {
        const d = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
      });

      const blob = new Blob([JSON.stringify(sorted, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "timetable.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error("Parser failed:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", executeParser);
  } else {
    executeParser();
  }
})();
