document.getElementById("file-upload").addEventListener("change", handleFileUpload);

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      const calendarData = generateICS(data);
      downloadICS(calendarData);
    } catch (err) {
      alert("Invalid JSON file.");
      console.error(err);
    }
  };
  reader.readAsText(file);
}

function generateICS(timetable) {
  const dayMap = {
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
    "Saturday": 6,
    "Sunday": 0,
  };

  const pad = (n) => (n < 10 ? "0" + n : n);
  const now = new Date();
  const nextWeekMonday = new Date(now.setDate(now.getDate() + ((8 - now.getDay()) % 7)));

  const escapeICS = (str) =>
    str.replace(/\\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Timetable
X-WR-TIMEZONE:Asia/Kolkata
`;

  timetable.forEach((entry, index) => {
    const { day, startTime, endTime, courseName, block, room } = entry;
    const dow = dayMap[day];
    if (dow === undefined) return;

    const eventDate = new Date(nextWeekMonday);
    eventDate.setDate(nextWeekMonday.getDate() + dow - 1);

    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);

    const start = new Date(eventDate);
    const end = new Date(eventDate);
    start.setHours(sh, sm, 0);
    end.setHours(eh, em, 0);

    const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const uid = `class-${index}-${Date.now()}@utax-calendar`;

    const formatDate = (d) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    const location = escapeICS(`${block}, Room ${room}`);
    const summary = escapeICS(courseName);
    const description = escapeICS(`${courseName} in ${block} Room ${room}`);
    const category = entry.type === "LAB" ? "Lab" : "Theory";
    let color = '11';
    if (entry.room.endsWith('L')) color = '1';

    ics += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtStamp}
DTSTART;TZID=Asia/Kolkata:${formatDate(start)}
DTEND;TZID=Asia/Kolkata:${formatDate(end)}
SUMMARY:${summary}
LOCATION:${location}
DESCRIPTION:${description}
CATEGORIES:${category}
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Reminder
X-GOOGLE-CALENDAR-COLOR:${color}
END:VALARM
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
`;
  });

  ics += `END:VCALENDAR`;
  return ics;
}

function downloadICS(content) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Timetable.ics";
  a.click();
  URL.revokeObjectURL(url);
}
