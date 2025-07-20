document.getElementById('file-upload').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = JSON.parse(e.target.result);
    generateICS(data);
  };
  reader.readAsText(file);
});

function generateICS(timetable) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const startDate = new Date();
  while (days[startDate.getDay()] !== 'Monday') {
    startDate.setDate(startDate.getDate() + 1);
  }

  let ics = `BEGIN:VCALENDAR\nVERSION:2.0\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nPRODID:-//Utax Timetable Generator//EN\n`;

  timetable.forEach(entry => {
    const dayIndex = days.indexOf(entry.day);
    const classDate = new Date(startDate);
    classDate.setDate(startDate.getDate() + (dayIndex - 1));

    const [startHour, startMin] = entry.startTime.split(":").map(Number);
    const [endHour, endMin] = entry.endTime.split(":").map(Number);

    const start = new Date(classDate.getFullYear(), classDate.getMonth(), classDate.getDate(), startHour, startMin);
    const end = new Date(classDate.getFullYear(), classDate.getMonth(), classDate.getDate(), endHour, endMin);

    const uid = `${entry.rawText}-${start.toISOString()}`;
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const formatLocalDate = date => {
      const pad = n => String(n).padStart(2, '0');
      return (
        date.getFullYear() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        'T' +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        '00'
      );
    };

    let typeLabel = 'THEORY';
    let color = '11'; // Default: Blue (Theory)
    if (entry.slot && entry.slot.toUpperCase().startsWith('L')) {
      typeLabel = 'LAB';
      color = '1'; // Red (Lab)
    }

    const courseTitle = entry.courseName.replace(/\s*\(.*?\)\s*/g, '').trim();
    const summary = `${courseTitle} [${typeLabel}]`;
    const location = `${entry.block} - ${entry.room}`;
    const description = `${courseTitle} at ${entry.block} ${entry.room} [${typeLabel}]`;
    const untilDate = '20251121T235900Z';

    ics += `BEGIN:VEVENT\n`;
    ics += `UID:${uid}\n`;
    ics += `DTSTAMP:${dtStamp}\n`;
    ics += `DTSTART;TZID=Asia/Kolkata:${formatLocalDate(start)}\n`;
    ics += `DTEND;TZID=Asia/Kolkata:${formatLocalDate(end)}\n`;
    ics += `RRULE:FREQ=WEEKLY;UNTIL=${untilDate}\n`;
    ics += `SUMMARY:${summary}\n`;
    ics += `LOCATION:${location}\n`;
    ics += `DESCRIPTION:${description}\n`;
    ics += `X-GOOGLE-CALENDAR-COLOR:${color}\n`;
    ics += `BEGIN:VALARM\nTRIGGER:-PT30M\nACTION:DISPLAY\nDESCRIPTION:Reminder\nEND:VALARM\n`;
    ics += `BEGIN:VALARM\nTRIGGER:-PT15M\nACTION:DISPLAY\nDESCRIPTION:Reminder\nEND:VALARM\n`;
    ics += `END:VEVENT\n`;
  });

  ics += `END:VCALENDAR`;

  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'timetable.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
