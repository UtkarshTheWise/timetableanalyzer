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
  const semesterStart = new Date('2025-07-21T00:00:00'); // Monday

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

  const crlf = '\r\n';

  let ics = `BEGIN:VCALENDAR${crlf}`;
  ics += `VERSION:2.0${crlf}`;
  ics += `CALSCALE:GREGORIAN${crlf}`;
  ics += `METHOD:PUBLISH${crlf}`;
  ics += `PRODID:-//Utax Timetable Generator//EN${crlf}`;

  // Define Asia/Kolkata timezone
  ics += `BEGIN:VTIMEZONE${crlf}`;
  ics += `TZID:Asia/Kolkata${crlf}`;
  ics += `X-LIC-LOCATION:Asia/Kolkata${crlf}`;
  ics += `BEGIN:STANDARD${crlf}`;
  ics += `TZOFFSETFROM:+0530${crlf}`;
  ics += `TZOFFSETTO:+0530${crlf}`;
  ics += `TZNAME:IST${crlf}`;
  ics += `DTSTART:19700101T000000${crlf}`;
  ics += `END:STANDARD${crlf}`;
  ics += `END:VTIMEZONE${crlf}`;

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

    ics += `BEGIN:VEVENT${crlf}`;
    ics += `UID:${uid}${crlf}`;
    ics += `DTSTAMP:${dtStamp}${crlf}`;
    ics += `DTSTART;TZID=Asia/Kolkata:${formatLocalDate(start)}${crlf}`;
    ics += `DTEND;TZID=Asia/Kolkata:${formatLocalDate(end)}${crlf}`;
    ics += `RRULE:FREQ=WEEKLY;UNTIL=${untilDate}${crlf}`;
    ics += `SUMMARY:${summary}${crlf}`;
    ics += `LOCATION:${location}${crlf}`;
    ics += `DESCRIPTION:${description}${crlf}`;
    ics += `X-GOOGLE-CALENDAR-COLOR:${color}${crlf}`;
    ics += `BEGIN:VALARM${crlf}TRIGGER:-PT30M${crlf}ACTION:DISPLAY${crlf}DESCRIPTION:Reminder${crlf}END:VALARM${crlf}`;
    ics += `BEGIN:VALARM${crlf}TRIGGER:-PT15M${crlf}ACTION:DISPLAY${crlf}DESCRIPTION:Reminder${crlf}END:VALARM${crlf}`;
    ics += `END:VEVENT${crlf}`;
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

