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
  const semesterStart = new Date('2025-07-21T00:00:00');

  function getClassDate(weekdayName) {
    const targetDay = days.indexOf(weekdayName);
    const delta = (targetDay - semesterStart.getDay() + 7) % 7;
    const classDate = new Date(semesterStart);
    classDate.setDate(semesterStart.getDate() + delta);
    return classDate;
  }

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

  let ics = `BEGIN:VCALENDAR\nVERSION:2.0\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nPRODID:-//Utax Timetable Generator//EN\n`;

  timetable.forEach(entry => {
    const classDate = getClassDate(entry.day);

    const [startHour, startMin] = entry.startTime.split(":").map(Number);
    const [endHour, endMin] = entry.endTime.split(":").map(Number);

    const start = new Date(classDate);
    start.setHours(startHour, startMin);

    const end = new Date(classDate);
    end.setHours(endHour, endMin);

    const uid = `${entry.rawText}-${start.toISOString()}`;
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let typeLabel = 'THEORY';
    let color = '11'; // Blue
    if (entry.slot && entry.slot.toUpperCase().startsWith('L')) {
      typeLabel = 'LAB';
      color = '1'; // Red
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
